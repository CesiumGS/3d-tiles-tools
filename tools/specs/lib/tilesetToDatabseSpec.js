'use strict';
var Cesium = require('cesium');
var fsExtra = require('fs-extra');
var Promise = require('bluebird');
var sqlite3 = require('sqlite3');
var zlib = require('zlib');
var fileExists = require('../../lib/fileExists');
var isGzipped = require('../../lib/isGzipped');
var tilesetToDatabase = require('../../lib/tilesetToDatabase');

var zlibGunzip = Promise.promisify(zlib.gunzip);
var getStringFromTypedArray = Cesium.getStringFromTypedArray;

var inputDirectory = './specs/data/TilesetOfTilesets/';
var tilesetJsonFile = './specs/data/TilesetOfTilesets/tileset.json';
var outputFile = './specs/data/TilesetOfTilesets.3dtiles';

describe('tilesetToDatabase', function() {
    afterEach(function (done) {
        fsExtra.remove(outputFile)
            .then(done)
            .catch(done.fail);
    });

    it('creates a sqlite database from a tileset', function(done) {
        expect(tilesetToDatabase(inputDirectory, outputFile)
            .then(function() {
                var db;
                return Promise.resolve(fileExists(outputFile))
                    .then(function(exists) {
                        expect(exists).toEqual(true);
                    }).then(function() {
                        db = new sqlite3.Database(outputFile);
                        var dbAll = Promise.promisify(db.all, {context : db});
                        return dbAll("SELECT * FROM media WHERE key='tileset.json'");
                    }).then(function(rows) {
                        expect(rows.length).toEqual(1);

                        var content = rows[0].content;
                        expect(isGzipped(content)).toEqual(true);

                        return Promise.all([
                            zlibGunzip(content),
                            fsExtra.readJson(tilesetJsonFile)
                        ]).then(function(data) {
                            var jsonStr = getStringFromTypedArray(data[0]);
                            var dbTilesetJson = JSON.parse(jsonStr);
                            var tilesetJson = data[1];
                            expect(dbTilesetJson).toEqual(tilesetJson);
                        });
                    }).finally(function() {
                        db.close();
                    });
            }), done).toResolve();
    });

    it('throws an error if no input directory is provided', function() {
        expect(function() {
            tilesetToDatabase(undefined, outputFile);
        }).toThrowError('inputDirectory is required.');
    });

    it('works when no output file is provided', function(done) {
        expect(tilesetToDatabase(inputDirectory)
            .then(function() {
                return fileExists(outputFile)
                    .then(function(exists) {
                        expect(exists).toBe(true);
                    });
            }), done).toResolve();
    });
});

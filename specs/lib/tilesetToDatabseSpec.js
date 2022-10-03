'use strict';
const Cesium = require('cesium');
const fsExtra = require('fs-extra');
const Promise = require('bluebird');
const sqlite3 = require('sqlite3');
const zlib = require('zlib');
const fileExists = require('../../lib/fileExists');
const isGzipped = require('../../lib/isGzipped');
const tilesetToDatabase = require('../../lib/tilesetToDatabase');

const zlibGunzip = Promise.promisify(zlib.gunzip);
const getStringFromTypedArray = Cesium.getStringFromTypedArray;

const inputDirectory = './specs/data/TilesetOfTilesets/';
const tilesetJsonFile = './specs/data/TilesetOfTilesets/tileset.json';
const outputFile = './specs/data/TilesetOfTilesets.3dtiles';

describe('tilesetToDatabase', function() {
    afterEach(function (done) {
        fsExtra.remove(outputFile)
            .then(done)
            .catch(done.fail);
    });

    it('creates a sqlite database from a tileset', function(done) {
        expect(tilesetToDatabase(inputDirectory, outputFile)
            .then(function() {
                let db;
                return Promise.resolve(fileExists(outputFile))
                    .then(function(exists) {
                        expect(exists).toEqual(true);
                    }).then(function() {
                        db = new sqlite3.Database(outputFile);
                        const dbAll = Promise.promisify(db.all, {context : db});
                        return dbAll("SELECT * FROM media WHERE key='tileset.json'");
                    }).then(function(rows) {
                        expect(rows.length).toEqual(1);

                        const content = rows[0].content;
                        expect(isGzipped(content)).toEqual(true);

                        return Promise.all([
                            zlibGunzip(content),
                            fsExtra.readJson(tilesetJsonFile)
                        ]).then(function(data) {
                            const jsonStr = getStringFromTypedArray(data[0]);
                            const dbTilesetJson = JSON.parse(jsonStr);
                            const tilesetJson = data[1];
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

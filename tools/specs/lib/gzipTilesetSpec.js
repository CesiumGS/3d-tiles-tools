'use strict';

var fsExtra = require('fs-extra');
var Promise = require('bluebird');

var gzipTileset = require('../../lib/gzipTileset');

var fsExtraReadFile = Promise.promisify(fsExtra.readFile);
var fsExtraRemove = Promise.promisify(fsExtra.remove);

var tilesetDirectory = './specs/data/TilesetOfTilesets/';
var tilesetJson = './specs/data/TilesetOfTilesets/tileset.json';
var gzippedDirectory = './specs/data/TilesetOfTilesets-gzipped';
var gzippedJson = './specs/data/TilesetOfTilesets-gzipped/tileset.json';
var gunzippedDirectory = './specs/data/TilesetOfTilesets-gunzipped';
var gunzippedJson = './specs/data/TilesetOfTilesets-gunzipped/tileset.json';

function isGzipped(data) {
    return (data[0] === 0x1f) && (data[1] === 0x8b);
}

describe('gzipTileset', function() {
    it('gzips uncompressed tileset', function (done) {
        expect(gzipTileset(tilesetDirectory, gzippedDirectory)
            .then(function() {
                return fsExtraReadFile(gzippedJson)
                    .then(function(data) {
                        expect(isGzipped(data)).toBe(true);
                    })
                    .finally(function() {
                        return fsExtraRemove(gzippedDirectory);
                    });
            }), done).toResolve();
    });

    it('ungzips compressed tileset', function (done) {
        expect(gzipTileset(tilesetDirectory, gzippedDirectory)
            .then(function() {
                return gzipTileset(gzippedDirectory, gunzippedDirectory)
                    .then(function() {
                        return fsExtraReadFile(gunzippedJson)
                            .then(function(data) {
                                expect(isGzipped(data)).toBe(false);
                            })
                            .finally(function() {
                                return Promise.all([
                                    fsExtraRemove(gzippedDirectory),
                                    fsExtraRemove(gunzippedDirectory)
                                ]);
                            });
                    });
            }), done).toResolve();
    });

    it('works when supplying a json file instead of a directory', function (done) {
        expect(gzipTileset(tilesetJson, gzippedDirectory)
            .then(function() {
                return fsExtraReadFile(gzippedJson)
                    .then(function(data) {
                        expect(isGzipped(data)).toBe(true);
                    })
                    .finally(function() {
                        return fsExtraRemove(gzippedDirectory);
                    });
            }), done).toResolve();
    });

    it('works when no output directory is supplied', function (done) {
        expect(gzipTileset(tilesetDirectory)
            .then(function() {
                return fsExtraReadFile(gzippedJson)
                    .then(function(data) {
                        expect(isGzipped(data)).toBe(true);
                    })
                    .finally(function() {
                        return fsExtraRemove(gzippedDirectory);
                    });
            }), done).toResolve();
    });

    it('throws error when no input tileset is given ', function (done) {
        expect(gzipTileset(), done).toRejectWith(Error);
    });

    it('throws error when input tileset does not exist', function (done) {
        expect(gzipTileset('non-existent-tileset', gzippedDirectory), done).toRejectWith(Error);
    });

    it('writes debug info to console when verbose is true', function (done) {
        var spy = spyOn(console, 'log').and.callFake(function(){});
        expect(gzipTileset(tilesetDirectory, gzippedDirectory, true)
            .then(function() {
                expect(spy).toHaveBeenCalled();
                return fsExtraRemove(gzippedDirectory);
            }), done).toResolve();
    });
});

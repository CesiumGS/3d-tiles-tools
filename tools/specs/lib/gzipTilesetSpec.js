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

function isGzipped(path) {
    return fsExtraReadFile(path)
        .then(function (data) {
            return (data[0] === 0x1f) && (data[1] === 0x8b);
        });
}

var gzipOptions = {
    gzip : true
};

var gunzipOptions = {
    gzip : false
};

describe('gzipTileset', function() {
    afterEach(function(done) {
        Promise.all([
            fsExtraRemove(gzippedDirectory),
            fsExtraRemove(gunzippedDirectory)
        ]).then(function() {
            done();
        });
    });

    it('gzips uncompressed tileset', function (done) {
        expect(gzipTileset(tilesetDirectory, gzippedDirectory, gzipOptions)
            .then(function() {
                return isGzipped(gzippedJson)
                    .then(function(isGzipped) {
                        expect(isGzipped).toBe(true);
                    });
            }), done).toResolve();
    });

    it('gunzips compressed tileset', function (done) {
        expect(gzipTileset(tilesetDirectory, gzippedDirectory, gzipOptions)
            .then(function() {
                return gzipTileset(gzippedDirectory, gunzippedDirectory, gunzipOptions)
                    .then(function() {
                        return isGzipped(gunzippedJson)
                            .then(function(isGzipped) {
                                expect(isGzipped).toBe(false);
                            });
                    });
            }), done).toResolve();
    });

    it('works when no output directory is supplied', function (done) {
        expect(gzipTileset(tilesetDirectory)
            .then(function() {
                return isGzipped(gzippedJson)
                    .then(function(isGzipped) {
                        expect(isGzipped).toBe(true);
                    });
            }), done).toResolve();
    });

    it('does not gzip already gzipped tileset', function (done) {
        expect(gzipTileset(tilesetDirectory, gzippedDirectory, gzipOptions)
            .then(function() {
                return gzipTileset(gzippedDirectory, gunzippedDirectory, gzipOptions)
                    .then(function() {
                        var promises = [
                            fsExtraReadFile(gzippedJson),
                            fsExtraReadFile(gunzippedJson)
                        ];
                        return Promise.all(promises)
                            .then(function(contents) {
                                expect(contents[0].equals(contents[1])).toBe(true);
                            });
                    });
            }), done).toResolve();
    });

    it('does not gunzip already gunzipped tileset', function (done) {
        expect(gzipTileset(tilesetDirectory, gunzippedDirectory, gunzipOptions)
            .then(function() {
                var promises = [
                    fsExtraReadFile(tilesetJson),
                    fsExtraReadFile(gunzippedJson)
                ];
                return Promise.all(promises)
                    .then(function(contents) {
                        expect(contents[0].equals(contents[1])).toBe(true);
                    });
            }), done).toResolve();
    });

    it('only gzips tiles when tilesOnly is true', function (done) {
        var options = {
            tilesOnly : true
        };

        expect(gzipTileset(tilesetDirectory, gzippedDirectory, options)
            .then(function() {
                return isGzipped(gzippedJson)
                    .then(function(isGzipped) {
                        expect(isGzipped).toBe(false);
                    });
            }), done).toResolve();
    });

    it('throws error when no input tileset is given', function (done) {
        expect(gzipTileset(), done).toRejectWith(Error);
    });

    it('throws error when input tileset does not exist', function (done) {
        expect(gzipTileset('non-existent-tileset', gzippedDirectory), done).toRejectWith(Error);
    });

    it('writes debug info to console when verbose is true', function (done) {
        var options = {
            verbose : true
        };
        var spy = spyOn(console, 'log').and.callFake(function(){});
        expect(gzipTileset(tilesetDirectory, gzippedDirectory, options)
            .then(function() {
                expect(spy).toHaveBeenCalled();
            }), done).toResolve();
    });
});

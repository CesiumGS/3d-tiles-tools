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
var ungzippedDirectory = './specs/data/TilesetOfTilesets-ungzipped';
var ungzippedJson = './specs/data/TilesetOfTilesets-ungzipped/tileset.json';

function isGzipped(path) {
    return fsExtraReadFile(path)
        .then(function (data) {
            return (data[0] === 0x1f) && (data[1] === 0x8b);
        });
}

var gzipOptions = {
    gzip : true
};

var ungzipOptions = {
    gzip : false
};

describe('gzipTileset', function() {
    afterEach(function(done) {
        Promise.all([
            fsExtraRemove(gzippedDirectory),
            fsExtraRemove(ungzippedDirectory)
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

    it('ungzips compressed tileset', function (done) {
        expect(gzipTileset(tilesetDirectory, gzippedDirectory, gzipOptions)
            .then(function() {
                return gzipTileset(gzippedDirectory, ungzippedDirectory, ungzipOptions)
                    .then(function() {
                        return isGzipped(ungzippedJson)
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
                return gzipTileset(gzippedDirectory, ungzippedDirectory, gzipOptions)
                    .then(function() {
                        var promises = [
                            fsExtraReadFile(gzippedJson),
                            fsExtraReadFile(ungzippedJson)
                        ];
                        return Promise.all(promises)
                            .then(function(contents) {
                                expect(contents[0].equals(contents[1])).toBe(true);
                            });
                    });
            }), done).toResolve();
    });

    it('does not ungzip already ungzipped tileset', function (done) {
        expect(gzipTileset(tilesetDirectory, ungzippedDirectory, ungzipOptions)
            .then(function() {
                var promises = [
                    fsExtraReadFile(tilesetJson),
                    fsExtraReadFile(ungzippedJson)
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

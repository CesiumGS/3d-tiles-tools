'use strict';
var fsExtra = require('fs-extra');
var Promise = require('bluebird');
var isGzipped = require('../../lib/isGzipped');
var gzipTileset = require('../../lib/gzipTileset');

var fsExtraReadFile = Promise.promisify(fsExtra.readFile);
var fsExtraRemove = Promise.promisify(fsExtra.remove);

var tilesetDirectory = './specs/data/TilesetOfTilesets/';
var tilesetJson = './specs/data/TilesetOfTilesets/tileset.json';
var gzippedDirectory = './specs/data/TilesetOfTilesets-gzipped';
var gzippedJson = './specs/data/TilesetOfTilesets-gzipped/tileset.json';
var ungzippedDirectory = './specs/data/TilesetOfTilesets-ungzipped';
var ungzippedJson = './specs/data/TilesetOfTilesets-ungzipped/tileset.json';

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
        var gzipOptions = {
            inputDirectory : tilesetDirectory,
            outputDirectory : gzippedDirectory,
            gzip : true
        };
        expect(gzipTileset(gzipOptions)
            .then(function() {
                return isGzipped(gzippedJson)
                    .then(function(isGzipped) {
                        expect(isGzipped).toBe(true);
                    });
            }), done).toResolve();
    });

    it('ungzips compressed tileset', function (done) {
        var gzipOptions = {
            inputDirectory : tilesetDirectory,
            outputDirectory : gzippedDirectory,
            gzip : true
        };
        var ungzipOptions = {
            inputDirectory : gzippedDirectory,
            outputDirectory : ungzippedDirectory,
            gzip : false
        };
        expect(gzipTileset(gzipOptions)
            .then(function() {
                return gzipTileset(ungzipOptions)
                    .then(function() {
                        return isGzipped(ungzippedJson)
                            .then(function(isGzipped) {
                                expect(isGzipped).toBe(false);
                            });
                    });
            }), done).toResolve();
    });

    it('works when no output directory is supplied', function (done) {
        var gzipOptions = {
            inputDirectory : tilesetDirectory,
            gzip : true
        };
        expect(gzipTileset(gzipOptions)
            .then(function() {
                return isGzipped(gzippedJson)
                    .then(function(isGzipped) {
                        expect(isGzipped).toBe(true);
                    });
            }), done).toResolve();
    });

    it('does not gzip already gzipped tileset', function (done) {
        var gzipOptions = {
            inputDirectory : tilesetDirectory,
            outputDirectory : gzippedDirectory,
            gzip : true
        };
        var gzipAgainOptions = {
            inputDirectory : gzippedDirectory,
            outputDirectory : ungzippedDirectory,
            gzip : true
        };
        expect(gzipTileset(gzipOptions)
            .then(function() {
                return gzipTileset(gzipAgainOptions)
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
        var ungzipOptions = {
            inputDirectory : tilesetDirectory,
            outputDirectory : ungzippedDirectory,
            gzip : false
        };
        expect(gzipTileset(ungzipOptions)
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
        var gzipOptions = {
            inputDirectory : tilesetDirectory,
            outputDirectory : gzippedDirectory,
            gzip : true,
            tilesOnly : true
        };
        expect(gzipTileset(gzipOptions)
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
        var gzipOptions = {
            inputDirectory : 'non-existent-tileset',
            outputDirectory : gzippedDirectory,
            gzip : true
        };
        expect(gzipTileset(gzipOptions), done).toRejectWith(Error);
    });

    it('writes debug info to console when verbose is true', function (done) {
        var gzipOptions = {
            inputDirectory : tilesetDirectory,
            outputDirectory : gzippedDirectory,
            gzip : true,
            verbose : true
        };
        var spy = spyOn(console, 'log').and.callFake(function(){});
        expect(gzipTileset(gzipOptions)
            .then(function() {
                expect(spy).toHaveBeenCalled();
            }), done).toResolve();
    });
});

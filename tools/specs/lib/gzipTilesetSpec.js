'use strict';
var fsExtra = require('fs-extra');
var path = require('path');
var Promise = require('bluebird');
var isGzippedFile = require('../../lib/isGzippedFile');
var gzipTileset = require('../../lib/gzipTileset');

var tilesetDirectory = './specs/data/TilesetOfTilesets/';
var tilesetJson = './specs/data/TilesetOfTilesets/tileset.json';
var gzippedDirectory = './specs/data/TilesetOfTilesets-gzipped';
var gzippedJson = './specs/data/TilesetOfTilesets-gzipped/tileset.json';
var ungzippedDirectory = './specs/data/TilesetOfTilesets-ungzipped';
var ungzippedJson = './specs/data/TilesetOfTilesets-ungzipped/tileset.json';

describe('gzipTileset', function() {
    afterEach(function (done) {
        Promise.all([
            fsExtra.remove(gzippedDirectory),
            fsExtra.remove(ungzippedDirectory)
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
                return isGzippedFile(gzippedJson)
                    .then(function(gzipped) {
                        expect(gzipped).toBe(true);
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
                        return isGzippedFile(ungzippedJson)
                            .then(function(gzipped) {
                                expect(gzipped).toBe(false);
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
                return isGzippedFile(gzippedJson)
                    .then(function(gzipped) {
                        expect(gzipped).toBe(true);
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
                            fsExtra.readFile(gzippedJson),
                            fsExtra.readFile(ungzippedJson)
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
                    fsExtra.readFile(tilesetJson),
                    fsExtra.readFile(ungzippedJson)
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
                return isGzippedFile(gzippedJson)
                    .then(function(gzipped) {
                        expect(gzipped).toBe(false);
                    });
            }), done).toResolve();
    });

    it('throws error when no input tileset is given', function () {
        expect(function() {
            gzipTileset();
        }).toThrowDeveloperError();
    });

    it('throws error when input tileset does not exist', function (done) {
        var gzipOptions = {
            inputDirectory : 'non-existent-tileset',
            outputDirectory : gzippedDirectory,
            gzip : true
        };
        expect(gzipTileset(gzipOptions), done).toRejectWith(Error);
    });

    it('accepts custom writeCallback that does not return a promise', function (done) {
        var writeCallback = function(file, data) {
            console.log('Save file ' + file + ' with data ' + data);
        };
        var gzipOptions = {
            inputDirectory : tilesetDirectory,
            gzip : true,
            writeCallback : writeCallback
        };

        var spy = spyOn(console, 'log').and.callFake(function(){});
        expect(gzipTileset(gzipOptions)
            .then(function() {
                expect(spy).toHaveBeenCalled();
            }), done).toResolve();
    });

    it('accepts custom writeCallback that returns a promise', function (done) {
        var outputDirectory = gzippedDirectory;
        var writeCallback = function(file, data) {
            var outputFile = path.join(outputDirectory, file);
            return fsExtra.outputFile(outputFile, data);
        };
        var gzipOptions = {
            inputDirectory : tilesetDirectory,
            gzip : true,
            writeCallback : writeCallback
        };
        expect(gzipTileset(gzipOptions)
            .then(function() {
                return isGzippedFile(gzippedJson)
                    .then(function(gzipped) {
                        expect(gzipped).toBe(true);
                    });
            }), done).toResolve();
    });

    it('logs debug messages', function (done) {
        var logCallback = function(message) {
            console.log(message);
        };

        var gzipOptions = {
            inputDirectory : tilesetDirectory,
            outputDirectory : gzippedDirectory,
            gzip : true,
            logCallback : logCallback
        };

        var spy = spyOn(console, 'log').and.callFake(function(){});
        expect(gzipTileset(gzipOptions)
            .then(function() {
                expect(spy).toHaveBeenCalled();
            }), done).toResolve();
    });
});

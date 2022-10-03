'use strict';
const fsExtra = require('fs-extra');
const path = require('path');
const Promise = require('bluebird');
const isGzippedFile = require('../../lib/isGzippedFile');
const gzipTileset = require('../../lib/gzipTileset');

const tilesetDirectory = './specs/data/TilesetOfTilesets/';
const tilesetJson = './specs/data/TilesetOfTilesets/tileset.json';
const gzippedDirectory = './specs/data/TilesetOfTilesets-gzipped';
const gzippedJson = './specs/data/TilesetOfTilesets-gzipped/tileset.json';
const ungzippedDirectory = './specs/data/TilesetOfTilesets-ungzipped';
const ungzippedJson = './specs/data/TilesetOfTilesets-ungzipped/tileset.json';

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
        const gzipOptions = {
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
        const gzipOptions = {
            inputDirectory : tilesetDirectory,
            outputDirectory : gzippedDirectory,
            gzip : true
        };
        const ungzipOptions = {
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
        const gzipOptions = {
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
        const gzipOptions = {
            inputDirectory : tilesetDirectory,
            outputDirectory : gzippedDirectory,
            gzip : true
        };
        const gzipAgainOptions = {
            inputDirectory : gzippedDirectory,
            outputDirectory : ungzippedDirectory,
            gzip : true
        };
        expect(gzipTileset(gzipOptions)
            .then(function() {
                return gzipTileset(gzipAgainOptions)
                    .then(function() {
                        const promises = [
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
        const ungzipOptions = {
            inputDirectory : tilesetDirectory,
            outputDirectory : ungzippedDirectory,
            gzip : false
        };
        expect(gzipTileset(ungzipOptions)
            .then(function() {
                const promises = [
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
        const gzipOptions = {
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
        const gzipOptions = {
            inputDirectory : 'non-existent-tileset',
            outputDirectory : gzippedDirectory,
            gzip : true
        };
        expect(gzipTileset(gzipOptions), done).toRejectWith(Error);
    });

    it('accepts custom writeCallback that does not return a promise', function (done) {
        const writeCallback = function(file, data) {
            console.log(`Save file ${  file  } with data ${  data}`);
        };
        const gzipOptions = {
            inputDirectory : tilesetDirectory,
            gzip : true,
            writeCallback : writeCallback
        };

        const spy = spyOn(console, 'log').and.callFake(function(){});
        expect(gzipTileset(gzipOptions)
            .then(function() {
                expect(spy).toHaveBeenCalled();
            }), done).toResolve();
    });

    it('accepts custom writeCallback that returns a promise', function (done) {
        const outputDirectory = gzippedDirectory;
        const writeCallback = function(file, data) {
            const outputFile = path.join(outputDirectory, file);
            return fsExtra.outputFile(outputFile, data);
        };
        const gzipOptions = {
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
        const logCallback = function(message) {
            console.log(message);
        };

        const gzipOptions = {
            inputDirectory : tilesetDirectory,
            outputDirectory : gzippedDirectory,
            gzip : true,
            logCallback : logCallback
        };

        const spy = spyOn(console, 'log').and.callFake(function(){});
        expect(gzipTileset(gzipOptions)
            .then(function() {
                expect(spy).toHaveBeenCalled();
            }), done).toResolve();
    });
});

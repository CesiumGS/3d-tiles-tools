'use strict';
var fsExtra = require('fs-extra');
var path = require('path');
var Promise = require('bluebird');
var combineTileset = require('../../lib/combineTileset');
var getFilesInDirectory = require('../../lib/getFilesInDirectory');
var gzipTileset = require('../../lib/gzipTileset');
var isGzippedFile = require('../../lib/isGzippedFile');

var tilesetDirectory = './specs/data/TilesetOfTilesets/';
var combinedDirectory = './specs/data/TilesetOfTilesets-combined';
var combinedJson = './specs/data/TilesetOfTilesets-combined/tileset.json';
var gzippedDirectory = './specs/data/TilesetOfTilesets-gzipped';

function isJson(file) {
    return path.extname(file) === '.json';
}

function getContentUrls(string) {
    var regex = new RegExp('"url":"([^"]*)"', 'g');
    var matches = [];
    var match = regex.exec(string);
    while (match !== null) {
        matches.push(match[1]);
        match = regex.exec(string);
    }
    return matches;
}

function getNumberOfTilesets(directory) {
    return getFilesInDirectory(directory)
        .then(function (files) {
            var length = files.length;
            var numberOfJsonFiles = 0;
            for (var i = 0; i < length; ++i) {
                if (isJson(files[i])) {
                    ++numberOfJsonFiles;
                }
            }
            return numberOfJsonFiles;
        });
}

describe('combineTileset', function() {
    afterEach(function(done) {
        Promise.all([
            fsExtra.remove(gzippedDirectory),
            fsExtra.remove(combinedDirectory)
        ]).then(function() {
            done();
        });
    });

    it('combines external tilesets into a single tileset', function (done) {
        var combineOptions = {
            inputDirectory : tilesetDirectory,
            outputDirectory : combinedDirectory
        };
        expect(combineTileset(combineOptions)
            .then(function() {
                return getNumberOfTilesets(combinedDirectory);
            })
            .then(function(numberOfTilesets) {
                expect(numberOfTilesets).toBe(1);
                return fsExtra.readFile(combinedJson, 'utf8');
            })
            .then(function(contents) {
                var matches = getContentUrls(contents);
                expect(matches).toEqual(['parent.b3dm', 'tileset3/ll.b3dm', 'lr.b3dm', 'ur.b3dm', 'ul.b3dm']);
            }), done).toResolve();
    });

    it('works when no output directory is supplied', function (done) {
        var combineOptions = {
            inputDirectory : tilesetDirectory
        };
        expect(combineTileset(combineOptions)
            .then(function() {
                // Just check that the output file exists
                return fsExtra.readFile(combinedJson);
            }), done).toResolve();
    });

    it('gzips if the original tileset.json is gzipped', function (done) {
        var gzipOptions = {
            inputDirectory : tilesetDirectory,
            outputDirectory : gzippedDirectory,
            gzip : true
        };
        var combineOptions = {
            inputDirectory : gzippedDirectory,
            outputDirectory : combinedDirectory
        };
        expect(gzipTileset(gzipOptions)
            .then(function() {
                return combineTileset(combineOptions);
            })
            .then(function() {
                return isGzippedFile(combinedJson);
            })
            .then(function(gzipped) {
                expect(gzipped).toBe(true);
            }), done).toResolve();
    });

    it('uses a different rootJson', function (done) {
        var combineOptions = {
            inputDirectory : tilesetDirectory,
            outputDirectory : combinedDirectory,
            rootJson : 'tileset2.json'
        };
        expect(combineTileset(combineOptions)
            .then(function() {
                return getNumberOfTilesets(combinedDirectory);
            })
            .then(function(numberOfTilesets) {
                // tileset3 is combined into tileset2
                expect(numberOfTilesets).toEqual(2);
            }), done).toResolve();
    });

    it('throws when no input tileset is given ', function () {
        expect(function() {
            combineTileset();
        }).toThrowDeveloperError();
    });

    it('throws when input tileset does not exist', function (done) {
        var combineOptions = {
            inputDirectory : 'non-existent-tileset',
            outputDirectory : combinedDirectory
        };
        expect(combineTileset(combineOptions), done).toRejectWith(Error);
    });

    it('accepts custom writeCallback that does not return a promise', function (done) {
        var writeCallback = function(file, data) {
            console.log('Save file ' + file + ' with data ' + data);
        };
        var combineOptions = {
            inputDirectory : tilesetDirectory,
            writeCallback : writeCallback
        };

        var spy = spyOn(console, 'log').and.callFake(function(){});
        expect(combineTileset(combineOptions)
            .then(function() {
                expect(spy).toHaveBeenCalled();
            }), done).toResolve();
    });

    it('accepts custom writeCallback that returns a promise', function (done) {
        var outputDirectory = combinedDirectory;
        var writeCallback = function(file, data) {
            var outputFile = path.join(outputDirectory, file);
            return fsExtra.outputFile(outputFile, data);
        };
        var combineOptions = {
            inputDirectory : tilesetDirectory,
            writeCallback : writeCallback
        };
        expect(combineTileset(combineOptions)
            .then(function() {
                // Just check that the output file exists
                return fsExtra.readFile(combinedJson);
            }), done).toResolve();
    });

    it('logs debug messages', function (done) {
        var logCallback = function(message) {
            console.log(message);
        };

        var combineOptions = {
            inputDirectory : tilesetDirectory,
            outputDirectory : combinedDirectory,
            logCallback : logCallback
        };

        var spy = spyOn(console, 'log').and.callFake(function(){});
        expect(combineTileset(combineOptions)
            .then(function() {
                expect(spy).toHaveBeenCalled();
            }), done).toResolve();
    });
});

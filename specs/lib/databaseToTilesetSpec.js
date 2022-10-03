'use strict';
const fsExtra = require('fs-extra');
const databaseToTileset = require('../../lib/databaseToTileset');
const fileExists = require('../../lib/fileExists');
const isGzipped = require('../../lib/isGzipped');

const inputFile = './specs/data/tileset.3dtiles';
const outputDirectory = './specs/data/Tileset/';
const tilesetJsonFile = './specs/data/TilesetOfTilesets/tileset.json';

describe('databaseToTileset', function() {
    afterEach(function (done) {
        fsExtra.remove(outputDirectory)
            .then(function() {
                done();
            });
    });

    it('creates a tileset from an sqlite database', function(done) {
        expect(databaseToTileset(inputFile, outputDirectory)
            .then(function() {
                return fileExists(tilesetJsonFile)
                    .then(function(exists) {
                        expect(exists).toEqual(true);
                        return fsExtra.readJson(tilesetJsonFile);
                    }).then(function(data) {
                        expect(isGzipped(data)).toBe(false);
                    });
            }), done).toResolve();
    });

    it('throws an error if no input file is provided', function() {
        expect(function() {
            databaseToTileset(undefined, outputDirectory);
        }).toThrowError('inputFile is required.');
    });

    it('works when no output directory is provided', function(done) {
        expect(databaseToTileset(inputFile)
            .then(function() {
                return fileExists(tilesetJsonFile)
                    .then(function(exists) {
                        expect(exists).toBe(true);
                    });
            }), done).toResolve();
    });
});

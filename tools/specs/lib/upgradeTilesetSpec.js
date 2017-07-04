'use strict';
var fsExtra = require('fs-extra');
var GltfPipeline = require('gltf-pipeline');
var path = require('path');
var Promise = require('bluebird');
var bufferToJson = require('../../lib/bufferToJson');
var gzipTileset = require('../../lib/gzipTileset');
var isGzippedFile = require('../../lib/isGzippedFile');
var readFile = require('../../lib/readFile');
var upgradeTileset = require('../../lib/upgradeTileset');

var parseBinaryGltf = GltfPipeline.parseBinaryGltf;

var batchedDeprecated1Directory = './specs/data/BatchedDeprecated1/';
var batchedDeprecated2Directory = './specs/data/BatchedDeprecated2/';
var gzippedDirectory = './specs/data/BatchedDeprecated-gzipped/';
var upgradedDirectory = './specs/data/BatchedDeprecated-upgraded/';
var upgradedJson = './specs/data/BatchedDeprecated-upgraded/tileset.json';
var upgradedB3dm1 = './specs/data/BatchedDeprecated-upgraded/batchedDeprecated1.b3dm';
var upgradedB3dm2 = './specs/data/BatchedDeprecated-upgraded/batchedDeprecated2.b3dm';

describe('upgradeTileset', function() {
    afterEach(function (done) {
        Promise.all([
            fsExtra.remove(upgradedDirectory),
            fsExtra.remove(gzippedDirectory)
        ]).then(function() {
            done();
        });
    });

    it('upgrades tileset', function (done) {
        var upgradeOptions = {
            inputDirectory : batchedDeprecated1Directory,
            outputDirectory : upgradedDirectory
        };
        expect(upgradeTileset(upgradeOptions)
            .then(function() {
                return readFile(upgradedJson, 'json')
                    .then(function(json) {
                        expect(json.asset.version).toBe('1.0');
                        expect(json.root.refine).toBe('ADD');
                    });
            }), done).toResolve();
    });

    function checkUpgradedB3dm(tilesetUrl, tileUrl, done) {
        var upgradeOptions = {
            inputDirectory : tilesetUrl,
            outputDirectory : upgradedDirectory
        };
        expect(upgradeTileset(upgradeOptions)
            .then(function() {
                return readFile(tileUrl)
                    .then(function(b3dm) {
                        var headerByteLength = 28;
                        var byteLength = b3dm.readUInt32LE(8);
                        var featureTableJsonByteLength = b3dm.readUInt32LE(12);
                        var featureTableBinaryByteLength = b3dm.readUInt32LE(16);
                        var batchTableJsonByteLength = b3dm.readUInt32LE(20);
                        var batchTableBinaryByteLength = b3dm.readUInt32LE(24);

                        var featureTableJsonByteOffset = headerByteLength;
                        var featureTableBinaryByteOffset = featureTableJsonByteOffset + featureTableJsonByteLength;
                        var batchTableJsonByteOffset = featureTableBinaryByteOffset + featureTableBinaryByteLength;
                        var batchTableBinaryByteOffset = batchTableJsonByteOffset + batchTableJsonByteLength;
                        var glbByteOffset = batchTableBinaryByteOffset + batchTableBinaryByteLength;

                        var featureTableJsonBuffer = b3dm.slice(featureTableJsonByteOffset, featureTableBinaryByteOffset);
                        var batchTableJsonBuffer = b3dm.slice(batchTableJsonByteOffset, batchTableBinaryByteOffset);
                        var glbBuffer = b3dm.slice(glbByteOffset, byteLength);

                        var featureTableJson = bufferToJson(featureTableJsonBuffer);
                        var batchTableJson = bufferToJson(batchTableJsonBuffer);
                        var gltf = parseBinaryGltf(glbBuffer);

                        expect(featureTableJson.BATCH_LENGTH).toBe(10);
                        expect(batchTableJson.Height.length).toBe(10);
                        expect(gltf.meshes.mesh.primitives[0].attributes._BATCHID).toBeDefined();
                    });
            }), done).toResolve();
    }

    it('upgrades tileset using the deprecated b3dm header (1)', function (done) {
        return checkUpgradedB3dm(batchedDeprecated1Directory, upgradedB3dm1, done);
    });

    it('upgrades tileset using the deprecated b3dm header (2)', function (done) {
        return checkUpgradedB3dm(batchedDeprecated2Directory, upgradedB3dm2, done);
    });

    it('works when no output directory is supplied', function (done) {
        var upgradeOptions = {
            inputDirectory : batchedDeprecated1Directory,
            outputDirectory : upgradedDirectory
        };
        expect(upgradeTileset(upgradeOptions)
            .then(function() {
                // Just check that the output file exists
                return fsExtra.readFile(upgradedJson);
            }), done).toResolve();
    });

    it('gzips if the original files are gzipped', function (done) {
        var gzipOptions = {
            inputDirectory : batchedDeprecated1Directory,
            outputDirectory : gzippedDirectory,
            gzip : true
        };
        var upgradeOptions = {
            inputDirectory : gzippedDirectory,
            outputDirectory : upgradedDirectory
        };
        expect(gzipTileset(gzipOptions)
            .then(function() {
                return upgradeTileset(upgradeOptions);
            })
            .then(function() {
                return isGzippedFile(upgradedJson);
            })
            .then(function(gzipped) {
                expect(gzipped).toBe(true);
            }), done).toResolve();
    });

    it('throws error when no input tileset is given', function () {
        expect(function() {
            upgradeTileset();
        }).toThrowDeveloperError();
    });

    it('throws error when input tileset does not exist', function (done) {
        var upgradeOptions = {
            inputDirectory : 'non-existent-tileset',
            outputDirectory : upgradedDirectory
        };
        expect(upgradeTileset(upgradeOptions), done).toRejectWith(Error);
    });

    it('accepts custom writeCallback that does not return a promise', function (done) {
        var writeCallback = function(file, data) {
            console.log('Save file ' + file + ' with data ' + data);
        };
        var upgradeOptions = {
            inputDirectory : batchedDeprecated1Directory,
            outputDirectory : upgradedDirectory,
            writeCallback : writeCallback
        };

        var spy = spyOn(console, 'log').and.callFake(function(){});
        expect(upgradeTileset(upgradeOptions)
            .then(function() {
                expect(spy).toHaveBeenCalled();
            }), done).toResolve();
    });

    it('accepts custom writeCallback that returns a promise', function (done) {
        var outputDirectory = upgradedDirectory;
        var writeCallback = function(file, data) {
            var outputFile = path.join(outputDirectory, file);
            return fsExtra.outputFile(outputFile, data);
        };
        var upgradeOptions = {
            inputDirectory : batchedDeprecated1Directory,
            outputDirectory : upgradedDirectory,
            writeCallback : writeCallback
        };
        expect(upgradeTileset(upgradeOptions)
            .then(function() {
                // Just check that the output file exists
                return fsExtra.readFile(upgradedJson);
            }), done).toResolve();
    });

    it('logs debug messages', function (done) {
        var logCallback = function(message) {
            console.log(message);
        };

        var upgradeOptions = {
            inputDirectory : batchedDeprecated1Directory,
            outputDirectory : upgradedDirectory,
            logCallback : logCallback
        };

        var spy = spyOn(console, 'log').and.callFake(function(){});
        expect(upgradeTileset(upgradeOptions)
            .then(function() {
                expect(spy).toHaveBeenCalled();
            }), done).toResolve();
    });
});

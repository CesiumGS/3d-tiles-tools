'use strict';
const fsExtra = require('fs-extra');
const GltfPipeline = require('gltf-pipeline');
const path = require('path');
const Promise = require('bluebird');
const bufferToJson = require('../../lib/bufferToJson');
const gzipTileset = require('../../lib/gzipTileset');
const isGzippedFile = require('../../lib/isGzippedFile');
const readFile = require('../../lib/readFile');
const upgradeTileset = require('../../lib/upgradeTileset');

const parseBinaryGltf = GltfPipeline.parseBinaryGltf;

const batchedDeprecated1Directory = './specs/data/BatchedDeprecated1/';
const batchedDeprecated2Directory = './specs/data/BatchedDeprecated2/';
const gzippedDirectory = './specs/data/BatchedDeprecated-gzipped/';
const upgradedDirectory = './specs/data/BatchedDeprecated-upgraded/';
const upgradedJson = './specs/data/BatchedDeprecated-upgraded/tileset.json';
const upgradedB3dm1 = './specs/data/BatchedDeprecated-upgraded/batchedDeprecated1.b3dm';
const upgradedB3dm2 = './specs/data/BatchedDeprecated-upgraded/batchedDeprecated2.b3dm';

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
        const upgradeOptions = {
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
        const upgradeOptions = {
            inputDirectory : tilesetUrl,
            outputDirectory : upgradedDirectory
        };
        expect(upgradeTileset(upgradeOptions)
            .then(function() {
                return readFile(tileUrl)
                    .then(function(b3dm) {
                        const headerByteLength = 28;
                        const byteLength = b3dm.readUInt32LE(8);
                        const featureTableJsonByteLength = b3dm.readUInt32LE(12);
                        const featureTableBinaryByteLength = b3dm.readUInt32LE(16);
                        const batchTableJsonByteLength = b3dm.readUInt32LE(20);
                        const batchTableBinaryByteLength = b3dm.readUInt32LE(24);

                        const featureTableJsonByteOffset = headerByteLength;
                        const featureTableBinaryByteOffset = featureTableJsonByteOffset + featureTableJsonByteLength;
                        const batchTableJsonByteOffset = featureTableBinaryByteOffset + featureTableBinaryByteLength;
                        const batchTableBinaryByteOffset = batchTableJsonByteOffset + batchTableJsonByteLength;
                        const glbByteOffset = batchTableBinaryByteOffset + batchTableBinaryByteLength;

                        const featureTableJsonBuffer = b3dm.slice(featureTableJsonByteOffset, featureTableBinaryByteOffset);
                        const batchTableJsonBuffer = b3dm.slice(batchTableJsonByteOffset, batchTableBinaryByteOffset);
                        const glbBuffer = b3dm.slice(glbByteOffset, byteLength);

                        const featureTableJson = bufferToJson(featureTableJsonBuffer);
                        const batchTableJson = bufferToJson(batchTableJsonBuffer);
                        const gltf = parseBinaryGltf(glbBuffer);

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
        const upgradeOptions = {
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
        const gzipOptions = {
            inputDirectory : batchedDeprecated1Directory,
            outputDirectory : gzippedDirectory,
            gzip : true
        };
        const upgradeOptions = {
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
        const upgradeOptions = {
            inputDirectory : 'non-existent-tileset',
            outputDirectory : upgradedDirectory
        };
        expect(upgradeTileset(upgradeOptions), done).toRejectWith(Error);
    });

    it('accepts custom writeCallback that does not return a promise', function (done) {
        const writeCallback = function(file, data) {
            console.log(`Save file ${  file  } with data ${  data}`);
        };
        const upgradeOptions = {
            inputDirectory : batchedDeprecated1Directory,
            outputDirectory : upgradedDirectory,
            writeCallback : writeCallback
        };

        const spy = spyOn(console, 'log').and.callFake(function(){});
        expect(upgradeTileset(upgradeOptions)
            .then(function() {
                expect(spy).toHaveBeenCalled();
            }), done).toResolve();
    });

    it('accepts custom writeCallback that returns a promise', function (done) {
        const outputDirectory = upgradedDirectory;
        const writeCallback = function(file, data) {
            const outputFile = path.join(outputDirectory, file);
            return fsExtra.outputFile(outputFile, data);
        };
        const upgradeOptions = {
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
        const logCallback = function(message) {
            console.log(message);
        };

        const upgradeOptions = {
            inputDirectory : batchedDeprecated1Directory,
            outputDirectory : upgradedDirectory,
            logCallback : logCallback
        };

        const spy = spyOn(console, 'log').and.callFake(function(){});
        expect(upgradeTileset(upgradeOptions)
            .then(function() {
                expect(spy).toHaveBeenCalled();
            }), done).toResolve();
    });
});

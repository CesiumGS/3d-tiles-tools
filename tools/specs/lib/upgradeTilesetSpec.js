'use strict';
var fsExtra = require('fs-extra');
var GltfPipeline = require('gltf-pipeline');
var path = require('path');
var extractB3dm = require('../../lib/extractB3dm');
var getWorkingDirectory = require('../../lib/getWorkingDirectory');
var readFile = require('../../lib/readFile');
var upgradeTileset = require('../../lib/upgradeTileset');

var glbToGltf = GltfPipeline.glbToGltf;

var batchedDeprecated1Directory = './specs/data/BatchedDeprecated1/';
var batchedDeprecated2Directory = './specs/data/BatchedDeprecated2/';
var upgradedDirectory;
var upgradedJson;
var upgradedB3dm1;
var upgradedB3dm2;

describe('upgradeTileset', function() {
    beforeEach(function() {
        upgradedDirectory = getWorkingDirectory();
        upgradedJson = path.join(upgradedDirectory, 'tileset.json');
        upgradedB3dm1 = path.join(upgradedDirectory, 'batchedDeprectated1.b3dm');
        upgradedB3dm2 = path.join(upgradedDirectory, 'batchedDeprectated2.b3dm');
    });
    afterEach(function() {
        return fsExtra.remove(upgradedDirectory);
    });

    it('upgrades tileset', function(done) {
        var upgradeOptions = {
            inputDirectory: batchedDeprecated1Directory,
            outputDirectory: upgradedDirectory
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
            inputDirectory: tilesetUrl,
            outputDirectory: upgradedDirectory
        };
        expect(upgradeTileset(upgradeOptions)
            .then(function() {
                return readFile(tileUrl);
            })
            .then(function(contents) {
                var b3dm = extractB3dm(contents);
                expect(b3dm.featureTableJson.BATCH_LENGTH).toBe(10);
                expect(b3dm.featureTableJson.RTC_CENTER).toBe([1214988.419024718,-4736314.722631629,4081609.6544529707]);
                expect(b3dm.batchTableJson.Height.length).toBe(10);
                var glb = b3dm.glb;
                return glbToGltf(glb);
            })
            .then(function(results) {
                var gltf = results.gltf;
                expect(gltf.asset.version).toBe('2.0');
                expect(gltf.meshes[0].primitives[0].attributes._BATCHID).toBeDefined();
                expect(gltf.extensions).toBeUndefined();
                expect(gltf.extensionsUsed).toBeUndefined();
                expect(gltf.extensionsRequired).toBeUndefined();
            }), done).toResolve();
    }

    it('upgrades tileset using the deprecated b3dm header (1)', function(done) {
        return checkUpgradedB3dm(batchedDeprecated1Directory, upgradedB3dm1, done);
    });

    it('upgrades tileset using the deprecated b3dm header (2)', function(done) {
        return checkUpgradedB3dm(batchedDeprecated2Directory, upgradedB3dm2, done);
    });

    it('works when no output directory is supplied', function(done) {
        var spy = spyOn(fsExtra, 'outputFile');
        var upgradeOptions = {
            inputDirectory: batchedDeprecated1Directory,
            outputDirectory: upgradedDirectory
        };
        expect(upgradeTileset(upgradeOptions)
            .then(function() {
                expect(spy.calls().length).toBe(10);
            }), done).toResolve();
    });

    it('throws error when no input tileset is given', function() {
        expect(function() {
            upgradeTileset();
        }).toThrowDeveloperError();
    });

    it('throws error when input tileset does not exist', function(done) {
        var upgradeOptions = {
            inputDirectory: 'non-existent-tileset',
            outputDirectory: upgradedDirectory
        };
        expect(upgradeTileset(upgradeOptions), done).toRejectWith(Error);
    });

    it('accepts custom writer that does not return a promise', function(done) {
        var writer = function(file, data) {
            console.log('Save file ' + file + ' with data ' + data);
        };
        var upgradeOptions = {
            inputDirectory: batchedDeprecated1Directory,
            outputDirectory: upgradedDirectory,
            writer: writer
        };

        var spy = spyOn(console, 'log').and.callFake(function(){});
        expect(upgradeTileset(upgradeOptions)
            .then(function() {
                expect(spy).toHaveBeenCalled();
            }), done).toResolve();
    });

    it('accepts custom writer that returns a promise', function(done) {
        var outputDirectory = upgradedDirectory;
        var writer = function(file, data) {
            var outputFile = path.join(outputDirectory, file);
            return fsExtra.outputFile(outputFile, data);
        };
        var upgradeOptions = {
            inputDirectory: batchedDeprecated1Directory,
            outputDirectory: upgradedDirectory,
            writer: writer
        };
        expect(upgradeTileset(upgradeOptions)
            .then(function() {
                // Just check that the output file exists
                return fsExtra.readFile(upgradedJson);
            }), done).toResolve();
    });

    it('logs debug messages', function(done) {
        var logger = function(message) {
            console.log(message);
        };

        var upgradeOptions = {
            inputDirectory: batchedDeprecated1Directory,
            outputDirectory: upgradedDirectory,
            logger: logger
        };

        var spy = spyOn(console, 'log');
        expect(upgradeTileset(upgradeOptions)
            .then(function() {
                expect(spy).toHaveBeenCalled();
            }), done).toResolve();
    });
});

'use strict';
const fsExtra = require('fs-extra');
const path = require('path');
const isGzippedFile = require('../../lib/isGzippedFile');
const runPipeline = require('../../lib/runPipeline');

const inputDirectory = './specs/data/TilesetOfTilesets/';
const outputDirectory = './specs/data/TilesetOfTilesets-processed';
const outputJson = './specs/data/TilesetOfTilesets-processed/tileset.json';

describe('runPipeline', function() {
    afterEach(function(done) {
        fsExtra.remove(outputDirectory)
            .then(done);
    });

    it('throws if input is undefined', function () {
        expect(function() {
            runPipeline();
        }).toThrowDeveloperError();
    });

    it('runs one stage', function (done) {
        const pipeline = {
            input : inputDirectory,
            output : outputDirectory,
            stages : ['gzip']
        };
        expect(runPipeline(pipeline)
            .then(function() {
                return isGzippedFile(outputJson)
                    .then(function(gzipped) {
                        expect(gzipped).toBe(true);
                    });
            }), done).toResolve();
    });

    it('runs two stages', function (done) {
        const pipeline = {
            input : inputDirectory,
            output : outputDirectory,
            stages : ['combine', 'gzip']
        };
        expect(runPipeline(pipeline)
            .then(function() {
                return isGzippedFile(outputJson)
                    .then(function(gzipped) {
                        expect(gzipped).toBe(true);
                    });
            }), done).toResolve();
    });

    it('runs three stages', function (done) {
        const pipeline = {
            input : inputDirectory,
            output : outputDirectory,
            stages : ['combine', 'gzip', 'ungzip']
        };
        expect(runPipeline(pipeline)
            .then(function() {
                return isGzippedFile(outputJson)
                    .then(function(gzipped) {
                        expect(gzipped).toBe(false);
                    });
            }), done).toResolve();
    });

    it('runs four stages', function (done) {
        const pipeline = {
            input : inputDirectory,
            output : outputDirectory,
            stages : ['combine', 'gzip', 'ungzip', 'gzip']
        };
        expect(runPipeline(pipeline)
            .then(function() {
                return isGzippedFile(outputJson)
                    .then(function(gzipped) {
                        expect(gzipped).toBe(true);
                    });
            }), done).toResolve();
    });

    it('runs stage with options', function (done) {
        const pipeline = {
            input : inputDirectory,
            output : outputDirectory,
            stages : [{
                name : 'gzip',
                tilesOnly : true
            }]
        };
        expect(runPipeline(pipeline)
            .then(function() {
                return isGzippedFile(outputJson)
                    .then(function(gzipped) {
                        expect(gzipped).toBe(false);
                    });
            }), done).toResolve();
    });

    it('runs a mix of stage names and stage objects', function (done) {
        const pipeline = {
            input : inputDirectory,
            output : outputDirectory,
            stages : [
                'gzip',
                'ungzip',
                {
                    name : 'gzip',
                    tilesOnly : true
                }
            ]
        };
        expect(runPipeline(pipeline)
            .then(function() {
                return isGzippedFile(outputJson)
                    .then(function(gzipped) {
                        expect(gzipped).toBe(false);
                    });
            }), done).toResolve();
    });

    it('throws if stage does not have a name', function () {
        const pipeline = {
            input : inputDirectory,
            output : outputDirectory,
            stages : [{}]
        };
        expect(function() {
            runPipeline(pipeline);
        }).toThrowDeveloperError();
    });

    it('throws if stage does not exist', function () {
        const pipeline = {
            input : inputDirectory,
            output : outputDirectory,
            stages : ['invalid-stage-name']
        };
        expect(function() {
            runPipeline(pipeline);
        }).toThrowDeveloperError();
    });

    it('works when no output is supplied', function (done) {
        const pipeline = {
            input : inputDirectory,
            stages : ['gzip']
        };
        expect(runPipeline(pipeline)
            .then(function() {
                return isGzippedFile(outputJson)
                    .then(function(gzipped) {
                        expect(gzipped).toBe(true);
                    });
            }), done).toResolve();
    });

    it('works when no stages are supplied', function (done) {
        const pipeline = {
            input : inputDirectory,
            output : outputDirectory
        };
        // Doesn't do any processing, just copies files to the output directory
        expect(runPipeline(pipeline)
            .then(function() {
                return isGzippedFile(outputJson)
                    .then(function(gzipped) {
                        expect(gzipped).toBe(false);
                    });
            }), done).toResolve();
    });

    it('accepts custom writeCallback', function (done) {
        const writeCallback = function(file, data) {
            const outputFile = path.join(outputDirectory, file);
            return fsExtra.outputFile(outputFile, data);
        };

        const pipeline = {
            input : inputDirectory,
            stages : ['gzip']
        };

        const options = {
            writeCallback : writeCallback
        };

        expect(runPipeline(pipeline, options)
            .then(function() {
                return isGzippedFile(outputJson)
                    .then(function(gzipped) {
                        expect(gzipped).toBe(true);
                    });
            }), done).toResolve();
    });

    it('logs debug messages', function (done) {
        const logCallback = function(message) {
            console.log(message);
        };

        const pipeline = {
            input : inputDirectory,
            output : outputDirectory,
            stages : ['gzip']
        };

        const options = {
            logCallback : logCallback
        };

        const spy = spyOn(console, 'log').and.callFake(function(){});
        expect(runPipeline(pipeline, options)
            .then(function() {
                expect(spy).toHaveBeenCalled();
            }), done).toResolve();
    });
});

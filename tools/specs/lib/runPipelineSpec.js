'use strict';
var fsExtra = require('fs-extra');
var Promise = require('bluebird');
var isGzipped = require('../../lib/isGzipped');
var runPipeline = require('../../lib/runPipeline');

var fsExtraRemove = Promise.promisify(fsExtra.remove);

var inputDirectory = './specs/data/TilesetOfTilesets/';
var outputDirectory = './specs/data/TilesetOfTilesets-processed';
var outputJson = './specs/data/TilesetOfTilesets-processed/tileset.json';

describe('runPipeline', function() {
    afterEach(function(done) {
        fsExtraRemove(outputDirectory)
            .then(done);
    });

    it('throws if input is undefined', function () {
        expect(function() {
            runPipeline();
        }).toThrowDeveloperError();
    });

    it('runs one stage', function (done) {
        var pipeline = {
            input : inputDirectory,
            output : outputDirectory,
            stages : ['gzip']
        };
        expect(runPipeline(pipeline)
            .then(function() {
                return isGzipped(outputJson)
                    .then(function(isGzipped) {
                        expect(isGzipped).toBe(true);
                    });
            }), done).toResolve();
    });

    it('runs two stages', function (done) {
        var pipeline = {
            input : inputDirectory,
            output : outputDirectory,
            stages : ['gzip', 'ungzip']
        };
        expect(runPipeline(pipeline)
            .then(function() {
                return isGzipped(outputJson)
                    .then(function(isGzipped) {
                        expect(isGzipped).toBe(false);
                    });
            }), done).toResolve();
    });

    it('runs three stages', function (done) {
        var pipeline = {
            input : inputDirectory,
            output : outputDirectory,
            stages : ['gzip', 'ungzip', 'gzip']
        };
        expect(runPipeline(pipeline)
            .then(function() {
                return isGzipped(outputJson)
                    .then(function(isGzipped) {
                        expect(isGzipped).toBe(true);
                    });
            }), done).toResolve();
    });

    it('runs four stages', function (done) {
        var pipeline = {
            input : inputDirectory,
            output : outputDirectory,
            stages : ['gzip', 'ungzip', 'gzip', 'ungzip']
        };
        expect(runPipeline(pipeline)
            .then(function() {
                return isGzipped(outputJson)
                    .then(function(isGzipped) {
                        expect(isGzipped).toBe(false);
                    });
            }), done).toResolve();
    });

    it('runs stage with options', function (done) {
        var pipeline = {
            input : inputDirectory,
            output : outputDirectory,
            stages : [{
                name : 'gzip',
                tilesOnly : true
            }]
        };
        expect(runPipeline(pipeline)
            .then(function() {
                return isGzipped(outputJson)
                    .then(function(isGzipped) {
                        expect(isGzipped).toBe(false);
                    });
            }), done).toResolve();
    });

    it('runs a mix of stage names and stage objects', function (done) {
        var pipeline = {
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
                return isGzipped(outputJson)
                    .then(function(isGzipped) {
                        expect(isGzipped).toBe(false);
                    });
            }), done).toResolve();
    });

    it('throws if stage does not have a name', function () {
        var pipeline = {
            input : inputDirectory,
            output : outputDirectory,
            stages : [{}]
        };
        expect(function() {
            runPipeline(pipeline);
        }).toThrowDeveloperError();
    });

    it('throws if stage does not exist', function () {
        var pipeline = {
            input : inputDirectory,
            output : outputDirectory,
            stages : ['invalid-stage-name']
        };
        expect(function() {
            runPipeline(pipeline);
        }).toThrowDeveloperError();
    });

    it('works when no output is supplied', function (done) {
        var pipeline = {
            input : inputDirectory,
            stages : ['gzip']
        };
        expect(runPipeline(pipeline)
            .then(function() {
                return isGzipped(outputJson)
                    .then(function(isGzipped) {
                        expect(isGzipped).toBe(true);
                    });
            }), done).toResolve();
    });

    it('works when no stages are supplied', function (done) {
        var pipeline = {
            input : inputDirectory,
            output : outputDirectory
        };
        // Doesn't do any processing, just copies files to the output directory
        expect(runPipeline(pipeline)
            .then(function() {
                return isGzipped(outputJson)
                    .then(function(isGzipped) {
                        expect(isGzipped).toBe(false);
                    });
            }), done).toResolve();
    });

    it('writes debug info to console when verbose is true', function (done) {
        var spy = spyOn(console, 'log').and.callFake(function(){});
        var pipeline = {
            input : inputDirectory,
            output : outputDirectory,
            stages : ['gzip']
        };
        var options = {
            verbose : true
        };
        expect(runPipeline(pipeline, options)
            .then(function() {
                expect(spy).toHaveBeenCalled();
            }), done).toResolve();
    });
});

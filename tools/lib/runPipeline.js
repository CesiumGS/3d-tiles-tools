'use strict';
var Cesium = require('cesium');
var fsExtra = require('fs-extra');
var path = require('path');
var Promise = require('bluebird');
var gzipTileset = require('./gzipTileset');

var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;
var DeveloperError = Cesium.DeveloperError;

var fsExtraCopy = Promise.promisify(fsExtra.copy);
var fsExtraEmptyDir = Promise.promisify(fsExtra.emptyDir);
var fsExtraRemove = Promise.promisify(fsExtra.remove);

module.exports = runPipeline;

/**
 * Run an input pipeline.
 *
 * @param {Object} pipeline A JSON object containing an input, output, and list of stages to run.
 * @param {String} pipeline.input Input tileset path.
 * @param {String} [pipeline.output] Output tileset path.
 * @param {Array<Object|String>} [pipeline.stages] The stages to run on the tileset.
 * @param {Object} [options] An object with the following properties:
 * @param {Boolean} [options.verbose] If true prints out debug messages to the console.
 */
function runPipeline(pipeline, options) {
    pipeline = defaultValue(pipeline, defaultValue.EMPTY_OBJECT);
    var inputPath = pipeline.input;
    var outputPath = pipeline.output;
    var stages = pipeline.stages;
    if (!defined(inputPath)) {
        throw new DeveloperError('pipeline.input is required');
    }

    inputPath = path.normalize(inputPath);
    outputPath = path.normalize(defaultValue(outputPath,
        path.join(path.dirname(inputPath), path.basename(inputPath) + '-processed')));

    if (!defined(stages)) {
        return fsExtraCopy(inputPath, outputPath);
    }

    options = defaultValue(options, defaultValue.EMPTY_OBJECT);
    var verbose = defaultValue(options.verbose, false);

    var workingDirectory1 = path.join(path.dirname(inputPath), path.basename(inputPath) + '-working1');
    var workingDirectory2 = path.join(path.dirname(inputPath), path.basename(inputPath) + '-working2');

    var stageObjects = [];

    var stagesLength = stages.length;
    for (var i = 0; i < stagesLength; ++i) {
        var stageName;
        var stageOptions;
        var stage = stages[i];
        if (typeof stage === 'string') {
            stageName = stage;
            stageOptions = {};
        } else {
            stageName = stage.name;
            if (!defined(stageName)) {
                throw new DeveloperError('Stage must have a "name" property');
            }
            stageOptions = stage;
        }
        stageOptions.verbose = defaultValue(stageOptions.verbose, verbose);
        var stageFunction = getStageFunction(stageName, stageOptions);
        if (!defined(stageFunction)) {
            throw new DeveloperError('Stage "' + stageName + '" does not exist');
        }

        // Ping-pong between the two working directories when multiple stages are run
        var stageInput = (i === 0) ? inputPath : ((i % 2 === 0) ? workingDirectory2 : workingDirectory1);
        var stageOutput = (i === stagesLength - 1) ? outputPath : ((i % 2 === 0) ? workingDirectory1 : workingDirectory2);

        stageObjects.push({
            input : stageInput,
            output : stageOutput,
            options : stageOptions,
            stageFunction : stageFunction
        });
    }

    // Run the stages in sequence
    return Promise.each(stageObjects, function(stage) {
        return fsExtraEmptyDir(stage.output)
            .then(function() {
                return stage.stageFunction(stage.input, stage.output, stage.options);
            });
    }).then(function() {
        return Promise.all([
            fsExtraRemove(workingDirectory1),
            fsExtraRemove(workingDirectory2)
        ]);
    });
}

function getStageFunction(stageName, stageOptions) {
    switch (stageName) {
        case 'gzip':
            stageOptions.gzip = true;
            return gzipTileset;
        case 'ungzip':
            stageOptions.gzip = false;
            return gzipTileset;
        default:
            return undefined;
    }
}


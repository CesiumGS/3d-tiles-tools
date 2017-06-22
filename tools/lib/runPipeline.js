'use strict';
var Cesium = require('cesium');
var fsExtra = require('fs-extra');
var path = require('path');
var Promise = require('bluebird');
var combineTileset = require('./combineTileset');
var getWorkingDirectory = require('./getWorkingDirectory');
var gzipTileset = require('./gzipTileset');
var upgradeTileset = require('./upgradeTileset');

var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;
var DeveloperError = Cesium.DeveloperError;

module.exports = runPipeline;

/**
 * Run an input pipeline.
 *
 * @param {Object} pipeline A JSON object containing an input, output, and list of stages to run.
 * @param {String} pipeline.input Input tileset path.
 * @param {String} [pipeline.output] Output tileset path.
 * @param {Array<Object|String>} [pipeline.stages] The stages to run on the tileset.
 * @param {Object} [options] An object with the following properties:
 * @param {WriteCallback} [options.writeCallback] A callback function that writes files after they have been processed.
 * @param {LogCallback} [options.logCallback] A callback function that logs messages.
 */
function runPipeline(pipeline, options) {
    pipeline = defaultValue(pipeline, defaultValue.EMPTY_OBJECT);
    var inputDirectory = pipeline.input;
    var outputDirectory = pipeline.output;
    var stages = pipeline.stages;
    if (!defined(inputDirectory)) {
        throw new DeveloperError('pipeline.input is required');
    }

    inputDirectory = path.normalize(inputDirectory);
    outputDirectory = path.normalize(defaultValue(outputDirectory,
        path.join(path.dirname(inputDirectory), path.basename(inputDirectory) + '-processed')));

    if (!defined(stages)) {
        return fsExtra.copy(inputDirectory, outputDirectory);
    }

    options = defaultValue(options, defaultValue.EMPTY_OBJECT);

    var writeCallback = options.writeCallback;
    var logCallback = options.logCallback;

    var workingDirectory1 = getWorkingDirectory();
    var workingDirectory2 = getWorkingDirectory();

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

        // Ping-pong between the two working directories when multiple stages are run
        var stageInputDirectory = (i === 0) ? inputDirectory : ((i % 2 === 0) ? workingDirectory2 : workingDirectory1);
        var stageOutputDirectory = (i === stagesLength - 1) ? outputDirectory : ((i % 2 === 0) ? workingDirectory1 : workingDirectory2);

        stageOptions.inputDirectory = stageInputDirectory;
        stageOptions.outputDirectory = stageOutputDirectory;
        stageOptions.logCallback = logCallback;

        if (i === stagesLength - 1) {
            // TODO : Not sure if this is the right approach. Should the writeCallback also have control over the temp directories? How would that work?
            // Only allow the write callback to act on the last stage. The intermediary stages always write to temp directories.
            stageOptions.writeCallback = writeCallback;
        }

        var stageFunction = getStageFunction(stageName, stageOptions);
        if (!defined(stageFunction)) {
            throw new DeveloperError('Stage "' + stageName + '" does not exist');
        }

        stageObjects.push({
            options : stageOptions,
            stageFunction : stageFunction,
            name : stageName
        });
    }

    // Run the stages in sequence
    return Promise.each(stageObjects, function(stage) {
        return fsExtra.emptyDir(stage.options.outputDirectory)
            .then(function() {
                if (defined(logCallback)) {
                    logCallback('Running ' + stage.name);
                }
                return stage.stageFunction(stage.options);
            });
    }).finally(function() {
        return Promise.all([
            fsExtra.remove(workingDirectory1),
            fsExtra.remove(workingDirectory2)
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
        case 'combine':
            return combineTileset;
        case 'upgrade':
            return upgradeTileset;
        default:
            return undefined;
    }
}

/**
 * A callback function that writes files after they have been processed.
 * @callback WriteCallback
 *
 * @param {String} file Relative path of the file.
 * @param {Buffer} buffer A buffer storing the processed file's data.
 * @returns {Promise} A promise that resolves when the callback is complete.
 */

/**
 * A callback function that logs messages.
 * @callback LogCallback
 *
 * @param {String} message A log message.
 */

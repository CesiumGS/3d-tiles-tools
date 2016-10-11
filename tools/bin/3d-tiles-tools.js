#!/usr/bin/env node
'use strict';
var argv = require('yargs').argv;
var Cesium = require('cesium');
var fsExtra = require('fs-extra');
var path = require('path');
var Promise = require('bluebird');
var glbToB3dm = require('../lib/glbToB3dm');
var runPipeline = require('../lib/runPipeline');

var fsExtraReadJson = Promise.promisify(fsExtra.readJson);
var fsStat = Promise.promisify(fsExtra.stat);
var fsReadFile = Promise.promisify(fsExtra.readFile);
var fsWriteFile = Promise.promisify(fsExtra.outputFile);

var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;

if (process.argv.length < 4 || defined(argv.h) || defined(argv.help) || !defined(argv._[0])) {
    var help =
        'Usage: 3d-tiles-tools command [args]\n' +
        'Possible commands:\n' +
        '    pipeline  Execute the input pipeline JSON file.\n' +
        '        -i --input, input=PATH The input pipeline JSON file.\n' +
        '        -f --force, Overwrite output directory if it exists.\n' +
        '    glbToB3dm  Repackage the input glb as a b3dm with a basic header.\n' +
        '        -i --input, input=PATH The input glb path.\n' +
        '        -o --output, output=PATH The output b3dm path.\n' +
        '        -f --force, Overwrite output file if it exists.\n' +
        '    gzip  Gzips the input tileset.\n' +
        '        -i --input, input=PATH The input tileset directory.\n' +
        '        -o --output, output=PATH The output tileset directory.\n' +
        '        -t --tilesOnly, Only gzip tiles.\n' +
        '        -f --force, Overwrite output directory if it exists.\n' +
        '    ungzip  Ungzips the input tileset.\n' +
        '        -i --input, input=PATH The input tileset directory.\n' +
        '        -o --output, output=PATH The output tileset directory.\n' +
        '        -f --force, Overwrite output directory if it exists.\n';
    console.log(help);
    return;
}

var command = argv._[0];
var input = defaultValue(defaultValue(argv.i, argv.input), argv._[1]);
var force = defined(argv.f) || defined(argv.force);

if (!defined(input)) {
    console.log('-i or --input argument is required. See --help for details.');
    return;
}

input = path.normalize(input);

console.time('Total');

if (command === 'pipeline') {
    processPipeline(input, force)
        .then(function() {
            console.timeEnd('Total');
        });
} else if (command === 'glbToB3dm') {
    // glbToB3dm is not a pipeline tool, so handle it separately.
    readGlbWriteB3dm(input, force, argv);
} else {
    processStage(input, force, command, argv)
        .then(function() {
            console.timeEnd('Total');
        });
}

function logCallback(message) {
    console.log(message);
}

function processPipeline(inputFile) {
    return fsExtraReadJson(inputFile)
        .then(function(pipeline) {
            var inputDirectory = pipeline.input;
            var outputDirectory = pipeline.output;

            if (!defined(inputDirectory)) {
                console.log('pipeline.input is required.');
                return;
            }

            outputDirectory = path.normalize(defaultValue(outputDirectory,
                path.join(path.dirname(inputDirectory), path.basename(input) + '-processed')));

            // Make input and output relative to the root directory
            inputDirectory = path.join(path.dirname(inputFile), inputDirectory);
            outputDirectory = path.join(path.dirname(inputFile), outputDirectory);

            return directoryExists(outputDirectory)
                .then(function(exists) {
                    if (!force && exists) {
                        console.log('Directory ' + outputDirectory + ' already exists. Specify -f or --force to overwrite existing files.');
                        return;
                    }

                    pipeline.input = inputDirectory;
                    pipeline.output = outputDirectory;

                    var options = {
                        logCallback : logCallback
                    };

                    return runPipeline(pipeline, options);
                });
        });
}

function processStage(inputDirectory, force, command, argv) {
    var outputDirectory = defaultValue(defaultValue(argv.o, argv.output), argv._[2]);
    outputDirectory = path.normalize(defaultValue(outputDirectory,
        path.join(path.dirname(inputDirectory), path.basename(inputDirectory) + '-processed')));

    return directoryExists(outputDirectory)
        .then(function(exists) {
            if (!force && exists) {
                console.log('Directory ' + outputDirectory + ' already exists. Specify -f or --force to overwrite existing files.');
                return;
            }

            var stage = getStage(command, argv);

            var pipeline = {
                input : inputDirectory,
                output : outputDirectory,
                stages : [stage]
            };

            var options = {
                logCallback : logCallback
            };

            return runPipeline(pipeline, options);
        });
}

function getStage(stageName, argv) {
    var stage = {
        name : stageName
    };
    switch (stageName) {
        case 'gzip':
            if (defined(argv.t) || defined(argv.tilesOnly)) {
                stage.tilesOnly = true;
            }
            break;
    }
    return stage;
}

function directoryExists(directory) {
    return fsStat(directory)
        .then(function(stats) {
            return stats.isDirectory();
        })
        .catch(function(err) {
            // If the directory doesn't exist the error code is ENOENT.
            // Otherwise something else went wrong - permission issues, etc.
            if (err.code !== 'ENOENT') {
                throw err;
            }
            return false;
        });
}

function fileExists(filePath) {
    return fsStat(filePath)
        .then(function(stats) {
            return stats.isFile();
        })
        .catch(function(err) {
            // If the file doesn't exist the error code is ENOENT.
            // Otherwise something else went wrong - permission issues, etc.
            if (err.code !== 'ENOENT') {
                throw err;
            }
            return false;
        });
}

function readGlbWriteB3dm(inputPath, force, argv) {
    var outputPath = defaultValue(
        defaultValue(argv.o, argv.output),
        defaultValue(argv._[2], inputPath.slice(0, inputPath.length - 3) + 'b3dm'));
    return fileExists(outputPath)
        .then(function(exists) {
            if (!force && exists) {
                console.log('File ' + outputPath + ' already exists. Specify -f or --force to overwrite existing file.');
                return;
            }
            return fsReadFile(inputPath)
                .then(function(data) {
                    return fsWriteFile(outputPath, glbToB3dm(data));
                });
        });
}

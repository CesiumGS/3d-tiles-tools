#!/usr/bin/env node
'use strict';
var Cesium = require('cesium');
var GltfPipeline = require('gltf-pipeline');
var Promise = require('bluebird');
var fsExtra = require('fs-extra');
var path = require('path');
var yargs = require('yargs');
var zlib = require('zlib');
var extractB3dm = require('../lib/extractB3dm');
var glbToB3dm = require('../lib/glbToB3dm');
var isGzipped = require('../lib/isGzipped');
var optimizeGlb = require('../lib/optimizeGlb');
var runPipeline = require('../lib/runPipeline');

var fsExtraReadJson = Promise.promisify(fsExtra.readJson);
var fsStat = Promise.promisify(fsExtra.stat);
var fsReadFile = Promise.promisify(fsExtra.readFile);
var fsWriteFile = Promise.promisify(fsExtra.outputFile);
var zlibGzip = Promise.promisify(zlib.gzip);
var zlibGunzip = Promise.promisify(zlib.gunzip);

var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;

var index = -1;
for (var i = 0; i < process.argv.length; i++) {
    if (process.argv[i] === '--options') {
        index = i;
        break;
    }
}

var args;
var optionArgs;
if (index < 0) {
    args = process.argv.slice(2);
} else {
    args = process.argv.slice(2, index);
    optionArgs = process.argv.slice(index + 1);
}

var argv = yargs
    .usage('Usage: $0 <command> [options]')
    .help('h')
    .alias('h', 'help')
    .options({
        'i': {
            alias: 'input',
            description: 'Input path for the command.',
            global: true,
            normalize: true,
            type: 'string'
        },
        'o': {
            alias: 'output',
            description: 'Output path for the command.',
            global: true,
            normalize: true,
            type: 'string'
        },
        'f': {
            alias: 'force',
            default: false,
            description: 'Output can be overwritten if it already exists.',
            global: true,
            type: 'boolean'
        }
    })
    .command('pipeline', 'Execute the input pipeline JSON file.')
    .command('glbToB3dm', 'Repackage the input glb as a b3dm with a basic header.')
    .command('b3dmToGlb', 'Extract the binary glTF asset from the input b3dm.')
    .command('optimizeB3dm', 'Pass the input b3dm through gltf-pipeline. To pass options to gltf-pipeline, place them after --options. (--options -h for gltf-pipeline help)', {
        'z': {
            alias: 'zip',
            default: false,
            description: 'Gzip the output b3dm.',
            type: 'boolean'
        },
        'options': {
            description: 'All arguments after this flag will be passed to gltf-pipeline as command line options.'
        }
    })
    .command('gzip', 'Gzips the input tileset directory.', {
        't': {
            alias: 'tilesOnly',
            description: 'Only tile files (.b3dm, .i3dm, .pnts, .vctr) should be gzipped.'
        }
    })
    .command('ungzip', 'Ungzips the input tileset directory.')
    .demand(1)
    .recommendCommands()
    .strict()
    .parse(args);

var command = argv._[0];
var input = defaultValue(argv.i, argv._[1]);
var output = defaultValue(argv.o, argv._[2]);
var force = argv.f;

if (!defined(input)) {
    console.log('-i or --input argument is required. See --help for details.');
    return;
}

console.time('Total');

if (command === 'pipeline') {
    processPipeline(input, force)
        .then(function() {
            console.timeEnd('Total');
        });
} else if (command === 'glbToB3dm') {
    // glbToB3dm is not a pipeline tool, so handle it separately.
    readGlbWriteB3dm(input, output, force);
} else if (command === 'b3dmToGlb') {
    // b3dmToGlb is not a pipeline tool, so handle it separately.
    readB3dmWriteGlb(input, output, force);
} else if (command === 'optimizeB3dm') {
    // optimizeB3dm is not a pipeline tool, so handle it separately.
    readAndOptimizeB3dm(input, output, force);
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

function readGlbWriteB3dm(inputPath, outputPath, force) {
    outputPath = defaultValue(outputPath, inputPath.slice(0, inputPath.length - 3) + 'b3dm');
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

function readB3dmWriteGlb(inputPath, outputPath, force) {
    outputPath = defaultValue(outputPath, inputPath.slice(0, inputPath.length - 4) + 'glb');
    return fileExists(outputPath)
        .then(function(exists) {
            if (!force && exists) {
                console.log('File ' + outputPath + ' already exists. Specify -f or --force to overwrite existing file.');
                return;
            }
            return fsReadFile(inputPath)
                .then(function(data) {
                    return fsWriteFile(outputPath, extractB3dm(data).glb);
                });
        });
}

function readAndOptimizeB3dm(inputPath, outputPath, force) {
    var options = {};
    if (defined(optionArgs)) {
        // Specify input for argument parsing even though it won't be used
        optionArgs.push('-i');
        optionArgs.push('null');
        options = GltfPipeline.parseArguments(optionArgs);
    }
    outputPath = defaultValue(outputPath, inputPath.slice(0, inputPath.length - 5) + '-optimized.b3dm');
    var b3dm;
    fileExists(outputPath)
        .then(function(exists) {
            if (exists && !force) {
                throw new Error('File ' + outputPath + ' already exists. Specify -f or --force to overwrite existing file.');
            } else {
                return fsReadFile(inputPath);
            }
        })
        .then(function(fileBuffer) {
            if (isGzipped(fileBuffer)) {
                return zlibGunzip(fileBuffer);
            }
            return fileBuffer;
        })
        .then(function(fileBuffer) {
            b3dm = extractB3dm(fileBuffer);
            return optimizeGlb(b3dm.glb, options);
        })
        .then(function(glbBuffer) {
            var b3dmBuffer = glbToB3dm(glbBuffer, b3dm.batchTable.JSON, b3dm.batchTable.binary, b3dm.header.batchLength);
            if (argv.z) {
                return zlibGzip(b3dmBuffer);
            }
            return b3dmBuffer;
        })
        .then(function(buffer) {
            return fsWriteFile(outputPath, buffer);
        })
        .catch(function(err) {
            console.log(err);
        });
}

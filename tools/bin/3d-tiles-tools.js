#!/usr/bin/env node
'use strict';
var Cesium = require('cesium');
var fsExtra = require('fs-extra');
var GltfPipeline = require('gltf-pipeline');
var path = require('path');
var Promise = require('bluebird');
var yargs = require('yargs');
var createB3dm = require('../lib/createB3dm');
var createI3dm = require('../lib/createI3dm');
var databaseToTileset = require('../lib/databaseToTileset');
var extractB3dm = require('../lib/extractB3dm');
var extractCmpt = require('../lib/extractCmpt');
var extractI3dm = require('../lib/extractI3dm');
var getMagic = require('../lib/getMagic');
var readFile = require('../lib/readFile');
var runPipeline = require('../lib/runPipeline');
var tilesetToDatabase = require('../lib/tilesetToDatabase');

var combine = Cesium.combine;
var defaultValue = Cesium.defaultValue;
var DeveloperError = Cesium.DeveloperError;
var RuntimeError = Cesium.RuntimeError;

var glbToGltf = GltfPipeline.glbToGltf;
var gltfToGlb = GltfPipeline.gltfToGlb;
var parseArguments = GltfPipeline.parseArguments;
var processGlb = GltfPipeline.processGlb;

var index = -1;
for (var i = 0; i < process.argv.length; i++) {
    if (process.argv[i] === '--options') {
        index = i;
        break;
    }
}

var args;
var gltfPipelineArgs;
if (index < 0) {
    args = process.argv.slice(2);
    gltfPipelineArgs = [];
} else {
    args = process.argv.slice(2, index);
    gltfPipelineArgs = process.argv.slice(index + 1);
}

// Specify input for argument parsing even though it won't be used
gltfPipelineArgs.push('-i');
gltfPipelineArgs.push('null');

var argv = yargs
    .usage('Usage: $0 <command> [options]')
    .example('node $0 upgrade -i tileset')
    .example('node $0 gzip -i tileset -o tileset-gzipped')
    .example('node $0 optimizeB3dm -i tile.b3dm --options -d')
    .help('h')
    .alias('h', 'help')
    .options({
        input: {
            alias: 'i',
            description: 'Input path for the command.',
            type: 'string',
            normalize: true,
            demandOption: true,
            global: true
        },
        output: {
            alias: 'o',
            description: 'Output path for the command.',
            type: 'string',
            normalize: true,
            global: true
        },
        quiet: {
            alias: 'q',
            default: false,
            description: 'Don\'t log messages to the console.',
            type: 'boolean',
            global: true
        }
    })
    .command('pipeline', 'Execute the input pipeline JSON file.')
    .command('tilesetToDatabase', 'Create a sqlite database for a tileset.')
    .command('databaseToTileset', 'Unpack a tileset database to a tileset folder.')
    .command('glbToB3dm', 'Repackage the input glb as a b3dm with a basic header.')
    .command('glbToI3dm', 'Repackage the input glb as a i3dm with a basic header.')
    .command('b3dmToGlb', 'Extract the binary glTF asset from the input b3dm.', {
        json: {
            alias: 'j',
            description: 'Save the glTF as .gltf rather than .glb',
            type: 'boolean'
        }
    })
    .command('i3dmToGlb', 'Extract the binary glTF asset from the input i3dm.', {
        json: {
            alias: 'j',
            description: 'Save the glTF as .gltf rather than .glb',
            type: 'boolean'
        }
    })
    .command('cmptToGlb', 'Extract the binary glTF assets from the input cmpt.', {
        json: {
            alias: 'j',
            description: 'Save glTF assets as .gltf rather than .glb',
            type: 'boolean'
        }
    })
    .command('optimizeB3dm', 'Pass the input b3dm through gltf-pipeline. To pass options to gltf-pipeline, place them after --options. (--options -h for gltf-pipeline help)', {
        options: {
            description: 'All arguments after this flag will be passed to gltf-pipeline as command line options.'
        }
    })
    .command('optimizeI3dm', 'Pass the input i3dm through gltf-pipeline. To pass options to gltf-pipeline, place them after --options. (--options -h for gltf-pipeline help)', {
        options: {
            description: 'All arguments after this flag will be passed to gltf-pipeline as command line options.'
        }
    })
    .command('gzip', 'Gzips the input tileset.', {
        tilesOnly: {
            alias: 't',
            default: false,
            description: 'Only tile files (.b3dm, .i3dm, .pnts, .vctr, .geom, .cmpt) should be gzipped.',
            type: 'boolean'
        }
    })
    .command('ungzip', 'Ungzips the input tileset.')
    .command('combine', 'Combines all external tilesets into a single tileset.json file.', {
        tilesetJsonOnly: {
            alias: 't',
            default: false,
            description: 'Only save the combined tileset.json file, skip tiles and other files.',
            type: 'boolean'
        }
    })
    .command('upgrade', 'Upgrades the input tileset to the latest version of the 3D Tiles spec. Embedded glTF models will be upgraded to glTF 2.0.')
    .demand(1)
    .recommendCommands()
    .strict()
    .parse(args);

var command = argv._[0];
var input = argv.input;
var output = argv.output;

console.time('Total');
runCommand(command, input, output, argv)
    .then(function() {
        if (!argv.quiet) {
            console.timeEnd('Total');
        }
    })
    .catch(function(error) {
        console.log(error);
        process.exit(1);
    });

function getLogger(argv) {
    if (argv.quiet) {
        return function() {};
    }
    return function(message) {
        console.log(message);
    };
}

function runCommand(command, input, output, argv) {
    if (command === 'pipeline') {
        return processPipeline(input, argv);
    } else if (command === 'gzip') {
        return processStage(input, output, command, argv);
    } else if (command === 'ungzip') {
        return processStage(input, output, command, argv);
    } else if (command === 'combine') {
        return processStage(input, output, command, argv);
    } else if (command === 'upgrade') {
        return processStage(input, output, command, argv);
    } else if (command === 'b3dmToGlb') {
        return b3dmToGlb(input, output, argv);
    } else if (command === 'i3dmToGlb') {
        return i3dmToGlb(input, output, argv);
    } else if (command === 'cmptToGlb') {
        return cmptToGlb(input, output, argv);
    } else if (command === 'glbToB3dm') {
        return glbToB3dm(input, output, argv);
    } else if (command === 'glbToI3dm') {
        return glbToI3dm(input, output, argv);
    } else if (command === 'optimizeB3dm') {
        return optimizeB3dm(input, output, argv, gltfPipelineArgs);
    } else if (command === 'optimizeI3dm') {
        return optimizeI3dm(input, output, argv, gltfPipelineArgs);
    } else if (command === 'tilesetToDatabase') {
        return runTilesetToDatabase(input, output, argv);
    } else if (command === 'databaseToTileset') {
        return runDatabaseToTileset(input, output, argv);
    }
    throw new DeveloperError('Invalid command: ' + command);
}

function runTilesetToDatabase(input, output, argv) {
    return tilesetToDatabase({
        inputDirectory: input,
        outputFile: output,
        logger: getLogger(argv)
    });
}

function runDatabaseToTileset(input, output, argv) {
    return databaseToTileset({
        inputFile: input,
        outputDirectory: output,
        logger: getLogger(argv)
    });
}

function processPipeline(inputFile, argv) {
    readFile(inputFile, 'json')
        .then(function(pipeline) {
            var options = {
                logger: getLogger(argv)
            };
            return runPipeline(pipeline, options);
        });
}

function processStage(inputDirectory, outputDirectory, command, argv) {
        var stage = getStage(command, argv);
        var pipeline = {
            input: inputDirectory,
            output: outputDirectory,
            stages: [stage]
        };
        var options = {
            logger: getLogger(argv)
        };
        return runPipeline(pipeline, options);
}

function getStage(stageName, argv) {
    var stage = {
        name: stageName
    };
    switch (stageName) {
        case 'gzip':
            stage.tilesOnly = argv.tilesOnly;
            break;
        case 'combine':
            stage.tilesetJsonOnly = argv.tilesetJsonOnly;
    }
    return stage;
}

function optimizeGlb(inputPath, glb, argv, gltfOptions) {
    gltfOptions = combine(gltfOptions, {
        resourceDirectory: path.dirname(inputPath),
        logger: getLogger(argv)
    });
    return processGlb(glb, gltfOptions)
        .then(function(results) {
            return results.glb;
        });
}

function readGlb(inputPath, argv) {
    var gltfOptions = {
        resourceDirectory: path.dirname(inputPath),
        logger: getLogger(argv)
    };
    var extension = path.extname(inputPath).toLowerCase();
    if (extension === '.gltf') {
        return readFile(inputPath, 'json')
            .then(function(gltf) {
                return gltfToGlb(gltf, gltfOptions);
            })
            .then(function(results) {
                return results.glb;
            });
    } else if (extension === '.glb') {
        return readFile(inputPath)
            .then(function(glb) {
                return processGlb(glb, gltfOptions);
            })
            .then(function(results) {
                return results.glb;
            });
    }
}

function writeGlb(inputPath, outputPath, glb, json, argv) {
    var gltfOptions = {
        resourceDirectory: path.dirname(inputPath),
        logger: getLogger(argv)
    };
    if (json) {
        return glbToGltf(glb, gltfOptions)
            .then(function(results) {
                return results.gltf;
            })
            .then(function(gltf) {
                return fsExtra.outputJson(outputPath, gltf);
            });
    }
    return fsExtra.outputFile(outputPath, glb);
}

function glbToB3dm(inputPath, outputPath, argv) {
    outputPath = defaultValue(outputPath, path.join(path.dirname(inputPath), path.basename(inputPath, path.extname(inputPath)) + '.b3dm'));
    return readGlb(inputPath, argv)
        .then(function(glb) {
            var b3dm = createB3dm({
                glb: glb,
                featureTableJson: {
                    BATCH_LENGTH: 0
                }
            });
            return fsExtra.outputFile(outputPath, b3dm);
        });
}

function glbToI3dm(inputPath, outputPath, argv) {
    outputPath = defaultValue(outputPath, path.join(path.dirname(inputPath), path.basename(inputPath, path.extname(inputPath)) + '.i3dm'));
    return readGlb(inputPath, argv)
        .then(function(glb) {
            var i3dm = createI3dm({
                glb: glb,
                featureTableJson: {
                    INSTANCES_LENGTH: 1,
                    POSITION: {
                        byteOffset: 0
                    }
                },
                featureTableBinary: Buffer.alloc(12, 0)
            });
            return fsExtra.outputFile(outputPath, i3dm);
        });
}

function b3dmToGlb(inputPath, outputPath, argv) {
    var json = argv.json;
    var extension = json ? '.gltf' : '.glb';
    outputPath = defaultValue(outputPath, path.join(path.dirname(inputPath), path.basename(inputPath, path.extname(inputPath)) + extension));
    return readFile(inputPath)
        .then(function(contents) {
            var b3dm = extractB3dm(contents);
            return writeGlb(inputPath, outputPath, b3dm.glb, json, argv);
        });
}

function i3dmToGlb(inputPath, outputPath, argv) {
    var json = argv.json;
    var extension = json ? '.gltf' : '.glb';
    outputPath = defaultValue(outputPath, path.join(path.dirname(inputPath), path.basename(inputPath, path.extname(inputPath)) + extension));
    return readFile(inputPath)
        .then(function(contents) {
            var i3dm = extractI3dm(contents);
            return writeGlb(inputPath, outputPath, i3dm.glb, json, argv);
        });
}

function extractGlbs(tiles) {
    var glbs = [];
    var tilesLength = tiles.length;
    for (var i = 0; i < tilesLength; ++i) {
        var tile = tiles[i];
        var magic = getMagic(tile);
        if (magic === 'i3dm') {
            glbs.push(extractI3dm(tile).glb);
        } else if (magic === 'b3dm') {
            glbs.push(extractB3dm(tile).glb);
        }
    }
    return glbs;
}

function cmptToGlb(inputPath, outputPath, argv) {
    var json = argv.json;
    var extension = json ? '.gltf' : '.glb';
    outputPath = defaultValue(outputPath, path.join(path.dirname(inputPath), path.basename(inputPath, path.extname(inputPath))));
    return readFile(inputPath)
        .then(function(cmpt) {
            var tiles = extractCmpt(cmpt);
            var glbs = extractGlbs(tiles);
            var glbsLength = glbs.length;
            var glbPaths = new Array(glbsLength);
            if (glbsLength === 0) {
                throw new RuntimeError('No glbs found in ' + inputPath + '.');
            } else if (glbsLength === 1) {
                glbPaths[0] = outputPath + extension;
            } else {
                for (var i = 0; i < glbsLength; ++i) {
                    glbPaths[i] = outputPath + '_' + i + extension;
                }
            }
            return Promise.map(glbPaths, function(glbPath, index) {
                return writeGlb(glbPath, outputPath, glbs[index], json, argv);
            });
        });
}

function optimizeB3dm(inputPath, outputPath, argv, gltfPipelineArgs) {
    var b3dm;
    outputPath = defaultValue(outputPath, path.join(path.dirname(inputPath), path.basename(inputPath, path.extname(inputPath)) + '-optimized.b3dm'));
    var gltfOptions = parseArguments(gltfPipelineArgs);
    return readFile(inputPath)
        .then(function(contents) {
            b3dm = extractB3dm(contents);
            return b3dm.glb;
        })
        .then(function(glb) {
            return optimizeGlb(inputPath, glb, argv, gltfOptions);
        })
        .then(function(glb) {
            b3dm.glb = glb;
            return createB3dm(b3dm);
        })
        .then(function(b3dm) {
            return fsExtra.outputFile(outputPath, b3dm);
        });
}

function optimizeI3dm(inputPath, outputPath, argv, gltfPipelineArgs) {
    var i3dm;
    outputPath = defaultValue(outputPath, path.join(path.dirname(inputPath), path.basename(inputPath, path.extname(inputPath)) + '-optimized.i3dm'));
    var gltfOptions = parseArguments(gltfPipelineArgs);
    return readFile(inputPath)
        .then(function(contents) {
            i3dm = extractI3dm(contents);
            return i3dm.glb;
        })
        .then(function(glb) {
            return optimizeGlb(inputPath, glb, argv, gltfOptions);
        })
        .then(function(glb) {
            i3dm.glb = glb;
            return createI3dm(i3dm);
        })
        .then(function(i3dm) {
            return fsExtra.outputFile(outputPath, i3dm);
        });
}

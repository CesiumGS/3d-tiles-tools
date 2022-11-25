#!/usr/bin/env node
'use strict';
const Cesium = require('cesium');
const fsExtra = require('fs-extra');
const GltfPipeline = require('gltf-pipeline');
const path = require('path');
const Promise = require('bluebird');
const yargs = require('yargs');
const zlib = require('zlib');
const databaseToTileset = require('../lib/databaseToTileset');
const directoryExists = require('../lib/directoryExists');
const extractB3dm = require('../lib/extractB3dm');
const extractCmpt = require('../lib/extractCmpt');
const extractI3dm = require('../lib/extractI3dm');
const fileExists = require('../lib/fileExists');
const getBufferPadded = require('../lib/getBufferPadded');
const getMagic = require('../lib/getMagic');
const getJsonBufferPadded = require('../lib/getJsonBufferPadded');
const glbToB3dm = require('../lib/glbToB3dm');
const glbToI3dm = require('../lib/glbToI3dm');
const isGzipped = require('../lib/isGzipped');
const optimizeGlb = require('../lib/optimizeGlb');
const runPipeline = require('../lib/runPipeline');
const tilesetToDatabase = require('../lib/tilesetToDatabase');

const zlibGunzip = Promise.promisify(zlib.gunzip);
const zlibGzip = Promise.promisify(zlib.gzip);

const defaultValue = Cesium.defaultValue;
const defined = Cesium.defined;
const DeveloperError = Cesium.DeveloperError;

let index = -1;
for (let i = 0; i < process.argv.length; i++) {
    if (process.argv[i] === '--options') {
        index = i;
        break;
    }
}

let args;
let optionArgs;
if (index < 0) {
    args = process.argv.slice(2);
    optionArgs = [];
} else {
    args = process.argv.slice(2, index);
    optionArgs = process.argv.slice(index + 1);
}

// Specify input for argument parsing even though it won't be used
optionArgs.push('-i');
optionArgs.push('null');

const argv = yargs
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
    .command('tilesetToDatabase', 'Create a sqlite database for a tileset.')
    .command('databaseToTileset', 'Unpack a tileset database to a tileset folder.')
    .command('glbToB3dm', 'Repackage the input glb as a b3dm with a basic header.')
    .command('glbToI3dm', 'Repackage the input glb as a i3dm with a basic header.')
    .command('b3dmToGlb', 'Extract the binary glTF asset from the input b3dm.')
    .command('i3dmToGlb', 'Extract the binary glTF asset from the input i3dm.')
    .command('cmptToGlb', 'Extract the binary glTF assets from the input cmpt.')
    .command('optimizeB3dm', 'Pass the input b3dm through gltf-pipeline. To pass options to gltf-pipeline, place them after --options. (--options -h for gltf-pipeline help)', {
        'options': {
            description: 'All arguments after this flag will be passed to gltf-pipeline as command line options.'
        }
    })
    .command('optimizeI3dm', 'Pass the input i3dm through gltf-pipeline. To pass options to gltf-pipeline, place them after --options. (--options -h for gltf-pipeline help)', {
        'options': {
            description: 'All arguments after this flag will be passed to gltf-pipeline as command line options.'
        }
    })
    .command('gzip', 'Gzips the input tileset directory.', {
        't': {
            alias: 'tilesOnly',
            default: false,
            description: 'Only tile files (.b3dm, .i3dm, .pnts, .vctr) should be gzipped.',
            type: 'boolean'
        }
    })
    .command('ungzip', 'Ungzips the input tileset directory.')
    .command('combine', 'Combines all external tilesets into a single tileset.json file.', {
        'r': {
            alias: 'rootJson',
            default: 'tileset.json',
            description: 'Relative path to the root tileset.json file.',
            normalize: true,
            type: 'string'
        }
    })
    .command('upgrade', 'Upgrades the input tileset to the latest version of the 3D Tiles spec. Embedded glTF models will be upgraded to glTF 2.0.')
    .demand(1)
    .recommendCommands()
    .strict()
    .parse(args);

const command = argv._[0];
const input = defaultValue(argv.i, argv._[1]);
const output = defaultValue(argv.o, argv._[2]);
const force = argv.f;

if (!defined(input)) {
    console.log('-i or --input argument is required. See --help for details.');
    return;
}

console.time('Total');
runCommand(command, input, output, force, argv)
    .then(function() {
        console.timeEnd('Total');
    })
    .catch(function(error) {
        console.log(error.message);
    });

function runCommand(command, input, output, force, argv) {
    if (command === 'pipeline') {
        return processPipeline(input, force);
    } else if (command === 'gzip') {
        return processStage(input, output, force, command, argv);
    } else if (command === 'ungzip') {
        return processStage(input, output, force, command, argv);
    } else if (command === 'combine') {
        return processStage(input, output, force, command, argv);
    } else if (command === 'upgrade') {
        return processStage(input, output, force, command, argv);
    } else if (command === 'b3dmToGlb') {
        return readB3dmWriteGlb(input, output, force);
    } else if (command === 'i3dmToGlb') {
        return readI3dmWriteGlb(input, output, force);
    } else if (command === 'cmptToGlb') {
        return readCmptWriteGlb(input, output, force);
    } else if (command === 'glbToB3dm') {
        return readGlbWriteB3dm(input, output, force);
    } else if (command === 'glbToI3dm') {
        return readGlbWriteI3dm(input, output, force);
    } else if (command === 'optimizeB3dm') {
        return readAndOptimizeB3dm(input, output, force, optionArgs);
    } else if (command === 'optimizeI3dm') {
        return readAndOptimizeI3dm(input, output, force, optionArgs);
    } else if (command === 'tilesetToDatabase') {
        return convertTilesetToDatabase(input, output, force);
    } else if (command === 'databaseToTileset') {
        return convertDatabaseToTileset(input, output, force);
    }
    throw new DeveloperError(`Invalid command: ${  command}`);
}

function checkDirectoryOverwritable(directory, force) {
    if (force) {
        return Promise.resolve();
    }
    return directoryExists(directory)
        .then(function(exists) {
            if (exists) {
                throw new DeveloperError(`Directory ${  directory  } already exists. Specify -f or --force to overwrite existing files.`);
            }
        });
}

function checkFileOverwritable(file, force) {
    if (force) {
        return Promise.resolve();
    }
    return fileExists(file)
        .then(function (exists) {
            if (exists) {
                throw new DeveloperError(`File ${  file  } already exists. Specify -f or --force to overwrite existing files.`);
            }
        });
}

function readFile(file) {
    return fsExtra.readFile(file)
        .then(function(fileBuffer) {
            if (isGzipped(fileBuffer)) {
                return zlibGunzip(fileBuffer);
            }
            return fileBuffer;
        });
}

function logCallback(message) {
    console.log(message);
}

function processPipeline(inputFile) {
    return fsExtra.readJson(inputFile)
        .then(function(pipeline) {
            let inputDirectory = pipeline.input;
            let outputDirectory = pipeline.output;

            if (!defined(inputDirectory)) {
                throw new DeveloperError('pipeline.input is required.');
            }

            outputDirectory = path.normalize(defaultValue(outputDirectory, path.join(path.dirname(inputDirectory), `${path.basename(inputDirectory)  }-processed`)));

            // Make input and output relative to the root directory
            inputDirectory = path.join(path.dirname(inputFile), inputDirectory);
            outputDirectory = path.join(path.dirname(inputFile), outputDirectory);

            return checkDirectoryOverwritable(outputDirectory, force)
                .then(function() {
                    pipeline.input = inputDirectory;
                    pipeline.output = outputDirectory;

                    const options = {
                        logCallback : logCallback
                    };

                    return runPipeline(pipeline, options);
                });
        });
}

function processStage(inputDirectory, outputDirectory, force, command, argv) {
    outputDirectory = defaultValue(outputDirectory, path.join(path.dirname(inputDirectory), `${path.basename(inputDirectory)  }-processed`));
    return checkDirectoryOverwritable(outputDirectory, force)
        .then(function() {
            const stage = getStage(command, argv);

            const pipeline = {
                input : inputDirectory,
                output : outputDirectory,
                stages : [stage]
            };

            const options = {
                logCallback : logCallback
            };

            return runPipeline(pipeline, options);
        });
}

function getStage(stageName, argv) {
    const stage = {
        name : stageName
    };
    switch (stageName) {
        case 'gzip':
            stage.tilesOnly = argv.tilesOnly;
            break;
        case 'combine':
            stage.rootJson = argv.rootJson;
    }
    return stage;
}

function convertTilesetToDatabase(inputDirectory, outputPath, force) {
    outputPath = defaultValue(outputPath, path.join(path.dirname(inputDirectory), `${path.basename(inputDirectory)  }.3dtiles`));
    return checkFileOverwritable(outputPath, force)
        .then(function() {
            return tilesetToDatabase(inputDirectory, outputPath);
        });
}

function convertDatabaseToTileset(inputPath, outputDirectory, force) {
    outputDirectory = defaultValue(outputDirectory, path.join(path.dirname(inputPath), path.basename(inputPath, path.extname(inputPath))));
    return checkDirectoryOverwritable(outputDirectory, force)
        .then(function() {
            return databaseToTileset(inputPath, outputDirectory);
        });
}

function readGlbWriteB3dm(inputPath, outputPath, force) {
    outputPath = defaultValue(outputPath, `${inputPath.slice(0, inputPath.length - 3)  }b3dm`);
    return checkFileOverwritable(outputPath, force)
        .then(function() {
            return readFile(inputPath)
                .then(function(glb) {
                    // Set b3dm spec requirements
                    const featureTableJson = {
                        BATCH_LENGTH : 0
                    };
                    return fsExtra.outputFile(outputPath, glbToB3dm(glb, featureTableJson));
                });
        });
}

function readGlbWriteI3dm(inputPath, outputPath, force) {
    outputPath = defaultValue(outputPath, `${inputPath.slice(0, inputPath.length - 3)  }i3dm`);
    return checkFileOverwritable(outputPath, force)
        .then(function() {
            return readFile(inputPath)
                .then(function(glb) {
                    // Set i3dm spec requirements
                    const featureTable = {
                        INSTANCES_LENGTH : 1,
                        POSITION : {
                            byteOffset : 0
                        }
                    };
                    const featureTableJsonBuffer = getJsonBufferPadded(featureTable);
                    const featureTableBinaryBuffer = getBufferPadded(Buffer.alloc(12, 0)); // [0, 0, 0]

                    return fsExtra.outputFile(outputPath, glbToI3dm(glb, featureTableJsonBuffer, featureTableBinaryBuffer));
                });
        });
}

function readB3dmWriteGlb(inputPath, outputPath, force) {
    outputPath = defaultValue(outputPath, `${inputPath.slice(0, inputPath.length - 4)  }glb`);
    return checkFileOverwritable(outputPath, force)
        .then(function() {
            return readFile(inputPath);
        })
        .then(function(b3dm) {
            return fsExtra.outputFile(outputPath, extractB3dm(b3dm).glb);
        });
}

function readI3dmWriteGlb(inputPath, outputPath, force) {
    outputPath = defaultValue(outputPath, `${inputPath.slice(0, inputPath.length - 4)  }glb`);
    return checkFileOverwritable(outputPath, force)
        .then(function() {
            return readFile(inputPath);
        })
        .then(function(i3dm) {
            return fsExtra.outputFile(outputPath, extractI3dm(i3dm).glb);
        });
}

function extractGlbs(tiles) {
    const glbs = [];
    const tilesLength = tiles.length;
    for (let i = 0; i < tilesLength; ++i) {
        const tile = tiles[i];
        const magic = getMagic(tile);
        if (magic === 'i3dm') {
            glbs.push(extractI3dm(tile).glb);
        } else if (magic === 'b3dm') {
            glbs.push(extractB3dm(tile).glb);
        }
    }
    return glbs;
}

function readCmptWriteGlb(inputPath, outputPath, force) {
    outputPath = defaultValue(outputPath, inputPath.slice(0, inputPath.length - 5));
    return readFile(inputPath)
        .then(function(cmpt) {
            const tiles = extractCmpt(cmpt);
            const glbs = extractGlbs(tiles);
            const glbsLength = glbs.length;
            const glbPaths = new Array(glbsLength);
            if (glbsLength === 0) {
                throw new DeveloperError(`No glbs found in ${  inputPath  }.`);
            } else if (glbsLength === 1) {
                glbPaths[0] = `${outputPath  }.glb`;
            } else {
                for (let i = 0; i < glbsLength; ++i) {
                    glbPaths[i] = `${outputPath  }_${  i  }.glb`;
                }
            }
            return Promise.map(glbPaths, function(glbPath) {
                return checkFileOverwritable(glbPath, force);
            }).then(function() {
                return Promise.map(glbPaths, function(glbPath, index) {
                    return fsExtra.outputFile(glbPath, glbs[index]);
                });
            });
        });
}

function readAndOptimizeB3dm(inputPath, outputPath, force, optionArgs) {
    const options = GltfPipeline.parseArguments(optionArgs);
    outputPath = defaultValue(outputPath, `${inputPath.slice(0, inputPath.length - 5)  }-optimized.b3dm`);
    let gzipped;
    let b3dm;
    return checkFileOverwritable(outputPath, force)
        .then(function() {
            return fsExtra.readFile(inputPath);
        })
        .then(function(fileBuffer) {
            gzipped = isGzipped(fileBuffer);
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
            const b3dmBuffer = glbToB3dm(glbBuffer, b3dm.featureTable.json, b3dm.featureTable.binary, b3dm.batchTable.json, b3dm.batchTable.binary);
            if (gzipped) {
                return zlibGzip(b3dmBuffer);
            }
            return b3dmBuffer;
        })
        .then(function(buffer) {
            return fsExtra.outputFile(outputPath, buffer);
        });
}

function readAndOptimizeI3dm(inputPath, outputPath, force, optionArgs) {
    const options = GltfPipeline.parseArguments(optionArgs);
    outputPath = defaultValue(outputPath, `${inputPath.slice(0, inputPath.length - 5)  }-optimized.i3dm`);
    let gzipped;
    let i3dm;
    return checkFileOverwritable(outputPath, force)
        .then(function() {
            return fsExtra.readFile(inputPath);
        })
        .then(function(fileBuffer) {
            gzipped = isGzipped(fileBuffer);
            if (isGzipped(fileBuffer)) {
                return zlibGunzip(fileBuffer);
            }
            return fileBuffer;
        })
        .then(function(fileBuffer) {
            i3dm = extractI3dm(fileBuffer);
            return optimizeGlb(i3dm.glb, options);
        })
        .then(function(glbBuffer) {
            const i3dmBuffer = glbToI3dm(glbBuffer, i3dm.featureTable.json, i3dm.featureTable.binary, i3dm.batchTable.json, i3dm.batchTable.binary);
            if (gzipped) {
                return zlibGzip(i3dmBuffer);
            }
            return i3dmBuffer;
        })
        .then(function(buffer) {
            return fsExtra.outputFile(outputPath, buffer);
        });
}

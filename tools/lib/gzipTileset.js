'use strict';
var Cesium = require('cesium');
var fsExtra = require('fs-extra');
var path = require('path');
var Promise = require('bluebird');
var zlib = require('zlib');
var getDefaultWriteCallback = require('./getDefaultWriteCallback');
var isGzipped = require('./isGzipped');

var fsExtraReadFile = Promise.promisify(fsExtra.readFile);

var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;
var DeveloperError = Cesium.DeveloperError;

module.exports = gzipTileset;

/**
 * gzips or ungzips the input tileset.
 *
 * @param {Object} options Object with the following properties:
 * @param {String} options.inputDirectory Path to the input directory.
 * @param {Object} [options.outputDirectory] Path to the output directory.
 * @param {Boolean} [options.gzip=true] Whether to gzip or ungzip the tileset.
 * @param {Boolean} [options.tilesOnly=false] Only gzip tiles, does not gzip tileset.json or other files.
 * @param {WriteCallback} [options.writeCallback] A callback function that writes files after they have been processed.
 * @param {LogCallback} [options.logCallback] A callback function that logs messages.
 */
function gzipTileset(options) {
    options = defaultValue(options, defaultValue.EMPTY_OBJECT);
    var inputDirectory = options.inputDirectory;
    var outputDirectory = options.outputDirectory;
    var gzip = defaultValue(options.gzip, true);
    var tilesOnly = defaultValue(options.tilesOnly, false);

    if (!defined(inputDirectory)) {
        throw new DeveloperError('inputDirectory is required');
    }
    inputDirectory = path.normalize(inputDirectory);
    outputDirectory = path.normalize(defaultValue(outputDirectory,
        path.join(path.dirname(inputDirectory), path.basename(inputDirectory) + '-' + (gzip ? 'gzipped' : 'ungzipped'))));

    var writeCallback = defaultValue(options.writeCallback, getDefaultWriteCallback(outputDirectory));
    var logCallback = options.logCallback;

    if (defined(logCallback)) {
        logCallback((gzip ? 'Compressing' : 'Uncompressing') + ' files...');
    }

    var operation = gzip ? zlib.gzipSync : zlib.gunzipSync;

    return new Promise(function(resolve, reject) {
        getNumberOfFilesInDirectory(inputDirectory)
            .then(function(numberOfFiles) {
                var writeFile = getWriteFile(writeCallback, numberOfFiles, resolve, reject);
                fsExtra.walk(inputDirectory)
                    .on('data', function (item) {
                        if (!item.stats.isDirectory()) {
                            var inputFile = item.path;
                            var file = path.relative(inputDirectory, item.path);

                            if (gzip && tilesOnly && !isTile(inputFile)) {
                                copyFile(inputFile, file, writeFile);
                            } else {
                                isGzipped(inputFile)
                                    .then(function(fileIsGzipped) {
                                        if (fileIsGzipped === gzip) {
                                            // File is already in the correct state
                                            copyFile(inputFile, file, writeFile);
                                        } else {
                                            fsExtraReadFile(inputFile)
                                                .then(function(data) {
                                                    data = operation(data);
                                                    writeFile(file, data);
                                                })
                                                .catch(reject);
                                        }
                                    })
                                    .catch(reject);
                            }
                        }
                    })
                    .on('error', reject);
            })
            .catch(reject);
    });
}

function isTile(file) {
    var extension = path.extname(file);
    return extension === '.b3dm' ||
           extension === '.i3dm' ||
           extension === '.pnts' ||
           extension === '.cmpt' ||
           extension === '.vctr';
}

function getNumberOfFilesInDirectory(directory) {
    return new Promise(function(resolve, reject) {
        var numberOfFiles = 0;
        fsExtra.walk(directory)
            .on('data', function (item) {
                if (!item.stats.isDirectory()) {
                    ++numberOfFiles;
                }
            })
            .on('end', function () {
                resolve(numberOfFiles);
            })
            .on('error', reject);
    });
}

function getWriteFile(writeCallback, numberOfFiles, resolve, reject) {
    var numberComplete = 0;
    function complete() {
        ++numberComplete;
        if (numberComplete === numberOfFiles) {
            resolve();
        }
    }
    return function(file, data) {
        var promise = writeCallback(file, data);
        if (defined(promise)) {
            promise
                .then(complete)
                .catch(reject);
        } else {
            complete();
        }
    };
}

function copyFile(inputFile, file, writeFile) {
    return fsExtraReadFile(inputFile)
        .then(function(data) {
            return writeFile(file, data);
        });
}

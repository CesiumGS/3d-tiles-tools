'use strict';

var Cesium = require('cesium');
var fsExtra = require('fs-extra');
var path = require('path');
var Promise = require('bluebird');
var zlib = require('zlib');

var fsExtraCopy = Promise.promisify(fsExtra.copy);
var fsExtraEnsureDir = Promise.promisify(fsExtra.ensureDir);
var fsExtraReadFile = Promise.promisify(fsExtra.readFile);

var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;
var DeveloperError = Cesium.DeveloperError;

module.exports = gzipTileset;

/**
 * gzips or gunzips the input tileset.
 *
 * @param {String} inputDirectory Path to the tileset directory.
 * @param {Object} [outputDirectory] Path to the output directory.
 * @param {Boolean} [gzip=true] Whether to gzip or gunzip the tileset.
 * @param {Boolean} [verbose=false] If true prints out debug messages to the console.
 */
function gzipTileset(inputDirectory, outputDirectory, gzip, verbose) {
    return new Promise(function(resolve, reject) {
        gzip = defaultValue(gzip, true);

        if (!defined(inputDirectory)) {
            reject(new DeveloperError('inputDirectory is required'));
        }
        inputDirectory = path.normalize(inputDirectory);
        outputDirectory = path.normalize(defaultValue(outputDirectory,
            path.join(path.dirname(inputDirectory), path.basename(inputDirectory) + '-' + (gzip ? 'gzipped' : 'gunzipped'))));

        if (verbose) {
            console.log('Input directory: ' + inputDirectory);
            console.log('Output directory: ' + outputDirectory);
        }

        var files = [];
        fsExtra.walk(inputDirectory)
            .on('data', function (item) {
                if (!item.stats.isDirectory()) {
                    files.push(path.relative(inputDirectory, item.path));
                }
            })
            .on('end', function () {
                if (verbose) {
                    console.log(files.length + ' files found.');
                    console.log((gzip ? 'Compressing' : 'Uncompressing') + ' files...');
                }
                Promise.map(files, function (file) {
                    var inputFile = path.join(inputDirectory, file);
                    var outputFile = path.join(outputDirectory, file);

                    return isGzipped(inputFile)
                        .then(function(fileIsGzipped) {
                            if (fileIsGzipped === gzip) {
                                return fsExtraCopy(inputFile, outputFile);
                            }
                            return fsExtraEnsureDir(path.dirname(outputFile))
                                .then(function () {
                                    var inp = fsExtra.createReadStream(inputFile);
                                    var out = fsExtra.createWriteStream(outputFile);
                                    var operation = gzip ? zlib.createGzip() : zlib.createGunzip();
                                    return streamToPromise(inp.pipe(operation).pipe(out));
                                });

                        });
                }, {concurrency: 1024})
                    .then(resolve)
                    .catch(reject);
            })
            .on('error', reject);
    });
}

function isGzipped(path) {
    return fsExtraReadFile(path)
        .then(function (data) {
            return (data[0] === 0x1f) && (data[1] === 0x8b);
        });
}

function streamToPromise(stream) {
    return new Promise(function(resolve, reject) {
        stream.on('finish', resolve);
        stream.on('end', reject);
    });
}

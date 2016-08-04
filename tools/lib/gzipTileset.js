'use strict';

var Cesium = require('cesium');
var fsExtra = require('fs-extra');
var path = require('path');
var Promise = require('bluebird');
var zlib = require('zlib');

var fsExtraEnsureDir = Promise.promisify(fsExtra.ensureDir);
var fsExtraReadFile = Promise.promisify(fsExtra.readFile);

var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;
var DeveloperError = Cesium.DeveloperError;

module.exports = gzipTileset;

/**
 * Detects whether the tileset is compressed or not and does the opposite.
 *
 * @param {String} inputPath Path to the tileset directory or tileset.json file.
 * @param {Object} [outputDirectory] Path to the output directory.
 * @param {Boolean} [verbose] If true prints out debug messages to the console.
 */
function gzipTileset(inputPath, outputDirectory, verbose) {
    return new Promise(function(resolve, reject) {
        if (!defined(inputPath)) {
            reject(new DeveloperError('inputPath is required'));
        }
        inputPath = path.normalize(inputPath);

        var tilesetPath = inputPath;
        if (!isJson(tilesetPath)) {
            tilesetPath = path.join(inputPath, 'tileset.json');
        }
        var tilesetDirectory = path.dirname(tilesetPath);

        fsExtraReadFile(tilesetPath)
            .then(function (data) {
                var gzip = !isGzipped(data);

                outputDirectory = path.normalize(defaultValue(outputDirectory,
                    path.join(path.dirname(tilesetDirectory), path.basename(tilesetDirectory) + '-' + (gzip ? 'gzipped' : 'gunzipped'))));

                if (verbose) {
                    console.log('Input directory: ' + tilesetDirectory);
                    console.log('Output directory: ' + outputDirectory);
                }

                var files = [];
                fsExtra.walk(tilesetDirectory)
                    .on('data', function (item) {
                        if (!item.stats.isDirectory()) {
                            files.push(path.relative(tilesetDirectory, item.path));
                        }
                    })
                    .on('end', function () {
                        if (verbose) {
                            console.log(files.length + ' files found.');
                            console.log((gzip ? 'Compressing' : 'Uncompressing') + ' files...');
                        }
                        Promise.map(files, function (file) {
                            var outFile = path.join(outputDirectory, file);
                            return fsExtraEnsureDir(path.dirname(outFile))
                                .then(function () {
                                    var inp = fsExtra.createReadStream(path.join(tilesetDirectory, file));
                                    var out = fsExtra.createWriteStream(path.join(outputDirectory, file));
                                    var operation = gzip ? zlib.createGzip() : zlib.createGunzip();
                                    return streamToPromise(inp.pipe(operation).pipe(out));
                                });
                        }, {concurrency: 1024})
                            .then(resolve)
                            .catch(reject);
                    })
                    .on('error', reject);
            })
            .catch(reject);
    });
}

function isGzipped(data) {
    return (data[0] === 0x1f) && (data[1] === 0x8b);
}

function streamToPromise(stream) {
    return new Promise(function(resolve, reject) {
        stream.on('finish', resolve);
        stream.on('end', reject);
    });
}

function isJson(path) {
    return path.slice(-5) === '.json';
}

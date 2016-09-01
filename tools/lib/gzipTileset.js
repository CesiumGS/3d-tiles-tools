'use strict';
var Cesium = require('cesium');
var fsExtra = require('fs-extra');
var path = require('path');
var Promise = require('bluebird');
var zlib = require('zlib');
var isGzipped = require('./isGzipped');

var fsExtraCopy = Promise.promisify(fsExtra.copy);
var fsExtraEnsureDir = Promise.promisify(fsExtra.ensureDir);

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
 * @param {Boolean} [options.verbose=false] If true prints out debug messages to the console.
 */
function gzipTileset(options) {
    return new Promise(function(resolve, reject) {
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);
        var inputDirectory = options.inputDirectory;
        var outputDirectory = options.outputDirectory;
        var gzip = defaultValue(options.gzip, true);
        var tilesOnly = defaultValue(options.tilesOnly, false);
        var verbose = defaultValue(options.verbose, false);

        if (!defined(inputDirectory)) {
            reject(new DeveloperError('inputDirectory is required'));
        }
        inputDirectory = path.normalize(inputDirectory);
        outputDirectory = path.normalize(defaultValue(outputDirectory,
            path.join(path.dirname(inputDirectory), path.basename(inputDirectory) + '-' + (gzip ? 'gzipped' : 'ungzipped'))));

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

                    if (gzip && tilesOnly && !isTile(inputFile)) {
                        return fsExtraCopy(inputFile, outputFile);
                    }

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

function isTile(file) {
    var extension = path.extname(file);
    return extension === '.b3dm' ||
           extension === '.i3dm' ||
           extension === '.pnts' ||
           extension === '.cmpt' ||
           extension === '.vctr';
}

function streamToPromise(stream) {
    return new Promise(function(resolve, reject) {
        stream.on('finish', resolve);
        stream.on('end', reject);
    });
}

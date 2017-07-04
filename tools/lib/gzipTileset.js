'use strict';
var Cesium = require('cesium');
var fsExtra = require('fs-extra');
var path = require('path');
var zlib = require('zlib');
var getDefaultWriteCallback = require('./getDefaultWriteCallback');
var isGzipped = require('./isGzipped');
var isTile = require('./isTile');
var walkDirectory = require('./walkDirectory');

var Check = Cesium.Check;
var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;

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
 *
 * @returns {Promise} A promise that resolves when the operation completes.
 */
function gzipTileset(options) {
    options = defaultValue(options, defaultValue.EMPTY_OBJECT);
    var inputDirectory = options.inputDirectory;
    var outputDirectory = options.outputDirectory;
    var gzip = defaultValue(options.gzip, true);
    var tilesOnly = defaultValue(options.tilesOnly, false);

    Check.typeOf.string('options.inputDirectory', inputDirectory);

    inputDirectory = path.normalize(inputDirectory);
    outputDirectory = path.normalize(defaultValue(outputDirectory,
        path.join(path.dirname(inputDirectory), path.basename(inputDirectory) + '-' + (gzip ? 'gzipped' : 'ungzipped'))));

    var writeCallback = defaultValue(options.writeCallback, getDefaultWriteCallback(outputDirectory));
    var logCallback = options.logCallback;

    if (defined(logCallback)) {
        logCallback((gzip ? 'Compressing' : 'Uncompressing') + ' files...');
    }

    var operation = gzip ? zlib.gzipSync : zlib.gunzipSync;
    return walkDirectory(inputDirectory, function(file) {
        return fsExtra.readFile(file)
            .then(function(data) {
                if (!(gzip && tilesOnly && !isTile(file)) && (isGzipped(data) !== gzip)) {
                    data = operation(data);
                }
                var relativePath = path.relative(inputDirectory, file);
                return writeCallback(relativePath, data);
            });
    });
}

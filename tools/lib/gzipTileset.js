'use strict';
var Cesium = require('cesium');
var path = require('path');
var Promise = require('bluebird');
var zlib = require('zlib');
var getDefaultLogger = require('./getDefaultLogger');
var getDefaultWriter = require('./getDefaultWriter');
var getFilesInDirectory = require('./getFilesInDirectory');
var isGzipped = require('./isGzipped');
var isTile = require('./isTile');
var readFile = require('./readFile');

var Check = Cesium.Check;
var defaultValue = Cesium.defaultValue;

module.exports = gzipTileset;

/**
 * Gzips or ungzips the tileset.
 *
 * @param {Object} options An object with the following properties:
 * @param {String} options.inputDirectory Path to the input directory.
 * @param {Object} [options.outputDirectory] Path to the output directory.
 * @param {Boolean} [options.gzip=true] Whether to gzip or ungzip the tileset.
 * @param {Boolean} [options.tilesOnly=false] Only gzip tiles, does not gzip tileset.json or other files.
 * @param {Writer} [options.writer] A callback function that writes files after they have been processed.
 * @param {Logger} [options.logger] A callback function that logs messages. Defaults to console.log.
 *
 * @returns {Promise} A promise that resolves when the operation completes.
 */
function gzipTileset(options) {
    options = defaultValue(options, defaultValue.EMPTY_OBJECT);
    Check.typeOf.string('options.inputDirectory', options.inputDirectory);

    var gzip = defaultValue(options.gzip, true);
    var suffix = gzip ? 'gzipped' : 'ungzipped';
    var inputDirectory = options.inputDirectory;
    var outputDirectory = defaultValue(options.outputDirectory, path.join(path.dirname(inputDirectory), path.basename(inputDirectory) + '-' + suffix));
    var tilesOnly = defaultValue(options.tilesOnly, false);
    var writer = defaultValue(options.writer, getDefaultWriter(outputDirectory));
    var logger = defaultValue(options.logger, getDefaultLogger());

    logger((gzip ? 'Compressing' : 'Uncompressing') + ' files...');

    var operation = gzip ? zlib.gzipSync : zlib.gunzipSync;
    var files = getFilesInDirectory(inputDirectory);

    return Promise.map(files, function(file) {
        return readFile(file)
            .then(function(contents) {
                if (!(gzip && tilesOnly && !isTile(file)) && (isGzipped(contents) !== gzip)) {
                    contents = operation(contents);
                }
                var relativePath = path.relative(inputDirectory, file);
                return writer(relativePath, contents);
            });
    }, {concurrency: 100});
}

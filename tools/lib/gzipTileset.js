'use strict';
const Cesium = require('cesium');
const fsExtra = require('fs-extra');
const path = require('path');
const zlib = require('zlib');
const getDefaultWriteCallback = require('./getDefaultWriteCallback');
const isGzipped = require('./isGzipped');
const isTile = require('./isTile');
const walkDirectory = require('./walkDirectory');

const Check = Cesium.Check;
const defaultValue = Cesium.defaultValue;
const defined = Cesium.defined;

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
    let inputDirectory = options.inputDirectory;
    let outputDirectory = options.outputDirectory;
    const gzip = defaultValue(options.gzip, true);
    const tilesOnly = defaultValue(options.tilesOnly, false);

    Check.typeOf.string('options.inputDirectory', inputDirectory);

    inputDirectory = path.normalize(inputDirectory);
    outputDirectory = path.normalize(defaultValue(outputDirectory,
        path.join(path.dirname(inputDirectory), path.basename(inputDirectory) + '-' + (gzip ? 'gzipped' : 'ungzipped'))));

    const writeCallback = defaultValue(options.writeCallback, getDefaultWriteCallback(outputDirectory));
    const logCallback = options.logCallback;

    if (defined(logCallback)) {
        logCallback((gzip ? 'Compressing' : 'Uncompressing') + ' files...');
    }

    const operation = (gzip) ? zlib.gzipSync : zlib.gunzipSync;
    return walkDirectory(inputDirectory, function(file) {
        return fsExtra.readFile(file)
            .then(function(data) {
                if (!(gzip && tilesOnly && !isTile(file)) && (isGzipped(data) !== gzip)) {
                    data = operation(data);
                }
                const relativePath = path.relative(inputDirectory, file);
                return writeCallback(relativePath, data);
            });
    });
}

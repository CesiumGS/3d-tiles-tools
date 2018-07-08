'use strict';
var Cesium = require('cesium');
var fsExtra = require('fs-extra');
var zlib = require('zlib');
var isGzipped = require('./isGzipped');

var defaultValue = Cesium.defaultValue;

module.exports = readFile;

/**
 * Reads the contents of a file.
 *
 * @param {String} file The file to read from.
 * @param {String} [type='binary'] Whether to read the file as 'binary', 'text', or 'json'.
 *
 * @returns {Promise} A promise that resolves with the file contents as either a Buffer, String, or JSON object.
 *
 * @private
 */
function readFile(file, type) {
    type = defaultValue(type, 'binary');
    return fsExtra.readFile(file)
        .then(function(contents) {
            if (isGzipped(contents)) {
                contents = zlib.gunzipSync(contents);
            }
            if (type === 'text') {
                return contents.toString();
            } else if (type === 'json') {
                return JSON.parse(contents.toString());
            }
            return contents;
        });
}

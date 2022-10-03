'use strict';
const Cesium = require('cesium');
const fsExtra = require('fs-extra');
const zlib = require('zlib');
const isGzipped = require('./isGzipped');

const defaultValue = Cesium.defaultValue;

module.exports = readFile;

/**
 * Reads the contents of a file.
 *
 * @param {String} filePath The file path to read from.
 * @param {String} [type=binary] Whether to read the file as 'binary', 'text', or 'json'.
 * @returns {Promise} A promise that resolves with the file contents as either a Buffer, String, or JSON object.
 */
function readFile(filePath, type) {
    type = defaultValue(type, 'binary');
    return fsExtra.readFile(filePath)
        .then(function (data) {
            if (isGzipped(data)) {
                data = zlib.gunzipSync(data);
            }
            if (type === 'text') {
                return data.toString();
            } else if (type === 'json') {
                return JSON.parse(data.toString());
            }
            return data;
        });
}

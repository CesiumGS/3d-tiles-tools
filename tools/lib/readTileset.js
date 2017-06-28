'use strict';
var fsExtra = require('fs-extra');
var zlib = require('zlib');
var isGzipped = require('./isGzipped');

module.exports = readTileset;

/**
 * Reads a tileset from a file.
 *
 * @param {String} filePath The file path to read from.
 * @returns {Promise} A promise that resolves with the JSON when the read operation completes.
 */
function readTileset(filePath) {
    return fsExtra.readFile(filePath)
        .then(function (data) {
            if (isGzipped(data)) {
                data = zlib.gunzipSync(data);
            }
            return JSON.parse(data.toString());
        });
}

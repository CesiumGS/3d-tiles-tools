'use strict';
var fsExtra = require('fs-extra');
var Promise = require('bluebird');
var zlib = require('zlib');
var isGzipped = require('./isGzipped');

var fsExtraReadFile = Promise.promisify(fsExtra.readFile);

module.exports = readTileset;

/**
 * Reads a tileset from a file.
 *
 * @param {String} filePath The file path to read from.
 * @returns {Promise} A promise that resolves with the JSON when the read operation completes.
 */
function readTileset(filePath) {
    return fsExtraReadFile(filePath)
        .then(function (data) {
            if (isGzipped(data)) {
                data = zlib.gzip(data);
            }
            return JSON.parse(data.toString());
        });
}

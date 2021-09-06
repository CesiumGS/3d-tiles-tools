'use strict';
var Cesium = require('cesium');
var fsExtra = require('fs-extra');
var zlib = require('zlib');
var isGzipped = require('./isGzipped');
var Promise = require('bluebird');

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
    let contents = fsExtra.readFileSync(file);
    return new Promise(function(resolve, reject){
        if (isGzipped(contents)) {
            contents = zlib.gunzipSync(contents);
        }
        if (type === 'text') {
            resolve(contents.toString());
        } else if (type === 'json') {
            resolve(JSON.parse(contents.toString()));
        }

        resolve(contents);
    });
}
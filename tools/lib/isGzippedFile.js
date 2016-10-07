'use strict';
var fsExtra = require('fs-extra');
var Promise = require('bluebird');
var isGzipped = require('./isGzipped');

var fsExtraReadFile = Promise.promisify(fsExtra.readFile);

module.exports = isGzippedFile;

/**
 * Test if the provided file is gzipped.
 *
 * @param {String} filePath A buffer containing the data to test.
 * @returns {Promise} A promise that resolves with True if the file is gzipped, False if not.
 */
function isGzippedFile(filePath) {
    return fsExtraReadFile(filePath)
        .then(function (data) {
            return isGzipped(data);
        });
}

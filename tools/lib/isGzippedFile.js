'use strict';
var fsExtra = require('fs-extra');
var Promise = require('bluebird');
var isGzipped = require('./isGzipped');

module.exports = isGzippedFile;

var readStreamOptions = {
    start: 0,
    end: 2
};

/**
 * Determines whether a file is gzipped.
 *
 * @param {String} file The file.
 *
 * @returns {Promise} A promise that resolves to whether the file is gzipped.
 *
 * @private
 */
function isGzippedFile(file) {
    return new Promise(function(resolve, reject) {
        var readStream = fsExtra.createReadStream(file, readStreamOptions);
        readStream.on('error', reject);
        readStream.on('data', function(chunk) {
            resolve(isGzipped(chunk));
            readStream.destroy();
        });
    });
}

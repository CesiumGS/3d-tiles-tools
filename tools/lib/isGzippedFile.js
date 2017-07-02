'use strict';
var fsExtra = require('fs-extra');
var Promise = require('bluebird');
var isGzipped = require('./isGzipped');

module.exports = isGzippedFile;

var readStreamOptions = {
    start : 0,
    end : 2
};

/**
 * @private
 */
function isGzippedFile(file) {
    return new Promise(function (resolve, reject) {
        var readStream = fsExtra.createReadStream(file, readStreamOptions);
        readStream.on('error', reject);
        readStream.on('data', function(chunk) {
            resolve(isGzipped(chunk));
            readStream.destroy();
        });
    });
}

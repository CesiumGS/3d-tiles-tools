'use strict';
const fsExtra = require('fs-extra');
const Promise = require('bluebird');
const isGzipped = require('./isGzipped');

module.exports = isGzippedFile;

const readStreamOptions = {
    start : 0,
    end : 2
};

/**
 * @private
 */
function isGzippedFile(file) {
    return new Promise(function (resolve, reject) {
        const readStream = fsExtra.createReadStream(file, readStreamOptions);
        readStream.on('error', reject);
        readStream.on('data', function(chunk) {
            resolve(isGzipped(chunk));
            readStream.destroy();
        });
    });
}

'use strict';
var fsExtra = require('fs-extra');
var isGzipped = require('./isGzipped');

module.exports = isGzippedFile;

/**
 * @private
 */
function isGzippedFile(file) {
    return fsExtra.readFile(file)
        .then(function (buffer) {
            return isGzipped(buffer);
        });
}

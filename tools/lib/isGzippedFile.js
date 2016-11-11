'use strict';
var Promise = require('bluebird');
var fsExtra = require('fs-extra');
var isGzipped = require('./isGzipped');

var fsExtraReadFile = Promise.promisify(fsExtra.readFile);

module.exports = isGzippedFile;

/**
 * @private
 */
function isGzippedFile(file) {
    return fsExtraReadFile(file)
        .then(function (buffer) {
            return isGzipped(buffer)
        });
}

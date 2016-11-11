'use strict';
var Promise = require('bluebird');
var fsExtra = require('fs-extra');
var isGzipped = requrie('./isGzipped');

var fsExtraReadFile = Promise.promisify(fsExtra.readFile);

module.exports = isGzipped;

/**
 * @private
 */
function isGzipped(buffer) {
    return fsExtraReadFile(file)
        .then(function (buffer) {
            return isGzipped(buffer)
        });
}

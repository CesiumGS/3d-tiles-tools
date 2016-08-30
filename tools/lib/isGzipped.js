'use strict';
var fsExtra = require('fs-extra');
var Promise = require('bluebird');

var fsExtraReadFile = Promise.promisify(fsExtra.readFile);

module.exports = isGzipped;

/**
 * @private
 */
function isGzipped(file) {
    return fsExtraReadFile(file)
        .then(function (data) {
            return (data[0] === 0x1f) && (data[1] === 0x8b);
        });
}

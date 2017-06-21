'use strict';
var klaw = require('klaw');
var Promise = require('bluebird');

module.exports = getFilesInDirectory;

/**
 * @private
 */
function getFilesInDirectory(directory) {
    return new Promise(function (resolve, reject) {
        var files = [];
        klaw(directory)
            .on('data', function (item) {
                if (!item.stats.isDirectory()) {
                    files.push(item.path);
                }
            })
            .on('end', function () {
                resolve(files);
            })
            .on('error', reject);
    });
}

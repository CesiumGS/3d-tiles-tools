'use strict';
var fsExtra = require('fs-extra');
var Promise = require('bluebird');

module.exports = getFilesInDirectory;

/**
 * @private
 */
function getFilesInDirectory(directory) {
    return new Promise(function (resolve, reject) {
        var files = [];
        fsExtra.walk(directory)
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

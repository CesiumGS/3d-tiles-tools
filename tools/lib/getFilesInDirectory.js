'use strict';
const klaw = require('klaw');
const Promise = require('bluebird');

module.exports = getFilesInDirectory;

/**
 * @private
 */
function getFilesInDirectory(directory) {
    return new Promise(function (resolve, reject) {
        const files = [];
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

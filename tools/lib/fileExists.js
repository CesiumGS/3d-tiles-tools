'use strict';
var Promise = require('bluebird');
var fsExtra = require('fs-extra');
var fsStat = Promise.promisify(fsExtra.stat);

module.exports = fileExists;

/**
 * @private
 */
function fileExists(filePath) {
    return fsStat(filePath)
        .then(function(stats) {
            return stats.isFile();
        })
        .catch(function(err) {
            // If the file doesn't exist the error code is ENOENT.
            // Otherwise something else went wrong - permission issues, etc.
            if (err.code !== 'ENOENT') {
                throw err;
            }
            return false;
        });
}

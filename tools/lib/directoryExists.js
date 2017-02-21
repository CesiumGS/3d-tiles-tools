'use strict';
var Promise = require('bluebird');
var fsExtra = require('fs-extra');
var fsStat = Promise.promisify(fsExtra.stat);

module.exports = directoryExists;

/**
 * @private
 */
function directoryExists(directory) {
    return fsStat(directory)
        .then(function(stats) {
            return stats.isDirectory();
        })
        .catch(function(err) {
            // If the directory doesn't exist the error code is ENOENT.
            // Otherwise something else went wrong - permission issues, etc.
            if (err.code !== 'ENOENT') {
                throw err;
            }
            return false;
        });
}

'use strict';
var fsExtra = require('fs-extra');

module.exports = fileExists;

/**
 * @private
 */
function fileExists(filePath) {
    return fsExtra.stat(filePath)
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

'use strict';
var fsExtra = require('fs-extra');
var path = require('path');

module.exports = getDefaultWriter;

/**
 * Gets a callback function that writes files.
 *
 * @param {String} directory The directory.
 *
 * @returns {Function} A callback function that writes files.
 *
 * @private
 */
function getDefaultWriter(directory) {
    return function(file, contents) {
        var outputFile = path.join(directory, file);
        return fsExtra.outputFile(outputFile, contents);
    };
}

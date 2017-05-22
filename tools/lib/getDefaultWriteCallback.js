'use strict';
var fsExtra = require('fs-extra');
var path = require('path');

module.exports = getDefaultWriteCallback;

/**
 * @private
 */
function getDefaultWriteCallback(outputDirectory) {
    return function(file, data) {
        var outputFile = path.join(outputDirectory, file);
        return fsExtra.outputFile(outputFile, data);
    };
}

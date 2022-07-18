'use strict';
const fsExtra = require('fs-extra');
const path = require('path');

module.exports = getDefaultWriteCallback;

/**
 * @private
 */
function getDefaultWriteCallback(outputDirectory) {
    return function(file, data) {
        const outputFile = path.join(outputDirectory, file);
        return fsExtra.outputFile(outputFile, data);
    };
}

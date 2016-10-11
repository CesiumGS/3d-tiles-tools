'use strict';
var fsExtra = require('fs-extra');
var path = require('path');
var Promise = require('bluebird');

var fsExtraOutputFile = Promise.promisify(fsExtra.outputFile);

module.exports = getDefaultWriteCallback;

/**
 * @private
 */
function getDefaultWriteCallback(outputDirectory) {
    return function(file, data) {
        var outputFile = path.join(outputDirectory, file);
        return fsExtraOutputFile(outputFile, data);
    };
}

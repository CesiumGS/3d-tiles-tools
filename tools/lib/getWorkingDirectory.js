'use strict';
var path = require('path');
var os = require('os');
var uuid = require('uuid');

module.exports = getWorkingDirectory;

/**
 * @private
 */
function getWorkingDirectory() {
    var tempDirectory = os.tmpdir();
    var randomId = uuid.v4();
    return path.join(tempDirectory, randomId);
}

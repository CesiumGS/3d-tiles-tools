'use strict';
const path = require('path');
const os = require('os');
const uuid = require('uuid');

module.exports = getWorkingDirectory;

/**
 * @private
 */
function getWorkingDirectory() {
    const tempDirectory = os.tmpdir();
    const randomId = uuid.v4();
    return path.join(tempDirectory, randomId);
}

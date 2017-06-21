'use strict';
var path = require('path');

module.exports = isTileset;

/**
 * @private
 */
function isTileset(file) {
    var extension = path.extname(file);
    return extension === '.json';
}

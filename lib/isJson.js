'use strict';
const path = require('path');

module.exports = isJson;

/**
 * @private
 */
function isJson(file) {
    return path.extname(file) === '.json';
}

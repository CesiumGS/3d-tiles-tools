'use strict';
var path = require('path');

module.exports = isJson;

/**
 * Determines whether a file is a JSON file based on its extension.
 *
 * @param {String} file The file.
 *
 * @returns {Boolean} Whether the file is a JSON file.
 *
 * @private
 */
function isJson(file) {
    return path.extname(file).toLowerCase() === '.json';
}

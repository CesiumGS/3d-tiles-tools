'use strict';
var Cesium = require('cesium');

var defined = Cesium.defined;

module.exports = getStringBufferPadded;

/**
 * Pad the string with whitespace to fit the next 8-byte boundary.
 * This ensures proper alignment for the section that follows.
 *
 * @param {String} string The string.
 *
 * @returns {Buffer} The padded string buffer.
 *
 * @private
 */
function getStringBufferPadded(string) {
    if (!defined(string)) {
        return Buffer.alloc(0);
    }

    var boundary = 8;
    var byteLength = Buffer.byteLength(string);
    var remainder = byteLength % boundary;
    var padding = (remainder === 0) ? 0 : boundary - remainder;
    var whitespace = '';
    for (var i = 0; i < padding; ++i) {
        whitespace += ' ';
    }
    string += whitespace;

    return Buffer.from(string);
}

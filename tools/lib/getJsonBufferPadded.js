'use strict';
var Cesium = require('cesium');

var defined = Cesium.defined;

module.exports = getJsonBufferPadded;

/**
 * Convert the JSON object to a padded buffer.
 *
 * Pad the JSON with extra whitespace to fit the next 4-byte boundary. This ensures proper alignment
 * for the section that follows (for example, batch table binary or feature table binary).
 * Padding is not required by the 3D Tiles spec but is important when using Typed Arrays in JavaScript.
 *
 * @param {Object} json The JSON object.
 * @returns {Buffer} The padded JSON buffer.
 */
function getJsonBufferPadded(json) {
    if (!defined(json)) {
        return Buffer.alloc(0);
    }

    var batchTableString = JSON.stringify(json);

    var boundary = 4;
    var byteLength = Buffer.byteLength(batchTableString);
    var remainder = byteLength % boundary;
    var padding = (remainder === 0) ? 0 : boundary - remainder;
    var whitespace = '';
    for (var i = 0; i < padding; ++i) {
        whitespace += ' ';
    }
    batchTableString += whitespace;

    return Buffer.from(batchTableString);
}

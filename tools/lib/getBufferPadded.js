'use strict';
var Cesium = require('cesium');

var defined = Cesium.defined;

module.exports = getBufferPadded;

/**
 * Pad the buffer to the next 4-byte boundary to ensure proper alignment for the section that follows.
 * Padding is not required by the 3D Tiles spec but is important when using Typed Arrays in JavaScript.
 *
 * @param {Buffer} buffer The buffer.
 * @returns {Buffer} The padded buffer.
 *
 * @private
 */
function getBufferPadded(buffer) {
    if (!defined(buffer)) {
        return Buffer.alloc(0);
    }

    var boundary = 4;
    var byteLength = buffer.length;
    var remainder = byteLength % boundary;
    var padding = (remainder === 0) ? 0 : boundary - remainder;
    var emptyBuffer = Buffer.alloc(padding);
    return Buffer.concat([buffer, emptyBuffer]);
}

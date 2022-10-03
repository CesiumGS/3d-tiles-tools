'use strict';
const Cesium = require('cesium');

const defaultValue = Cesium.defaultValue;
const defined = Cesium.defined;

module.exports = getBufferPadded;

/**
 * Pad the buffer to the next 8-byte boundary to ensure proper alignment for the section that follows.
 * Padding is not required by the 3D Tiles spec but is important when using Typed Arrays in JavaScript.
 *
 * @param {Buffer} buffer The buffer.
 * @param {Number} [byteOffset=0] The byte offset on which the buffer starts.
 * @returns {Buffer} The padded buffer.
 *
 * @private
 */
function getBufferPadded(buffer, byteOffset) {
    if (!defined(buffer)) {
        return Buffer.alloc(0);
    }

    byteOffset = defaultValue(byteOffset, 0);

    const boundary = 8;
    const byteLength = buffer.length;
    const remainder = (byteOffset + byteLength) % boundary;
    const padding = (remainder === 0) ? 0 : boundary - remainder;
    const emptyBuffer = Buffer.alloc(padding);
    return Buffer.concat([buffer, emptyBuffer]);
}

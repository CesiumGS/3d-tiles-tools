'use strict';
var Cesium = require('cesium');

var defaultValue = Cesium.defaultValue;

module.exports = getGlbPadded;

/**
 * Pad the glb to an 8-byte boundary.
 *
 * @param {Buffer} glb The glb.
 * @param {Number} [byteOffset=0] The byte offset on which the glb starts.
 *
 * @returns {Buffer} The padded glb.
 *
 * @private
 */
function getGlbPadded(glb, byteOffset) {
    byteOffset = defaultValue(byteOffset, 0);
    var boundary = 8;
    var byteLength = glb.length;
    var remainder = (byteOffset + byteLength) % boundary;
    var padding = (remainder === 0) ? 0 : boundary - remainder;

    if (padding > 0) {
        var emptyBuffer = Buffer.alloc(padding);
        glb = Buffer.concat([glb, emptyBuffer]);
        var headerByteLength = 12;
        var jsonChunkLength = glb.readUInt32LE(headerByteLength);
        var binaryChunkLengthOffset = headerByteLength + jsonChunkLength + 8;
        var binaryChunkLength = glb.readUInt32LE(binaryChunkLengthOffset) + padding;
        glb.writeUInt32LE(binaryChunkLength, binaryChunkLengthOffset);
    }

    return glb;
}

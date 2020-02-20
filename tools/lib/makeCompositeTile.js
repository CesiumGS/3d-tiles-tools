'use strict';
var getBufferPadded = require('./getBufferPadded');

module.exports = makeCompositeTile;

/**
 * Combines an array of tile buffers into a single composite tile.
 *
 * @param {Buffer[]} tileBuffers An array of buffers holding tile data.
 * @returns {Buffer} A single buffer holding the composite tile.
 */
function makeCompositeTile(tileBuffers) {
    var headerByteLength = 16;
    var buffers = [];
    var byteLength = headerByteLength;
    var tilesLength = tileBuffers.length;
    for (var i = 0; i < tilesLength; i++) {
        var tile = tileBuffers[i];
        tile = getBufferPadded(tile, byteLength);
        tile.writeUInt32LE(tile.length, 8); // Rewrite byte length
        buffers.push(tile);
        byteLength += tile.length;
    }
    var header = Buffer.alloc(16);
    header.write('cmpt', 0);               // magic
    header.writeUInt32LE(1, 4);            // version
    header.writeUInt32LE(byteLength, 8);   // byteLength
    header.writeUInt32LE(tilesLength, 12); // tilesLength

    buffers.unshift(header);
    return Buffer.concat(buffers);
}

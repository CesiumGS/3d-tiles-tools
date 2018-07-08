'use strict';
var Cesium = require('cesium');
var getBufferPadded = require('./getBufferPadded');

var Check = Cesium.Check;

module.exports = createCmpt;

/**
 * Create a Composite (cmpt) tile from a set of tiles.
 *
 * @param {Buffer[]} tiles An array of buffers holding tile data.
 *
 * @returns {Buffer} The generated cmpt tile buffer.
 */
function createCmpt(tiles) {
    Check.defined('tiles', tiles);

    var byteLength = 0;
    var buffers = [];
    var tilesLength = tiles.length;
    for (var i = 0; i < tilesLength; i++) {
        var tile = getBufferPadded(tiles[i]);
        var tileByteLength = tile.length;
        tile.writeUInt32LE(tileByteLength, 8); // Edit the tile's byte length
        buffers.push(tile);
        byteLength += tileByteLength;
    }

    var version = 1;
    var headerByteLength = 16;
    byteLength += headerByteLength;

    var header = Buffer.alloc(headerByteLength);
    header.write('cmpt', 0);
    header.writeUInt32LE(version, 4);
    header.writeUInt32LE(byteLength, 8);
    header.writeUInt32LE(tilesLength, 12);

    buffers.unshift(header); // Add header first

    return Buffer.concat(buffers);
}

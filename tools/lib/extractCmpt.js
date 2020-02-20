'use strict';
var Cesium = require('cesium');

var getMagic = require('./getMagic');

var defined = Cesium.defined;
var DeveloperError = Cesium.DeveloperError;

module.exports = extractCmpt;

/**
 * Extracts interior tiles from a cmpt buffer. This operates recursively on interior cmpt tiles.
 *
 * @param {Buffer} buffer A buffer containing a cmpt asset.
 * @returns {Buffer[]} An array containing interior tiles.
 */
function extractCmpt(buffer) {
    var results = [];
    extractCmptInner(buffer, results);
    return results;
}

function extractCmptInner(buffer, results) {
    if (!defined(buffer)) {
        throw new DeveloperError('buffer is not defined.');
    }

    var magic = getMagic(buffer);
    if (magic !== 'cmpt') {
        throw new DeveloperError('Invalid magic, expected "cmpt", got: "' + magic + '".');
    }

    var version = buffer.readUInt32LE(4);
    if (version !== 1) {
        throw new DeveloperError('Invalid version, only "1" is valid, got: "' + version + '".');
    }

    var tilesLength = buffer.readUInt32LE(12);
    var byteOffset = 16;

    for (var i = 0; i < tilesLength; ++i) {
        var innerMagic = getMagic(buffer, byteOffset);
        var innerByteLength = buffer.readUInt32LE(byteOffset + 8);
        var innerBuffer = buffer.slice(byteOffset, byteOffset + innerByteLength);
        byteOffset += innerByteLength;

        if (innerMagic === 'cmpt') {
            extractCmptInner(innerBuffer, results);
        } else {
            results.push(innerBuffer);
        }
    }
}

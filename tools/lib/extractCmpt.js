'use strict';
var Cesium = require('cesium');
var getMagic = require('./getMagic');

var Check = Cesium.Check;
var RuntimeError = Cesium.RuntimeError;

module.exports = extractCmpt;

/**
 * Extracts interior tiles from a cmpt buffer. This operates recursively on interior cmpt tiles.
 *
 * @param {Buffer} cmpt A buffer containing a cmpt asset.
 *
 * @returns {Buffer[]} An array containing interior tiles.
 */
function extractCmpt(cmpt) {
    var results = [];
    extractCmptInner(cmpt, results);
    return results;
}

function extractCmptInner(cmpt, results) {
    Check.typeOf.object('cmpt', cmpt);
    var magic = getMagic(cmpt);
    if (magic !== 'cmpt') {
        throw new RuntimeError('Invalid magic, expected "cmpt", got: "' + magic + '".');
    }
    var version = cmpt.readUInt32LE(4);
    if (version !== 1) {
        throw new RuntimeError('Invalid version, only "1" is valid, got: "' + version + '".');
    }

    var tilesLength = cmpt.readUInt32LE(12);
    var byteOffset = 16;

    for (var i = 0; i < tilesLength; ++i) {
        var innerMagic = getMagic(cmpt, byteOffset);
        var innerByteLength = cmpt.readUInt32LE(byteOffset + 8);
        var innerTile = cmpt.slice(byteOffset, byteOffset + innerByteLength);
        byteOffset += innerByteLength;

        if (innerMagic === 'cmpt') {
            extractCmptInner(innerTile, results);
        } else {
            results.push(innerTile);
        }
    }
}

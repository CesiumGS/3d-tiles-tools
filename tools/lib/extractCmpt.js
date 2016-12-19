'use strict';

var Cesium = require('cesium');
var extractB3dm = require('./extractB3dm');
var extractI3dm = require('./extractI3dm');

var defined = Cesium.defined;
var DeveloperError = Cesium.DeveloperError;

module.exports = extractCmpt;

/**
 * Extracts interior tiles from a cmpt buffer. This operates recursively on interior cmpt tiles.
 *
 * @param {Buffer} buffer A buffer containing a cmpt asset.
 * @returns {Object[]} An array containing extracted data from interior tiles.
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

    var magic = buffer.toString('utf8', 0, 4);
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
        var innerMagic = buffer.toString('utf8', byteOffset, byteOffset + 4);
        var innerByteLength = buffer.readUInt32LE(byteOffset + 8);
        var innerBuffer = buffer.slice(byteOffset, byteOffset + innerByteLength);
        byteOffset += innerByteLength;

        if (innerMagic === 'b3dm') {
            results.push(extractB3dm(innerBuffer));
        } else if (innerMagic === 'i3dm') {
            results.push(extractI3dm(innerBuffer));
        } else if (innerMagic === 'cmpt') {
            extractCmptInner(innerBuffer, results);
        }
    }
}

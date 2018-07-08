'use strict';
var Cesium = require('cesium');
var bufferToJson = require('./bufferToJson');
var getMagic = require('./getMagic');

var Check = Cesium.Check;
var RuntimeError = Cesium.RuntimeError;

module.exports = extractPnts;

/**
 * Extracts information and sections from a pnts buffer.
 *
 * @param {Buffer} pnts A buffer containing a pnts asset.
 *
 * @returns {Object} An object containing the header and sections of the pnts asset.
 */
function extractPnts(pnts) {
    Check.typeOf.object('pnts', pnts);
    var magic = getMagic(pnts);
    if (magic !== 'pnts') {
        throw new RuntimeError('Invalid magic, expected "pnts", got: "' + magic + '".');
    }
    var version = pnts.readUInt32LE(4);
    if (version !== 1) {
        throw new RuntimeError('Invalid version, only "1" is valid, got: "' + version + '".');
    }
    var headerByteLength = 28;
    var featureTableJsonByteLength = pnts.readUInt32LE(12);
    var featureTableBinaryByteLength = pnts.readUInt32LE(16);
    var batchTableJsonByteLength = pnts.readUInt32LE(20);

    var featureTableJsonByteOffset = headerByteLength;
    var featureTableBinaryByteOffset = featureTableJsonByteOffset + featureTableJsonByteLength;
    var batchTableJsonByteOffset = featureTableBinaryByteOffset + featureTableBinaryByteLength;
    var batchTableBinaryByteOffset = batchTableJsonByteOffset + batchTableJsonByteLength;

    var featureTableJsonBuffer = pnts.slice(featureTableJsonByteOffset, featureTableBinaryByteOffset);
    var featureTableBinary = pnts.slice(featureTableBinaryByteOffset, batchTableJsonByteOffset);
    var batchTableJsonBuffer = pnts.slice(batchTableJsonByteOffset, batchTableBinaryByteOffset);
    var batchTableBinary = pnts.slice(batchTableBinaryByteOffset);

    var featureTableJson = bufferToJson(featureTableJsonBuffer);
    var batchTableJson = bufferToJson(batchTableJsonBuffer);

    return {
        header: {
            magic: magic,
            version: version
        },
        featureTableJson: featureTableJson,
        featureTableBinary: featureTableBinary,
        batchTableJson: batchTableJson,
        batchTableBinary: batchTableBinary
    };
}

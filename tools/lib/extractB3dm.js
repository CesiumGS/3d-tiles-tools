'use strict';
var Cesium = require('cesium');
var bufferToJson = require('./bufferToJson');
var getMagic = require('./getMagic');

var Check = Cesium.Check;
var RuntimeError = Cesium.RuntimeError;

module.exports = extractB3dm;

/**
 * Extracts information and sections from a b3dm buffer.
 *
 * @param {Buffer} b3dm A buffer containing a b3dm asset.
 *
 * @returns {Object} An object containing the header and sections of the b3dm asset.
 */
function extractB3dm(b3dm) {
    Check.typeOf.object('b3dm', b3dm);
    var magic = getMagic(b3dm);
    if (magic !== 'b3dm') {
        throw new RuntimeError('Invalid magic, expected "b3dm", got: "' + magic + '".');
    }
    var version = b3dm.readUInt32LE(4);
    if (version !== 1) {
        throw new RuntimeError('Invalid version, only "1" is valid, got: "' + version + '".');
    }
    var headerByteLength = 28;
    var featureTableJsonByteLength = b3dm.readUInt32LE(12);
    var featureTableBinaryByteLength = b3dm.readUInt32LE(16);
    var batchTableJsonByteLength = b3dm.readUInt32LE(20);
    var batchTableBinaryByteLength = b3dm.readUInt32LE(24);
    var batchLength = 0;

    // Legacy header #1: [batchLength] [batchTableByteLength]
    // Legacy header #2: [batchTableJsonByteLength] [batchTableBinaryByteLength] [batchLength]
    // Current header: [featureTableJsonByteLength] [featureTableBinaryByteLength] [batchTableJsonByteLength] [batchTableBinaryByteLength]
    // If the header is in the first legacy format 'batchTableJsonByteLength' will be the start of the JSON string (a quotation mark) or the glTF magic.
    // Accordingly its first byte will be either 0x22 or 0x67, and so the minimum uint32 expected is 0x22000000 = 570425344 = 570MB. It is unlikely that the feature table Json will exceed this length.
    // The check for the second legacy format is similar, except it checks 'batchTableBinaryByteLength' instead
    if (batchTableJsonByteLength >= 570425344) {
        // First legacy check
        headerByteLength = 20;
        batchLength = featureTableJsonByteLength;
        batchTableJsonByteLength = featureTableBinaryByteLength;
        batchTableBinaryByteLength = 0;
        featureTableJsonByteLength = 0;
        featureTableBinaryByteLength = 0;
    } else if (batchTableBinaryByteLength >= 570425344) {
        // Second legacy check
        headerByteLength = 24;
        batchLength = batchTableJsonByteLength;
        batchTableJsonByteLength = featureTableJsonByteLength;
        batchTableBinaryByteLength = featureTableBinaryByteLength;
        featureTableJsonByteLength = 0;
        featureTableBinaryByteLength = 0;
    }

    var featureTableJsonByteOffset = headerByteLength;
    var featureTableBinaryByteOffset = featureTableJsonByteOffset + featureTableJsonByteLength;
    var batchTableJsonByteOffset = featureTableBinaryByteOffset + featureTableBinaryByteLength;
    var batchTableBinaryByteOffset = batchTableJsonByteOffset + batchTableJsonByteLength;
    var glbByteOffset = batchTableBinaryByteOffset + batchTableBinaryByteLength;

    var featureTableJsonBuffer = b3dm.slice(featureTableJsonByteOffset, featureTableBinaryByteOffset);
    var featureTableBinary = b3dm.slice(featureTableBinaryByteOffset, batchTableJsonByteOffset);
    var batchTableJsonBuffer = b3dm.slice(batchTableJsonByteOffset, batchTableBinaryByteOffset);
    var batchTableBinary = b3dm.slice(batchTableBinaryByteOffset, glbByteOffset);
    var glb = b3dm.slice(glbByteOffset);
    glb = alignGlb(glb, glbByteOffset);

    var featureTableJson = bufferToJson(featureTableJsonBuffer);
    var batchTableJson = bufferToJson(batchTableJsonBuffer);

    if (Object.keys(featureTableJson).length === 0) {
        featureTableJson = {
            BATCH_LENGTH: batchLength
        };
    }

    return {
        header: {
            magic: magic,
            version: version
        },
        featureTableJson: featureTableJson,
        featureTableBinary: featureTableBinary,
        batchTableJson: batchTableJson,
        batchTableBinary: batchTableBinary,
        glb: glb
    };
}

function alignGlb(buffer, byteOffset) {
    // The glb may not be aligned to an 8-byte boundary within the tile, causing gltf-pipeline operations to fail.
    // If unaligned, copy the glb to a new buffer.
    if (byteOffset % 8 === 0) {
        return buffer;
    }
    return Buffer.from(buffer);
}

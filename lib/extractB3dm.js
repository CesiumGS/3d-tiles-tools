'use strict';
const Cesium = require('cesium');
const bufferToJson = require('./bufferToJson');
const getMagic = require('./getMagic');

const defined = Cesium.defined;
const DeveloperError = Cesium.DeveloperError;

module.exports = extractB3dm;

/**
 * Extracts information and sections from a b3dm buffer.
 *
 * @param {Buffer} b3dmBuffer A buffer containing a b3dm asset.
 * @returns {Object} An object containing the header and sections of the b3dm asset.
 */
function extractB3dm(b3dmBuffer) {
    if (!defined(b3dmBuffer)) {
        throw new DeveloperError('b3dmBuffer is not defined.');
    }
    const magic = getMagic(b3dmBuffer);
    if (magic !== 'b3dm') {
        throw new DeveloperError(`Invalid magic, expected "b3dm", got: "${  magic  }".`);
    }
    const version = b3dmBuffer.readUInt32LE(4);
    if (version !== 1) {
        throw new DeveloperError(`Invalid version, only "1" is valid, got: "${  version  }".`);
    }
    let headerByteLength = 28;
    const byteLength = b3dmBuffer.readUInt32LE(8);
    let featureTableJsonByteLength = b3dmBuffer.readUInt32LE(12);
    let featureTableBinaryByteLength = b3dmBuffer.readUInt32LE(16);
    let batchTableJsonByteLength = b3dmBuffer.readUInt32LE(20);
    let batchTableBinaryByteLength = b3dmBuffer.readUInt32LE(24);
    let batchLength = 0;

    // Keep this legacy check in for now since a lot of tilesets are still using the old header.
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

    const featureTableJsonByteOffset = headerByteLength;
    const featureTableBinaryByteOffset = featureTableJsonByteOffset + featureTableJsonByteLength;
    const batchTableJsonByteOffset = featureTableBinaryByteOffset + featureTableBinaryByteLength;
    const batchTableBinaryByteOffset = batchTableJsonByteOffset + batchTableJsonByteLength;
    const glbByteOffset = batchTableBinaryByteOffset + batchTableBinaryByteLength;

    const featureTableJsonBuffer = b3dmBuffer.slice(featureTableJsonByteOffset, featureTableBinaryByteOffset);
    const featureTableBinary = b3dmBuffer.slice(featureTableBinaryByteOffset, batchTableJsonByteOffset);
    const batchTableJsonBuffer = b3dmBuffer.slice(batchTableJsonByteOffset, batchTableBinaryByteOffset);
    const batchTableBinary = b3dmBuffer.slice(batchTableBinaryByteOffset, glbByteOffset);
    let glbBuffer = b3dmBuffer.slice(glbByteOffset, byteLength);
    glbBuffer = alignGlb(glbBuffer, glbByteOffset);

    let featureTableJson = bufferToJson(featureTableJsonBuffer);
    const batchTableJson = bufferToJson(batchTableJsonBuffer);

    if (Object.keys(featureTableJson).length === 0) {
        featureTableJson = {
            BATCH_LENGTH : batchLength
        };
    }

    return {
        header : {
            magic : magic,
            version : version
        },
        featureTable : {
            json : featureTableJson,
            binary : featureTableBinary
        },
        batchTable : {
            json : batchTableJson,
            binary : batchTableBinary
        },
        glb : glbBuffer
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

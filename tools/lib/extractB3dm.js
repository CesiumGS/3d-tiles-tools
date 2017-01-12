'use strict';

var Cesium = require('cesium');
var defined = Cesium.defined;
var DeveloperError = Cesium.DeveloperError;

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
    var magic = b3dmBuffer.toString('utf8', 0, 4);
    if (magic !== 'b3dm') {
        throw new DeveloperError('Invalid magic, expected "b3dm", got: "' + magic + '".');
    }
    var version = b3dmBuffer.readUInt32LE(4);
    if (version !== 1) {
        throw new DeveloperError('Invalid version, only "1" is valid, got: "' + version + '".');
    }
    var headerByteLength = 24;
    var byteLength = b3dmBuffer.readUInt32LE(8);
    var batchTableJSONByteLength = b3dmBuffer.readUInt32LE(12);
    var batchTableBinaryByteLength = b3dmBuffer.readUInt32LE(16);
    var batchLength = b3dmBuffer.readUInt32LE(20);

    // Keep this legacy check in for now since a lot of tilesets are still using the old header.
    // Legacy header:  [batchLength] [batchTableByteLength]
    // Current header: [batchTableJsonByteLength] [batchTableBinaryByteLength] [batchLength]
    // If the header is in the legacy format 'batchLength' will be the start of the JSON string (a quotation mark) or the glTF magic.
    // Accordingly the first byte of uint32 will be either 0x22 or 0x67 and so the uint32 will exceed any reasonable 'batchLength'.
    if (batchLength > 10000000) {
        headerByteLength = 20;
        batchTableJSONByteLength = batchTableBinaryByteLength;
        batchTableBinaryByteLength = 0;
    }

    var batchTableJSONBuffer = b3dmBuffer.slice(headerByteLength, headerByteLength + batchTableJSONByteLength);
    var batchTableBinaryBuffer = b3dmBuffer.slice(headerByteLength + batchTableJSONByteLength, headerByteLength + batchTableJSONByteLength + batchTableBinaryByteLength);
    var glbBuffer = b3dmBuffer.slice(headerByteLength + batchTableJSONByteLength + batchTableBinaryByteLength, byteLength);

    return {
        header : {
            magic : magic,
            version : version,
            batchLength : batchLength
        },
        batchTable : {
            json : batchTableJSONBuffer,
            binary : batchTableBinaryBuffer
        },
        glb : glbBuffer
    };
}

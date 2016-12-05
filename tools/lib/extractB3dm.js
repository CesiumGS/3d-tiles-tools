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
    var byteLength = b3dmBuffer.readUInt32LE(8);
    var batchTableJSONByteLength = b3dmBuffer.readUInt32LE(12);
    var batchTableBinaryByteLength = b3dmBuffer.readUInt32LE(16);
    var batchLength = b3dmBuffer.readUInt32LE(20);

    var batchTableJSONBuffer = b3dmBuffer.slice(24, 24 + batchTableJSONByteLength);
    var batchTableBinaryBuffer = b3dmBuffer.slice(24 + batchTableJSONByteLength, 24 + batchTableJSONByteLength + batchTableBinaryByteLength);
    var glbBuffer = b3dmBuffer.slice(24 + batchTableJSONByteLength + batchTableBinaryByteLength, byteLength);

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

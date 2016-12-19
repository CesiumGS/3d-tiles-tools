'use strict';

var Cesium = require('cesium');
var defined = Cesium.defined;
var DeveloperError = Cesium.DeveloperError;

module.exports = extractI3dm;

/**
 * Extracts information and sections from an i3dm buffer.
 *
 * @param {Buffer} buffer A buffer containing an i3dm asset.
 * @returns {Object} An object containing the header and sections of the i3dm asset.
 */
function extractI3dm(buffer) {
    if (!defined(buffer)) {
        throw new DeveloperError('buffer is not defined.');
    }

    var magic = buffer.toString('utf8', 0, 4);
    if (magic !== 'i3dm') {
        throw new DeveloperError('Invalid magic, expected "i3dm", got: "' + magic + '".');
    }

    var version = buffer.readUInt32LE(4);
    if (version !== 1) {
        throw new DeveloperError('Invalid version, only "1" is valid, got: "' + version + '".');
    }

    var byteLength = buffer.readUInt32LE(8);
    var featureTableJsonByteLength = buffer.readUInt32LE(12);
    var featureTableBinaryByteLength = buffer.readUInt32LE(16);
    var batchTableJsonByteLength = buffer.readUInt32LE(20);
    var batchTableBinaryByteLength = buffer.readUInt32LE(24);
    var gltfFormat = buffer.readUInt32LE(28);

    if (gltfFormat !== 1) {
        throw new DeveloperError('Only embedded binary glTF is supported.');
    }

    var byteOffset = 32;
    var featureTableJsonByteOffset = 32;
    var featureTableBinaryByteOffset = featureTableJsonByteOffset + featureTableJsonByteLength;
    var featureTableByteLength = featureTableJsonByteLength + featureTableBinaryByteLength;
    var batchTableJsonByteOffset = byteOffset + featureTableByteLength;
    var batchTableBinaryByteOffset = batchTableJsonByteOffset + batchTableJsonByteLength;
    var batchTableByteLength = batchTableJsonByteLength + batchTableBinaryByteLength;
    byteOffset += featureTableByteLength + batchTableByteLength;

    var gltfByteLength = byteLength - byteOffset;
    if (gltfByteLength === 0) {
        throw new DeveloperError('glTF byte length is zero, i3dm must have a glTF to instance.');
    }

    var featureTableJsonBuffer = buffer.slice(featureTableJsonByteOffset, featureTableBinaryByteOffset);
    var featureTableBinaryBuffer = buffer.slice(featureTableBinaryByteOffset, batchTableJsonByteOffset);
    var batchTableJsonBuffer = buffer.slice(batchTableJsonByteOffset, batchTableBinaryByteOffset);
    var batchTableBinaryBuffer = buffer.slice(batchTableBinaryByteOffset, byteOffset);
    var glbBuffer = buffer.slice(byteOffset, byteLength);

    return {
        header : {
            magic : magic,
            version : version
        },
        featureTable : {
            json : featureTableJsonBuffer,
            binary : featureTableBinaryBuffer
        },
        batchTable : {
            json : batchTableJsonBuffer,
            binary : batchTableBinaryBuffer
        },
        glb : glbBuffer
    };
}

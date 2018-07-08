'use strict';
var Cesium = require('cesium');
var bufferToJson = require('./bufferToJson');
var getMagic = require('./getMagic');

var Check = Cesium.Check;
var RuntimeError = Cesium.RuntimeError;

module.exports = extractI3dm;

/**
 * Extracts information and sections from an i3dm buffer.
 *
 * @param {Buffer} i3dm A buffer containing an i3dm asset.
 *
 * @returns {Object} An object containing the header and sections of the i3dm asset.
 */
function extractI3dm(i3dm) {
    Check.typeOf.object('i3dm', i3dm);
    var magic = getMagic(i3dm);
    if (magic !== 'i3dm') {
        throw new RuntimeError('Invalid magic, expected "i3dm", got: "' + magic + '".');
    }
    var version = i3dm.readUInt32LE(4);
    if (version !== 1) {
        throw new RuntimeError('Invalid version, only "1" is valid, got: "' + version + '".');
    }
    var headerByteLength = 32;
    var byteLength = i3dm.readUInt32LE(8);
    var featureTableJsonByteLength = i3dm.readUInt32LE(12);
    var featureTableBinaryByteLength = i3dm.readUInt32LE(16);
    var batchTableJsonByteLength = i3dm.readUInt32LE(20);
    var batchTableBinaryByteLength = i3dm.readUInt32LE(24);
    var gltfFormat = i3dm.readUInt32LE(28);

    var featureTableJsonByteOffset = headerByteLength;
    var featureTableBinaryByteOffset = featureTableJsonByteOffset + featureTableJsonByteLength;
    var batchTableJsonByteOffset = featureTableBinaryByteOffset + featureTableBinaryByteLength;
    var batchTableBinaryByteOffset = batchTableJsonByteOffset + batchTableJsonByteLength;
    var gltfByteOffset = batchTableBinaryByteOffset + batchTableBinaryByteLength;

    var gltfByteLength = byteLength - gltfByteOffset;
    if (gltfByteLength === 0) {
        throw new RuntimeError('glTF byte length is zero, i3dm must have a glTF to instance.');
    }

    var featureTableJsonBuffer = i3dm.slice(featureTableJsonByteOffset, featureTableBinaryByteOffset);
    var featureTableBinaryBuffer = i3dm.slice(featureTableBinaryByteOffset, batchTableJsonByteOffset);
    var batchTableJsonBuffer = i3dm.slice(batchTableJsonByteOffset, batchTableBinaryByteOffset);
    var batchTableBinaryBuffer = i3dm.slice(batchTableBinaryByteOffset, gltfByteOffset);
    var glbBuffer = i3dm.slice(gltfByteOffset);
    glbBuffer = alignGlb(glbBuffer, gltfByteOffset);

    var featureTableJson = bufferToJson(featureTableJsonBuffer);
    var batchTableJson = bufferToJson(batchTableJsonBuffer);

    var glb;
    var gltfUri;

    if (gltfFormat === 0) {
        gltfUri = glbBuffer.toString();
        gltfUri = gltfUri.replace(/[\s\0]+$/, ''); // Remove padding
    } else {
        glb = glbBuffer;
    }

    return {
        header: {
            magic: magic,
            version: version,
            gltfFormat: gltfFormat
        },
        featureTableJson: featureTableJson,
        featureTableBinary: featureTableBinaryBuffer,
        batchTableJson: batchTableJson,
        batchTableBinary: batchTableBinaryBuffer,
        glb: glb,
        gltfUri: gltfUri
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

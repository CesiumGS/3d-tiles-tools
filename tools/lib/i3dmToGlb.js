'use strict';

var Cesium = require('cesium');
var defined = Cesium.defined;
var DeveloperError = Cesium.DeveloperError;

module.exports = i3dmToGlb;

function i3dmToGlb(buffer) {
    if (!defined(buffer)) {
        throw new DeveloperError('buffer is not defined.');
    }

    var magicArray = new Uint8Array(4);
    magicArray[0] = buffer.readUInt8(0);
    magicArray[1] = buffer.readUInt8(1);
    magicArray[2] = buffer.readUInt8(2);
    magicArray[3] = buffer.readUInt8(3);

    var magic = buffer.toString('utf8', 0, 4);;
    if (magic !== 'i3dm') {
        throw new DeveloperError('i3dm is required.');
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
    var featureTableByteLength = featureTableJsonByteLength + featureTableBinaryByteLength;
    var batchTableByteLength = batchTableJsonByteLength + batchTableBinaryByteLength;
    byteOffset += featureTableByteLength + batchTableByteLength;

    var gltfByteLength = byteLength - byteOffset;
    if (gltfByteLength === 0) {
        throw new DeveloperError('glTF byte length is zero, i3dm must have a glTF to instance.');
    }

    return buffer.slice(byteOffset, gltfByteLength);
}

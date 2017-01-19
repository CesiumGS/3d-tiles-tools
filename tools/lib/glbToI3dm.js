'use strict';

var Cesium = require('cesium');
var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;
var DeveloperError = Cesium.DeveloperError;

module.exports = glbToI3dm;

/**
 * Generates a new Buffer representing a i3dm asset.
 *
 * @param {Buffer} glbBuffer A buffer containing a binary glTF asset.
 * @param {Buffer} [featureTableJSONBuffer] A buffer containing the batch table to use for the b3dm asset.
 * @param {Buffer} [featureTableBinaryBuffer] A buffer containing the accompanying binary batch table section for the b3dm asset.
 * @param {Buffer} [batchTableJSONBuffer] A buffer containing the batch table to use for the b3dm asset.
 * @param {Buffer} [batchTableBinaryBuffer] A buffer containing the accompanying binary batch table section for the b3dm asset.
 * @param {Number} [gltfFormat] The gltf format for the body of the glTF field.
 * @returns {Buffer} Buffer representing the b3dm asset.
 */
function glbToI3dm(glbBuffer, featureTableJSONBuffer, featureTableBinaryBuffer, batchTableJSONBuffer, batchTableBinaryBuffer, gltfFormat) {
    if (!defined(glbBuffer)) {
        throw new DeveloperError('glbBuffer is not defined.');
    }

    batchTableJSONBuffer = defaultValue(batchTableJSONBuffer, new Buffer(0));
    batchTableBinaryBuffer = defaultValue(batchTableBinaryBuffer, new Buffer(0));
    featureTableJSONBuffer = defaultValue(featureTableJSONBuffer, new Buffer(0));
    featureTableBinaryBuffer = defaultValue(featureTableBinaryBuffer, new Buffer(0));
    gltfFormat = defaultValue(gltfFormat, 1);

    var byteLength = 32 + glbBuffer.length + featureTableJSONBuffer.length + featureTableBinaryBuffer.length + batchTableJSONBuffer.length + batchTableBinaryBuffer.length;

    var header = new Buffer(32);
    header.write('i3dm', 0); // magic
    header.writeUInt32LE(1, 4); // version
    header.writeUInt32LE(byteLength, 8); // byteLength - length of entire tile, including header, in bytes
    header.writeUInt32LE(featureTableJSONBuffer.length, 12); // featureTableJSONByteLength - length of feature table JSON section in bytes. (0 for basic, no batches)
    header.writeUInt32LE(featureTableBinaryBuffer.length, 16); // featureTableBinaryByteLength - length of feature table binary section in bytes. (0 for basic, no batches)
    header.writeUInt32LE(batchTableJSONBuffer.length, 20); // batchTableJSONByteLength - length of feature table JSON section in bytes. (0 for basic, no batches)
    header.writeUInt32LE(batchTableBinaryBuffer.length, 24); // batchTableBinaryByteLength - length of feature table binary section in bytes. (0 for basic, no batches)
    header.writeUInt32LE(gltfFormat, 28); //  gltfFormat - format of the glTF body field (0 for URL, 1 for embedded binary)

    return Buffer.concat([header, featureTableJSONBuffer, featureTableBinaryBuffer, batchTableJSONBuffer, batchTableBinaryBuffer, glbBuffer]);
}

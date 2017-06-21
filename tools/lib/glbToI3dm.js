'use strict';
var Cesium = require('cesium');
var getBufferPadded = require('./getBufferPadded');
var getJsonBufferPadded = require('./getJsonBufferPadded');

var defined = Cesium.defined;
var DeveloperError = Cesium.DeveloperError;

module.exports = glbToI3dm;

/**
 * Generates a new Buffer representing a i3dm asset.
 *
 * @param {Buffer} glbBuffer A buffer containing a binary glTF asset.
 * @param {Object} [featureTableJson] The feature table JSON.
 * @param {Buffer} [featureTableBinary] The feature table binary.
 * @param {Object} [batchTableJson] The batch table JSON.
 * @param {Buffer} [batchTableBinary] The batch table binary.
 * @returns {Buffer} Buffer representing the i3dm asset.
 */
function glbToI3dm(glbBuffer, featureTableJson, featureTableBinary, batchTableJson, batchTableBinary) {
    if (!defined(glbBuffer)) {
        throw new DeveloperError('glbBuffer is not defined.');
    }

    var featureTableJsonBuffer = getJsonBufferPadded(featureTableJson);
    var featureTableBinaryBuffer = getBufferPadded(featureTableBinary);
    var batchTableJsonBuffer = getJsonBufferPadded(batchTableJson);
    var batchTableBinaryBuffer = getBufferPadded(batchTableBinary);

    var headerByteLength = 32;
    var byteLength = headerByteLength + featureTableJsonBuffer.length + featureTableBinaryBuffer.length + batchTableJsonBuffer.length + batchTableBinaryBuffer.length + glbBuffer.length;
    var gltfFormat = 1;

    var header = Buffer.alloc(32);
    header.write('i3dm', 0);                                    // magic
    header.writeUInt32LE(1, 4);                                 // version
    header.writeUInt32LE(byteLength, 8);                        // byteLength - length of entire tile, including header, in bytes
    header.writeUInt32LE(featureTableJsonBuffer.length, 12);    // featureTableJsonByteLength - length of feature table JSON section in bytes.
    header.writeUInt32LE(featureTableBinaryBuffer.length, 16);  // featureTableBinaryByteLength - length of feature table binary section in bytes.
    header.writeUInt32LE(batchTableJsonBuffer.length, 20);      // batchTableJsonByteLength - length of batch table JSON section in bytes.
    header.writeUInt32LE(batchTableBinaryBuffer.length, 24);    // batchTableBinaryByteLength - length of batch table binary section in bytes.
    header.writeUInt32LE(gltfFormat, 28);                       //  gltfFormat - format of the glTF body field (0 for URL, 1 for embedded binary)

    return Buffer.concat([header, featureTableJsonBuffer, featureTableBinaryBuffer, batchTableJsonBuffer, batchTableBinaryBuffer, glbBuffer]);
}

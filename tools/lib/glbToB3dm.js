'use strict';
var Cesium = require('cesium');
var getBufferPadded = require('./getBufferPadded');
var getJsonBufferPadded = require('./getJsonBufferPadded');

var defined = Cesium.defined;
var DeveloperError = Cesium.DeveloperError;

module.exports = glbToB3dm;

/**
 * Generates a new Buffer representing a b3dm asset.
 *
 * @param {Buffer} glbBuffer A buffer containing a binary glTF asset.
 * @param {Object} [featureTableJson] The feature table JSON.
 * @param {Buffer} [featureTableBinary] The feature table binary.
 * @param {Object} [batchTableJson] The batch table JSON.
 * @param {Buffer} [batchTableBinary] The batch table binary.
 * @returns {Buffer} Buffer representing the b3dm asset.
 */
function glbToB3dm(glbBuffer, featureTableJson, featureTableBinary, batchTableJson, batchTableBinary) {
    if (!defined(glbBuffer)) {
        throw new DeveloperError('glbBuffer is not defined.');
    }

    var headerByteLength = 28;
    var featureTableJsonBuffer = getJsonBufferPadded(featureTableJson, headerByteLength);
    var featureTableBinaryBuffer = getBufferPadded(featureTableBinary);
    var batchTableJsonBuffer = getJsonBufferPadded(batchTableJson);
    var batchTableBinaryBuffer = getBufferPadded(batchTableBinary);

    var byteLength = headerByteLength + featureTableJsonBuffer.length + featureTableBinaryBuffer.length + batchTableJsonBuffer.length + batchTableBinaryBuffer.length + glbBuffer.length;
    var header = Buffer.alloc(headerByteLength);
    header.write('b3dm', 0);                                    // magic
    header.writeUInt32LE(1, 4);                                 // version
    header.writeUInt32LE(byteLength, 8);                        // byteLength - length of entire tile, including header, in bytes
    header.writeUInt32LE(featureTableJsonBuffer.length, 12);    // featureTableJSONByteLength - length of feature table JSON section in bytes.
    header.writeUInt32LE(featureTableBinaryBuffer.length, 16);  // featureTableBinaryByteLength - length of feature table binary section in bytes.
    header.writeUInt32LE(batchTableJsonBuffer.length, 20);      // batchTableJSONByteLength - length of batch table JSON section in bytes. (0 for basic, no batches)
    header.writeUInt32LE(batchTableBinaryBuffer.length, 24);    // batchTableBinaryByteLength - length of batch table binary section in bytes. (0 for basic, no batches)

    return Buffer.concat([header, featureTableJsonBuffer, featureTableBinaryBuffer, batchTableJsonBuffer, batchTableBinaryBuffer, glbBuffer]);
}

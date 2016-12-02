'use strict';

var Cesium = require('cesium');
var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;
var DeveloperError = Cesium.DeveloperError;

module.exports = glbToB3dm;

/**
 * Generates a new Buffer representing a b3dm asset.
 *
 * @param {Buffer} glbBuffer A buffer containing a binary glTF asset.
 * @param {Buffer} [batchTableJSONBuffer] A buffer containing the batch table to use for the b3dm asset.
 * @param {Buffer} [batchTableBinaryBuffer] A buffer containing the accompanying binary batch table section for the b3dm asset.
 * @param {Number} [batchLength] The number of features in the batch declared in the header.
 * @returns {Buffer} Buffer representing the b3dm asset.
 */
function glbToB3dm(glbBuffer, batchTableJSONBuffer, batchTableBinaryBuffer, batchLength) {
    if (!defined(glbBuffer)) {
        throw new DeveloperError('glbBuffer is not defined.');
    }
    batchTableJSONBuffer = defaultValue(batchTableJSONBuffer, new Buffer(0));
    batchTableBinaryBuffer = defaultValue(batchTableBinaryBuffer, new Buffer(0));
    batchLength = defaultValue(batchLength, 0);
    var byteLength = 24 + glbBuffer.length + batchTableJSONBuffer.length + batchTableBinaryBuffer.length;
    var header = new Buffer(24);
    header.write('b3dm', 0); // magic
    header.writeUInt32LE(1, 4); // version
    header.writeUInt32LE(byteLength, 8); // byteLength - length of entire tile, including header, in bytes
    header.writeUInt32LE(batchTableJSONBuffer.length, 12); // batchTableJSONByteLength - length of batch table JSON section in bytes. (0 for basic, no batches)
    header.writeUInt32LE(batchTableBinaryBuffer.length, 16); // batchTableBinaryByteLength - length of batch table binary section in bytes. (0 for basic, no batches)
    header.writeUInt32LE(batchLength, 20); // batchLength - number of models, also called features, in the batch
    return Buffer.concat([header, batchTableJSONBuffer, batchTableBinaryBuffer, glbBuffer]);
}

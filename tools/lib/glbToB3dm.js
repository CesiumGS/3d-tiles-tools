'use strict';

var Cesium = require('cesium');
var defined = Cesium.defined;
var DeveloperError = Cesium.DeveloperError;

module.exports = glbToB3dm;

/**
 * Generates a new Buffer representing a b3dm file with a plain header.
 *
 * @param {Buffer} glbBuffer a buffer representing a binary gltf
 * @returns {Buffer} buffer representing the b3dm
 */
function glbToB3dm(glbBuffer) {
    if (!defined(glbBuffer)) {
        throw new DeveloperError('glbBuffer is not defined.');
    }
    var header = new Buffer(24);
    header.write('b3dm', 0); // magic
    header.writeUInt32LE(1, 4); // version
    header.writeUInt32LE(glbBuffer.length + 24, 8); // byteLength - length of entire tile, including header, in bytes
    header.writeUInt32LE(0, 12); // batchTableJSONByteLength - length of batch table JSON section in bytes. (0 for basic, no batches)
    header.writeUInt32LE(0, 16); // batchTableBinaryByteLength - length of batch table binary section in bytes. (0 for basic, no batches)
    header.writeUInt32LE(0, 20); // batchLength - number of models, also called features, in the batch
    return Buffer.concat([header, glbBuffer]);
}

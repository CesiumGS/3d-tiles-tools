'use strict';

module.exports = glbToPlainB3dm;

/**
 * Generates a new Buffer representing a b3dm file with a plain header.
 *
 * @param {Buffer} glbBuffer a buffer representing a binary gltf
 * @returns {Buffer}
 */
function glbToPlainB3dm(glbBuffer) {
    var header = new Buffer(20);
    header.write('b3dm', 0); // magic
    header.writeUInt32LE(1, 4); // version
    header.writeUInt32LE(glbBuffer.length + 20, 8); // length of entire tile, including header
    header.writeUInt32LE(0, 12); // number of models in the batch (0 for basic, no batches)
    header.writeUInt32LE(0, 16); // length of batch table in bytes
    return Buffer.concat([header, glbBuffer]);
}

'use strict';
var Cesium = require('cesium');
var getBufferPadded = require('./getBufferPadded');
var getGlbPadded = require('./getGlbPadded');
var getJsonBufferPadded = require('./getJsonBufferPadded');

var Check = Cesium.Check;

module.exports = createB3dm;

/**
 * Create a Batched 3D Model (b3dm) tile from a binary glTF and per-feature metadata.
 *
 * @param {Object} options An object with the following properties:
 * @param {Buffer} options.glb A buffer containing a binary glTF asset.
 * @param {Object} options.featureTableJson The feature table JSON.
 * @param {Buffer} [options.featureTableBinary] The feature table binary.
 * @param {Object} [options.batchTableJson] The batch table JSON.
 * @param {Buffer} [options.batchTableBinary] The batch table binary.
 *
 * @returns {Buffer} Buffer representing the b3dm asset.
 */
function createB3dm(options) {
    Check.typeOf.object('options', options);
    Check.typeOf.object('options.glb', options.glb);
    Check.typeOf.object('options.featureTableJson', options.featureTableJson);

    var glb = options.glb;
    var featureTableJson = options.featureTableJson;
    var featureTableBinary = options.featureTableBinary;
    var batchTableJson = options.batchTableJson;
    var batchTableBinary = options.batchTableBinary;

    var headerByteLength = 28;
    var featureTableJsonBuffer = getJsonBufferPadded(featureTableJson, headerByteLength);
    var featureTableBinaryBuffer = getBufferPadded(featureTableBinary);
    var batchTableJsonBuffer = getJsonBufferPadded(batchTableJson);
    var batchTableBinaryBuffer = getBufferPadded(batchTableBinary);
    var glbBuffer = glb;

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

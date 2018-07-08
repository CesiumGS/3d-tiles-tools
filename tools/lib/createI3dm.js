'use strict';
var Cesium = require('cesium');
var getBufferPadded = require('./getBufferPadded');
var getGlbPadded = require('./getGlbPadded');
var getJsonBufferPadded = require('./getJsonBufferPadded');
var getStringBufferPadded = require('./getStringBufferPadded');

var Check = Cesium.Check;
var defined = Cesium.defined;
var DeveloperError = Cesium.DeveloperError;

module.exports = createI3dm;

/**
 * Create an Instanced 3D Model (i3dm) tile from a feature table, batch table, and gltf buffer or uri.
 *
 * @param {Object} options An object with the following properties:
 * @param {Object} options.featureTableJson The feature table JSON.
 * @param {Buffer} [options.featureTableBinary] The feature table binary.
 * @param {Object} [options.batchTableJson] The batch table JSON.
 * @param {Buffer} [options.batchTableBinary] The batch table binary.
 * @param {Buffer} [options.glb] A buffer containing a binary glTF asset.
 * @param {String} [options.gltfUri] A uri to the glTF asset.
 *
 * @returns {Buffer} Buffer representing the i3dm asset.
 *
 * @private
 */
function createI3dm(options) {
    Check.typeOf.object('options', options);
    Check.typeOf.object('options.featureTableJson', options.featureTableJson);

    var glb = options.glb;
    var gltfUri = options.gltfUri;
    var featureTableJson = options.featureTableJson;
    var featureTableBinary = options.featureTableBinary;
    var batchTableJson = options.batchTableJson;
    var batchTableBinary = options.batchTableBinary;

    if (!defined(glb) && !defined(gltfUri)) {
        throw new DeveloperError('Either options.glb or options.gltfUri must be defined');
    }

    var gltfBuffer;
    if (defined(gltfUri)) {
        gltfBuffer = getStringBufferPadded(gltfUri);
    } else {
        gltfBuffer = getGlbPadded(glb);
    }

    var featureTableJsonBuffer = getJsonBufferPadded(featureTableJson);
    var featureTableBinaryBuffer = getBufferPadded(featureTableBinary);
    var batchTableJsonBuffer = getJsonBufferPadded(batchTableJson);
    var batchTableBinaryBuffer = getBufferPadded(batchTableBinary);

    var headerByteLength = 32;
    var byteLength = headerByteLength + featureTableJsonBuffer.length + featureTableBinaryBuffer.length + batchTableJsonBuffer.length + batchTableBinaryBuffer.length + gltfBuffer.length;
    var gltfFormat = defined(glb) ? 1 : 0;

    var header = Buffer.alloc(32);
    header.write('i3dm', 0);                                    // magic
    header.writeUInt32LE(1, 4);                                 // version
    header.writeUInt32LE(byteLength, 8);                        // byteLength - length of entire tile, including header, in bytes
    header.writeUInt32LE(featureTableJsonBuffer.length, 12);    // featureTableJsonByteLength - length of feature table JSON section in bytes.
    header.writeUInt32LE(featureTableBinaryBuffer.length, 16);  // featureTableBinaryByteLength - length of feature table binary section in bytes.
    header.writeUInt32LE(batchTableJsonBuffer.length, 20);      // batchTableJsonByteLength - length of batch table JSON section in bytes.
    header.writeUInt32LE(batchTableBinaryBuffer.length, 24);    // batchTableBinaryByteLength - length of batch table binary section in bytes.
    header.writeUInt32LE(gltfFormat, 28);                       // gltfFormat - format of the glTF body field (0 for uri, 1 for embedded binary)

    return Buffer.concat([header, featureTableJsonBuffer, featureTableBinaryBuffer, batchTableJsonBuffer, batchTableBinaryBuffer, gltfBuffer]);
}

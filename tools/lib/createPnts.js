'use strict';
var Cesium = require('cesium');
var getJsonBufferPadded = require('./getJsonBufferPadded');
var getBufferPadded = require('./getBufferPadded');

var Check = Cesium.Check;

module.exports = createPnts;

/**
 * Create a Point Cloud (pnts) tile from a feature table and batch table.
 *
 * @param {Object} options An object with the following properties:
 * @param {Object} options.featureTableJson The feature table JSON.
 * @param {Buffer} options.featureTableBinary The feature table binary.
 * @param {Object} [options.batchTableJson] Batch table describing the per-point metadata.
 * @param {Buffer} [options.batchTableBinary] The batch table binary.
 *
 * @returns {Buffer} The generated pnts tile buffer.
 *
 * @private
 */
function createPnts(options) {
    Check.typeOf.object('options', options);
    Check.typeOf.object('options.featureTableJson', options.featureTableJson);
    Check.typeOf.object('options.featureTableBinary', options.featureTableBinary);

    var featureTableJson = getJsonBufferPadded(options.featureTableJson);
    var featureTableBinary = getBufferPadded(options.featureTableBinary);
    var batchTableJson = getJsonBufferPadded(options.batchTableJson);
    var batchTableBinary = getBufferPadded(options.batchTableBinary);

    var version = 1;
    var headerByteLength = 28;
    var featureTableJsonByteLength = featureTableJson.length;
    var featureTableBinaryByteLength = featureTableBinary.length;
    var batchTableJsonByteLength = batchTableJson.length;
    var batchTableBinaryByteLength = batchTableBinary.length;
    var byteLength = headerByteLength + featureTableJsonByteLength + featureTableBinaryByteLength + batchTableJsonByteLength + batchTableBinaryByteLength;

    var header = Buffer.alloc(headerByteLength);
    header.write('pnts', 0);
    header.writeUInt32LE(version, 4);
    header.writeUInt32LE(byteLength, 8);
    header.writeUInt32LE(featureTableJsonByteLength, 12);
    header.writeUInt32LE(featureTableBinaryByteLength, 16);
    header.writeUInt32LE(batchTableJsonByteLength, 20);
    header.writeUInt32LE(batchTableBinaryByteLength, 24);

    return Buffer.concat([header, featureTableJson, featureTableBinary, batchTableJson, batchTableBinary]);
}

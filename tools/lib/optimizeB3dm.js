'use strict';
var Cesium = require('cesium');
var GltfPipeline = require('gltf-pipeline');
var Promise = require('bluebird');
var zlib = require('zlib');
var isGzipped = require('./isGzipped');

var zlibGunzip = Promise.promisify(zlib.gunzip);

var Cartesian3 = Cesium.Cartesian3;
var DeveloperError = Cesium.DeveloperError;
var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;

var Pipeline = GltfPipeline.Pipeline;
var addCesiumRTC = GltfPipeline.addCesiumRTC;
var getBinaryGltf = GltfPipeline.getBinaryGltf;
var parseBinaryGltf = GltfPipeline.parseBinaryGltf;

module.exports = optimizeB3dm;

function optimizeB3dm(buffer, options) {
    var resolveDataPromise = Promise.resolve(buffer);
    if (isGzipped(buffer)) {
        resolveDataPromise = zlibGunzip(buffer);
    }
    var rtcPosition;
    var byteLength;
    var batchTableJSONByteLength;
    var batchTableBinaryByteLength;
    var glbBuffer;
    return resolveDataPromise
        .then(function(plainBuffer) {
            buffer = plainBuffer;
            var magic = buffer.toString('utf8', 0, 4);
            if (magic !== 'b3dm') {
                throw new DeveloperError('Invalid magic, expected "b3dm", got: "' + magic + '".');
            }
            var version = buffer.readUInt32LE(4);
            if (version !== 1) {
                throw new DeveloperError('Invalid version. Only "1" is valid, got: "' + version + '".');
            }
            byteLength = buffer.readUInt32LE(8);
            batchTableJSONByteLength = buffer.readUInt32LE(12);
            batchTableBinaryByteLength = buffer.readUInt32LE(16);

            glbBuffer = buffer.slice(24 + batchTableJSONByteLength + batchTableBinaryByteLength, byteLength);
            var gltf = parseBinaryGltf(glbBuffer);
            var extensions = gltf.extensions;
            if (defined(extensions)) {
                // If it is used, extract the CesiumRTC extension and add it back after processing
                var cesiumRTC = extensions.CESIUM_RTC;
                if (defined(cesiumRTC)) {
                    rtcPosition = Cartesian3.unpack(cesiumRTC.center);
                }
            }
            return Pipeline.processJSONWithExtras(gltf, options);
        })
        .then(function(gltf) {
            if (defined(rtcPosition)) {
                addCesiumRTC(gltf, {
                    position: rtcPosition
                });
            }
            var embed = defaultValue(options.embed, true);
            var embedImage = defaultValue(options.embedImage, true);
            var binaryGltf = getBinaryGltf(gltf, embed, embedImage).glb;
            var newLength = byteLength - (glbBuffer.length - binaryGltf.length);
            buffer.writeUInt32LE(newLength, 8);
            var headerAndBatchTable = buffer.slice(0, 24 + batchTableJSONByteLength + batchTableBinaryByteLength);
            return Buffer.concat([headerAndBatchTable, binaryGltf]);
        });
}
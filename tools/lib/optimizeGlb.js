'use strict';
var Cesium = require('cesium');
var GltfPipeline = require('gltf-pipeline');

var Cartesian3 = Cesium.Cartesian3;
var DeveloperError = Cesium.DeveloperError;
var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;

var addCesiumRTC = GltfPipeline.addCesiumRTC;
var getBinaryGltf = GltfPipeline.getBinaryGltf;
var loadGltfUris = GltfPipeline.loadGltfUris;
var parseBinaryGltf = GltfPipeline.parseBinaryGltf;
var Pipeline = GltfPipeline.Pipeline;

module.exports = optimizeGlb;

/**
 * Given an input buffer containing a binary glTF asset, optimize it using gltf-pipeline with the provided options
 *
 * @param {Buffer} glbBuffer The buffer containing the binary glTF.
 * @param {Object} [options] Options specifying custom gltf-pipeline behavior.
 * @returns {Promise} A promise that resolves to the optimized binary glTF.
 * @private
 */
function optimizeGlb(glbBuffer, options) {
    options = defaultValue(options, defaultValue.EMPTY_OBJECT);
    if (!defined(glbBuffer)) {
        throw new DeveloperError('glbBuffer is not defined.');
    }
    var rtcPosition;
    var gltf = parseBinaryGltf(glbBuffer);
    var extensions = gltf.extensions;
    if (defined(extensions)) {
        // If it is used, extract the CesiumRTC extension and add it back after processing
        var cesiumRTC = extensions.CESIUM_RTC;
        if (defined(cesiumRTC)) {
            rtcPosition = Cartesian3.unpack(cesiumRTC.center);
        }
    }
    fixBatchIdSemantic(gltf);
    return loadGltfUris(gltf, options)
        .then(function() {
            return Pipeline.processJSONWithExtras(gltf, options)
                .then(function(gltf) {
                    if (defined(rtcPosition)) {
                        addCesiumRTC(gltf, {
                            position: rtcPosition
                        });
                    }
                    var embed = defaultValue(options.embed, true);
                    var embedImage = defaultValue(options.embedImage, true);
                    return getBinaryGltf(gltf, embed, embedImage).glb;
                });
        });
}

function fixBatchIdSemantic(gltf) {
    var meshes = gltf.meshes;
    for (var meshId in meshes) {
        if (meshes.hasOwnProperty(meshId)) {
            var primitives = meshes[meshId].primitives;
            var primitivesLength = primitives.length;
            for (var i = 0; i < primitivesLength; ++i) {
                var attributes = primitives[i].attributes;
                if (defined(attributes.BATCHID)) {
                    attributes._BATCHID = attributes.BATCHID;
                    delete attributes.BATCHID;
                }
            }
        }
    }

    var techniques = gltf.techniques;
    for (var techniqueId in techniques) {
        if (techniques.hasOwnProperty(techniqueId)) {
            var parameters = techniques[techniqueId].parameters;
            for (var parameterId in parameters) {
                if (parameters.hasOwnProperty(parameterId)) {
                    var parameter = parameters[parameterId];
                    if (parameter.semantic === 'BATCHID') {
                        parameter.semantic = '_BATCHID';
                    }
                }
            }
        }
    }
}

'use strict';
const Cesium = require('cesium');
const GltfPipeline = require('gltf-pipeline');

const Cartesian3 = Cesium.Cartesian3;
const DeveloperError = Cesium.DeveloperError;
const defaultValue = Cesium.defaultValue;
const defined = Cesium.defined;

const addCesiumRTC = GltfPipeline.addCesiumRTC;
const getBinaryGltf = GltfPipeline.getBinaryGltf;
const loadGltfUris = GltfPipeline.loadGltfUris;
const parseBinaryGltf = GltfPipeline.parseBinaryGltf;
const Pipeline = GltfPipeline.Pipeline;

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
    let rtcPosition;
    const gltf = parseBinaryGltf(glbBuffer);
    const extensions = gltf.extensions;
    if (defined(extensions)) {
        // If it is used, extract the CesiumRTC extension and add it back after processing
        const cesiumRTC = extensions.CESIUM_RTC;
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
                    const embed = defaultValue(options.embed, true);
                    const embedImage = defaultValue(options.embedImage, true);
                    return getBinaryGltf(gltf, embed, embedImage).glb;
                });
        });
}

function fixBatchIdSemantic(gltf) {
    const meshes = gltf.meshes;
    for (const meshId in meshes) {
        if (meshes.hasOwnProperty(meshId)) {
            const primitives = meshes[meshId].primitives;
            const primitivesLength = primitives.length;
            for (let i = 0; i < primitivesLength; ++i) {
                const attributes = primitives[i].attributes;
                if (defined(attributes.BATCHID)) {
                    attributes._BATCHID = attributes.BATCHID;
                    delete attributes.BATCHID;
                }
            }
        }
    }

    const techniques = gltf.techniques;
    for (const techniqueId in techniques) {
        if (techniques.hasOwnProperty(techniqueId)) {
            const parameters = techniques[techniqueId].parameters;
            for (const parameterId in parameters) {
                if (parameters.hasOwnProperty(parameterId)) {
                    const parameter = parameters[parameterId];
                    if (parameter.semantic === 'BATCHID') {
                        parameter.semantic = '_BATCHID';
                    }
                }
            }
        }
    }
}

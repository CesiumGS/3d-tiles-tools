import GltfPipeline from "gltf-pipeline";

/**
 * Internal utility methods related to glTF/GLB data.
 */
export class GltfUtilities {
  /**
   * Upgrades the binary glTF (GLB) data in the given buffer.
   *
   * The exact pre- and postconditions of this is are intentionally
   * not specified. But it is mainly used for updating a limited
   * subset of glTF 1.0 binary data to glTF 2.0.
   *
   * @param glbBuffer - The buffer containing the GLB
   * @returns A promise that resolves with the upgraded GLB.
   */
  static async upgradeGlb(glbBuffer: Buffer): Promise<Buffer> {
    const processGlb = GltfPipeline.processGlb;
    const result = await processGlb(glbBuffer);
    return result.glb;
  }

  //==========================================================================
  // Ported From https://github.com/CesiumGS/3d-tiles-tools/blob/37cffa759af301e44641bc89b4db5d06a3bdb800/lib/optimizeGlb.js#L58
  /**
   * Given an input buffer containing a binary glTF asset, optimize it using gltf-pipeline with the provided options
   *
   * @param glbBuffer The buffer containing the binary glTF.
   * @param options Options specifying custom gltf-pipeline behavior.
   * @returns A promise that resolves to the optimized binary glTF.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static async optimizeGlb(glbBuffer: Buffer, options: any): Promise<Buffer> {
    console.error("OptimizeGlb is not implemented yet");
    return glbBuffer;

    // TODO Update this. Whatever parseBinaryGltf is now...
    /*
    options = defaultValue(options, {});
    let rtcPosition;
    const gltf = GltfPipeline.parseBinaryGltf(glbBuffer);
    const extensions = gltf.extensions;
    if (extensions) {
      // If it is used, extract the CesiumRTC extension and add it back after processing
      const cesiumRTC = extensions.CESIUM_RTC;
      if (cesiumRTC) {
        rtcPosition = Cartesian3.unpack(cesiumRTC.center);
      }
    }
    GltfUtilities.fixBatchIdSemantic(gltf);
    await GltfPipeline.loadGltfUris(gltf, options);
    const processedGltf = await GltfPipeline.processJSONWithExtras(
      gltf,
      options
    );
    if (rtcPosition) {
      GltfPipeline.addCesiumRTC(processedGltf, {
        position: rtcPosition,
      });
    }
    const embed = defaultValue(options.embed, true);
    const embedImage = defaultValue(options.embedImage, true);
    const result = GltfPipeline.getBinaryGltf(
      processedGltf,
      embed,
      embedImage
    ).glb;
    return result;
    */
  }

  private static fixBatchIdSemantic(gltf: any) {
    const meshes = gltf.meshes;
    for (const meshId in meshes) {
      if (Object.prototype.hasOwnProperty.call(meshes, meshId)) {
        const primitives = meshes[meshId].primitives;
        const primitivesLength = primitives.length;
        for (let i = 0; i < primitivesLength; ++i) {
          const attributes = primitives[i].attributes;
          if (attributes.BATCHID) {
            attributes._BATCHID = attributes.BATCHID;
            delete attributes.BATCHID;
          }
        }
      }
    }

    const techniques = gltf.techniques;
    for (const techniqueId in techniques) {
      if (Object.prototype.hasOwnProperty.call(techniques, techniqueId)) {
        const parameters = techniques[techniqueId].parameters;
        for (const parameterId in parameters) {
          if (Object.prototype.hasOwnProperty.call(parameters, parameterId)) {
            const parameter = parameters[parameterId];
            if (parameter.semantic === "BATCHID") {
              parameter.semantic = "_BATCHID";
            }
          }
        }
      }
    }
  }
  //==========================================================================
}

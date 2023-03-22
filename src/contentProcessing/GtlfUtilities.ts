import GltfPipeline from "gltf-pipeline";
import { GltfPipelineLegacy } from "./GltfPipelineLegacy";

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

  /**
   * Given an input buffer containing a binary glTF asset, optimize it
   * using gltf-pipeline with the provided options.
   *
   * This method also performs a few updates of certain legacy
   * features that are specific for the GLB data that is part
   * of I3DM and B3DM. Details are not specified here.
   *
   * @param glbBuffer The buffer containing the binary glTF.
   * @param options Options specifying custom gltf-pipeline behavior.
   * @returns A promise that resolves to the optimized binary glTF.
   */
  static async optimizeGlb(glbBuffer: Buffer, options: any): Promise<Buffer> {
    options = options ?? {};
    if (!options.customStages) {
      options.customStages = [];
    }
    const customStage = (gltf: any) => {
      GltfPipelineLegacy.process(gltf);
      return gltf;
    };
    options.customStages.push(customStage);
    const result = await GltfPipeline.processGlb(glbBuffer, options);
    return result.glb;
  }
}

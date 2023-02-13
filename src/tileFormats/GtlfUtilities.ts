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
}

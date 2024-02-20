import { TileFormats } from "../../tilesets";

import { GltfUtilities } from "./GltfUtilities";

/**
 * Internal class containing functions to upgrade tile content data.
 *
 * For now, this covers the narrow case of B3DM and I3DM data where
 * the contained GLB should be upgraded from glTF 1.0 to glTF 2.0
 * with `gltf-pipeline`. (Specifically: This does not change the
 * type of the data itself)
 *
 * @internal
 */
export class ContentUpgrades {
  /**
   * For the given B3DM data buffer, extract the GLB, upgrade it
   * with `GltfUtilities.upgradeGlb`, create a new B3DM from the
   * result, and return it.
   *
   * @param inputBuffer - The input buffer
   * @param options - Options that will be passed to the
   * `gltf-pipeline` when the GLB is processed.
   * @returns The upgraded buffer
   */
  static async upgradeB3dmGltf1ToGltf2(
    inputBuffer: Buffer,
    options: any
  ): Promise<Buffer> {
    const inputTileData = TileFormats.readTileData(inputBuffer);
    const inputGlb = inputTileData.payload;
    const outputGlb = await GltfUtilities.upgradeGlb(inputGlb, options);
    const outputTileData = TileFormats.createB3dmTileDataFromGlb(
      outputGlb,
      inputTileData.featureTable.json,
      inputTileData.featureTable.binary,
      inputTileData.batchTable.json,
      inputTileData.batchTable.binary
    );
    const outputBuffer = TileFormats.createTileDataBuffer(outputTileData);
    return outputBuffer;
  }

  /**
   * For the given I3DM data buffer, extract the GLB, upgrade it
   * with `GltfUtilities.upgradeGlb`, create a new B3DM from the
   * result, and return it.
   *
   * @param inputBuffer - The input buffer
   * @param options - Options that will be passed to the
   * `gltf-pipeline` when the GLB is processed.
   * @returns The upgraded buffer
   */
  static async upgradeI3dmGltf1ToGltf2(
    inputBuffer: Buffer,
    options: any
  ): Promise<Buffer> {
    const inputTileData = TileFormats.readTileData(inputBuffer);
    const inputGlb = inputTileData.payload;
    const outputGlb = await GltfUtilities.upgradeGlb(inputGlb, options);
    const outputTileData = TileFormats.createI3dmTileDataFromGlb(
      outputGlb,
      inputTileData.featureTable.json,
      inputTileData.featureTable.binary,
      inputTileData.batchTable.json,
      inputTileData.batchTable.binary
    );
    const outputBuffer = TileFormats.createTileDataBuffer(outputTileData);
    return outputBuffer;
  }
}

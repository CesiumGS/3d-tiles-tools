import GltfPipeline from "gltf-pipeline";

import { GltfUtilities } from "./GtlfUtilities";

import { TileFormats } from "../tileFormats/TileFormats";
import { TileData } from "../tileFormats/TileData";
import { Buffers } from "../base/Buffers";

/**
 * Low-level operations on tile content.
 *
 * The methods in this class are supposed to represent basic
 * operations that receive a buffer with tile content data,
 * and return a buffer with tile content data.
 *
 * They are used for implementing some of the command line
 * functionalities (like `b3dmToGlb`), as well as serving
 * as building blocks for the tileset content processing
 * in pipelines.
 */
export class ContentOps {
  /**
   * Extracts the GLB buffer from the given B3DM buffer.
   *
   * @param inputBuffer - The input buffer
   * @returns The resulting buffer
   */
  static async b3dmToGlbBuffer(inputBuffer: Buffer): Promise<Buffer> {
    const inputTileData = TileFormats.readTileData(inputBuffer);
    const outputBuffer = ContentOps.transferRtcCenter(
      inputTileData,
      inputTileData.payload
    );
    return outputBuffer;
  }

  /**
   * Extracts the GLB buffer from the given I3DM buffer.
   *
   * @param inputBuffer - The input buffer
   * @returns The resulting buffer
   */
  static async i3dmToGlbBuffer(inputBuffer: Buffer): Promise<Buffer> {
    const inputTileData = TileFormats.readTileData(inputBuffer);
    const outputBuffer = ContentOps.transferRtcCenter(
      inputTileData,
      inputTileData.payload
    );
    return outputBuffer;
  }

  /**
   * Transfer the RTC_CENTER from the feature table of the given tile data
   * to the given glTF asset.
   *
   * If the given tile data feature table has an `RTC_CENTER`, then
   * new root nodes are inserted into the glTF that contain the
   * translation for this RTC center.
   * Otherwise, the given glTF buffer is returned directly.
   *
   * @param tileData - The `TileData`
   * @param glbBuffer - The GLB buffer
   * @returns The resulting GLB buffer
   */
  private static async transferRtcCenter(
    tileData: TileData,
    glbBuffer: Buffer
  ) {
    const featureTable = tileData.featureTable?.json;
    const rtcCenter = featureTable?.RTC_CENTER;
    if (!rtcCenter) {
      return glbBuffer;
    }
    // The actual translation is transformed with an inverse of the y-up to z-up
    // transform, to compensate for the y-up to z-up transform that is applied
    // to the glTF content.
    const translation = [rtcCenter[0], rtcCenter[2], -rtcCenter[1]];
    const customStage = (gltf: any) => {
      GltfUtilities.insertRootWithTranslation(gltf, translation);
      return gltf;
    };
    const options = {
      customStages: [customStage],
    };
    const result = await GltfPipeline.processGlb(glbBuffer, options);
    return result.glb;
  }

  /**
   * Convenience method to collect all GLB (binary glTF) buffers from
   * the given tile data.
   *
   * This can be applied to B3DM and I3DM tile data, as well as CMPT
   * tile data. (For PNTS, it will return an empty array). When the
   * given tile data is a composite (CMPT) tile data, and recursively
   * collect the buffer from its inner tiles.
   *
   * @param tileDataBuffer - The tile data buffer
   * @returns The array of GLB buffers
   */
  static async extractGlbBuffers(tileDataBuffer: Buffer): Promise<Buffer[]> {
    const glbBuffers: Buffer[] = [];
    await ContentOps.extractGlbBuffersInternal(tileDataBuffer, glbBuffers);
    return glbBuffers;
  }

  /**
   * Implementation for `extractGlbBuffers`, called recursively.
   *
   * @param tileDataBuffer - The tile data buffer
   * @param glbBuffers The array of GLB buffers
   */
  private static async extractGlbBuffersInternal(
    tileDataBuffer: Buffer,
    glbBuffers: Buffer[]
  ): Promise<void> {
    const isComposite = TileFormats.isComposite(tileDataBuffer);
    if (isComposite) {
      const compositeTileData =
        TileFormats.readCompositeTileData(tileDataBuffer);
      for (const innerTileDataBuffer of compositeTileData.innerTileBuffers) {
        await ContentOps.extractGlbBuffersInternal(
          innerTileDataBuffer,
          glbBuffers
        );
      }
    } else {
      const magic = Buffers.getMagicString(tileDataBuffer);
      if (magic === "b3dm") {
        const glbBuffer = await ContentOps.b3dmToGlbBuffer(tileDataBuffer);
        glbBuffers.push(glbBuffer);
      } else if (magic === "i3dm") {
        const glbBuffer = await ContentOps.i3dmToGlbBuffer(tileDataBuffer);
        glbBuffers.push(glbBuffer);
      }
    }
  }

  /**
   * Creates a B3DM buffer from the given GLB buffer.
   *
   * This will create a B3DM that contains the minimum required
   * default feature table, and the given GLB as its payload.
   *
   * @param inputBuffer - The input buffer
   * @returns The resulting buffer
   */
  static glbToB3dmBuffer(inputBuffer: Buffer): Buffer {
    const outputTileData =
      TileFormats.createDefaultB3dmTileDataFromGlb(inputBuffer);
    const outputBuffer = TileFormats.createTileDataBuffer(outputTileData);
    return outputBuffer;
  }

  /**
   * Creates a I3DM buffer from the given GLB buffer.
   *
   * This will create an I3DM that contains the minimum required
   * default feature table, and the given GLB as its payload.
   *
   * @param inputBuffer - The input buffer
   * @returns The resulting buffer
   */
  static glbToI3dmBuffer(inputBuffer: Buffer): Buffer {
    const outputTileData =
      TileFormats.createDefaultI3dmTileDataFromGlb(inputBuffer);
    const outputBuffer = TileFormats.createTileDataBuffer(outputTileData);
    return outputBuffer;
  }

  /**
   * Optimize the GLB that is contained in the given B3DM.
   *
   * This will optimize the GLB in the given B3DM, using `gltf-pipeline`
   * with the given options, and create a new B3DM from the result.
   * The result will have the same feature- and batch table data
   * as the given input.
   *
   * @param inputBuffer - The input buffer
   * @returns The resulting buffer
   */
  static async optimizeB3dmBuffer(
    inputBuffer: Buffer,
    options: any
  ): Promise<Buffer> {
    const inputTileData = TileFormats.readTileData(inputBuffer);
    const inputGlb = inputTileData.payload;
    const outputGlb = await GltfUtilities.optimizeGlb(inputGlb, options);
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
   * Optimize the GLB that is contained in the given I3DM.
   *
   * This will optimize the GLB in the given I3DM, using `gltf-pipeline`
   * with the given options, and create a new I3DM from the result.
   * The result will have the same feature- and batch table data
   * as the given input.
   *
   * @param inputBuffer - The input buffer
   * @returns The resulting buffer
   */
  static async optimizeI3dmBuffer(
    inputBuffer: Buffer,
    options: any
  ): Promise<Buffer> {
    const inputTileData = TileFormats.readTileData(inputBuffer);
    const inputGlb = inputTileData.payload;
    const outputGlb = await GltfUtilities.optimizeGlb(inputGlb, options);
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

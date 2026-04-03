import { TileFormats } from "../../tilesets";
import { CompositeTileData } from "../../tilesets";

import { GltfUtilities } from "./GltfUtilities";

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
 *
 * @internal
 */
export class ContentOps {
  /**
   * Extracts the GLB buffer from the given B3DM buffer.
   *
   * @param inputBuffer - The input buffer
   * @returns The resulting buffer
   */
  static b3dmToGlbBuffer(inputBuffer: Buffer): Buffer {
    const inputTileData = TileFormats.readTileData(inputBuffer);
    const outputBuffer = inputTileData.payload;
    return outputBuffer;
  }

  /**
   * Extracts the GLB buffer from the given I3DM buffer.
   *
   * @param inputBuffer - The input buffer
   * @returns The resulting buffer
   */
  static i3dmToGlbBuffer(inputBuffer: Buffer): Buffer {
    const inputTileData = TileFormats.readTileData(inputBuffer);
    const outputBuffer = inputTileData.payload;
    return outputBuffer;
  }

  /**
   * Extracts all GLB buffers from the given CMPT buffer.
   *
   * This will recursively resolve all inner tiles. If they
   * are B3DM or I3DM tiles, then their GLBs will be added
   * to the results array, in unspecified order.
   *
   * @param inputBuffer - The input buffer
   * @param externalGlbResolver - The function that will
   * resolve external GLB references from I3DM files.
   * @returns The resulting buffers
   */
  static async cmptToGlbBuffers(
    inputBuffer: Buffer,
    externalGlbResolver: (glbUri: string) => Promise<Buffer | undefined>
  ): Promise<Buffer[]> {
    return TileFormats.extractGlbBuffers(inputBuffer, externalGlbResolver);
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

  /**
   * Update the alignment of the given tile data buffer.
   *
   * This can be applied to B3DM, I3DM, PNTS, or CMPT tile data. It will
   * read the tile data from the input, and generate a new tile data
   * buffer with the same contents, but ensuring that the alignment
   * requirements for the batch- and feature tables and the tile data
   * as a whole are met. For CMPT tile data, the data of inner tiles
   * will be updated recursively.
   *
   * @param inputBuffer - The input buffer
   * @returns The resulting buffer
   */
  static updateAlignment(inputBuffer: Buffer): Buffer {
    const isComposite = TileFormats.isComposite(inputBuffer);
    if (isComposite) {
      const inputCompositeTileData =
        TileFormats.readCompositeTileData(inputBuffer);
      const header = inputCompositeTileData.header;
      const inputInnerTileBuffers = inputCompositeTileData.innerTileBuffers;
      const outputInnerTileBuffers: Buffer[] = [];
      for (let i = 0; i < inputInnerTileBuffers.length; i++) {
        const inputInnerTileBuffer = inputInnerTileBuffers[i];
        const outputInnerTileBuffer =
          ContentOps.updateAlignment(inputInnerTileBuffer);
        outputInnerTileBuffers.push(outputInnerTileBuffer);
      }
      const outputCompositeTileData: CompositeTileData = {
        header: header,
        innerTileBuffers: outputInnerTileBuffers,
      };
      const outputBuffer = TileFormats.createCompositeTileDataBuffer(
        outputCompositeTileData
      );
      return outputBuffer;
    }
    const tileData = TileFormats.readTileData(inputBuffer);
    const outputBuffer = TileFormats.createTileDataBuffer(tileData);
    return outputBuffer;
  }
}

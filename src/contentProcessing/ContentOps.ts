import { GltfUtilities } from "./GtlfUtilities";

import { TileFormats } from "../tileFormats/TileFormats";

export class ContentOps {
  static b3dmToGlbBuffer(inputBuffer: Buffer): Buffer {
    const inputTileData = TileFormats.readTileData(inputBuffer);
    const outputBuffer = inputTileData.payload;
    return outputBuffer;
  }

  static i3dmToGlbBuffer(inputBuffer: Buffer): Buffer {
    const inputTileData = TileFormats.readTileData(inputBuffer);
    const outputBuffer = inputTileData.payload;
    return outputBuffer;
  }

  static cmptToGlbBuffers(inputBuffer: Buffer): Buffer[] {
    return TileFormats.extractGlbBuffers(inputBuffer);
  }

  static glbToB3dmBuffer(inputBuffer: Buffer): Buffer {
    const outputTileData =
      TileFormats.createDefaultB3dmTileDataFromGlb(inputBuffer);
    const outputBuffer = TileFormats.createTileDataBuffer(outputTileData);
    return outputBuffer;
  }

  static glbToI3dmBuffer(inputBuffer: Buffer): Buffer {
    const outputTileData =
      TileFormats.createDefaultI3dmTileDataFromGlb(inputBuffer);
    const outputBuffer = TileFormats.createTileDataBuffer(outputTileData);
    return outputBuffer;
  }

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

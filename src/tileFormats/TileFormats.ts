import { Buffers } from "../base/Buffers";

import { CompositeTileData } from "./CompositeTileData";
import { TileData } from "./TileData";
import { TileDataLayout } from "./TileDataLayouts";
import { TileDataLayouts } from "./TileDataLayouts";
import { TileFormatError } from "./TileFormatError";

/**
 * Methods for handling 3D Tiles tile data.
 *
 * Methods for reading, creating, and writing data in
 * B3DM, I3DM, PNTS, and CMPT format.
 *
 */
export class TileFormats {
  /**
   * Returns whether the given buffer contains composite (CMPT) tile data.
   *
   * @param buffer - The buffer
   * @returns Whether the given buffer contains composite tile data
   */
  static isComposite(buffer: Buffer): boolean {
    const magic = Buffers.getMagicString(buffer);
    return magic === "cmpt";
  }

  /**
   * Reads a `CompositeTileData` object from the given buffer.
   *
   * The given buffer is assumed to contain valid tile data in CMPT
   * format. Whether the magic header of a buffer indicates CMPT
   * format can be checked with `isComposite`.
   *
   * @param buffer - The buffer
   * @returns The `CompositeTileData`
   * @throws TileFormatError If the given buffer did not contain
   * valid CMPT data.
   */
  static readCompositeTileData(buffer: Buffer): CompositeTileData {
    // Basic checks for magic number, length and version
    const magic = Buffers.getMagicString(buffer);
    if (magic !== "cmpt") {
      throw new TileFormatError(`Expected magic "cmpt", but found "${magic}"`);
    }

    const headerByteLength = 16;
    if (buffer.length < headerByteLength) {
      throw new TileFormatError(
        `Expected ${headerByteLength} bytes for ${magic} header, ` +
          `but only got ${buffer.length}`
      );
    }
    const version = buffer.readUInt32LE(4);
    if (version !== 1) {
      throw new TileFormatError(`Expected version "1", but got: "${version}'"`);
    }

    // Read each inner tile into a buffer
    const tilesLength = buffer.readUint32LE(12);
    const innerTileBuffers = [];
    let byteOffset = 16;
    for (let i = 0; i < tilesLength; ++i) {
      if (buffer.length < byteOffset + 4) {
        throw new TileFormatError(
          `Could not read byte length for inner tile ${i} ` +
            `at offset ${byteOffset} from buffer ${buffer}`
        );
      }
      const innerByteLength = buffer.readUInt32LE(byteOffset + 8);
      if (buffer.length < byteOffset + innerByteLength) {
        throw new TileFormatError(
          `Could not buffer with length ${innerByteLength} for ` +
            `inner tile ${i} at offset ${byteOffset} from buffer ${buffer}`
        );
      }
      const innerBuffer = buffer.subarray(
        byteOffset,
        byteOffset + innerByteLength
      );
      innerTileBuffers.push(innerBuffer);
      byteOffset += innerByteLength;
    }

    // Assemble the resulting CompositeTileData
    const header = {
      magic: magic,
      version: version,
      gltfFormat: undefined,
    };
    const compositeTileData = {
      header: header,
      innerTileBuffers: innerTileBuffers,
    };
    return compositeTileData;
  }

  /**
   * Reads a `TileData` object from the given buffer.
   *
   * This method can be applied to a buffer that contains valid B3DM,
   * I3DM or PNTS data.
   *
   * @param buffer - The buffer
   * @returns The `TileData`
   * @throws TileFormatError If the given buffer did not contain
   * valid tile data.
   */
  static readTileData(buffer: Buffer): TileData {
    // Compute the tile data layout, containing information
    // about the start and end of each data block. This will
    // handle the case that legacy B3DM data was given, and
    // throw an error if the header information is invalid.
    const tileDataLayout = TileDataLayouts.create(buffer);
    return this.extractTileData(buffer, tileDataLayout);
  }

  /**
   * Extracts a `TileData` object from the given buffer, based
   * on the given layout information.
   *
   * This method can be applied to a buffer that contains valid B3DM,
   * I3DM or PNTS data, with a tile data layout that was created
   * with the `TileDataLayouts.create` method.
   *
   * @param buffer - The buffer
   * @param tileDataLayout - The tile data layout
   * @return The `TileData`
   * @internal
   */
  static extractTileData(buffer: Buffer, tileDataLayout: TileDataLayout) {
    const magic = Buffers.getMagicString(buffer);
    const version = buffer.readUInt32LE(4);

    // The `gltfFormat` is only stored for I3DM
    let gltfFormat = undefined;
    if (magic === "i3dm") {
      gltfFormat = buffer.readUInt32LE(28);
    }

    // Extract the table data
    const featureTableJsonBuffer = buffer.subarray(
      tileDataLayout.featureTableJson.start,
      tileDataLayout.featureTableJson.end
    );
    const featureTableBinaryBuffer = buffer.subarray(
      tileDataLayout.featureTableBinary.start,
      tileDataLayout.featureTableBinary.end
    );
    const batchTableJsonBuffer = buffer.subarray(
      tileDataLayout.batchTableJson.start,
      tileDataLayout.batchTableJson.end
    );
    const batchTableBinaryBuffer = buffer.subarray(
      tileDataLayout.batchTableBinary.start,
      tileDataLayout.batchTableBinary.end
    );
    const payloadBuffer = buffer.subarray(
      tileDataLayout.payload.start,
      tileDataLayout.payload.end
    );

    let featureTableJson = Buffers.getJson(featureTableJsonBuffer);
    const batchTableJson = Buffers.getJson(batchTableJsonBuffer);

    // Apparently, this is another aspect of the legacy format handling:
    // In the current format, the BATCH_LENGTH is required, and supposed
    // to be part of the JSON. In the legacy formats, it was derived
    // somehow else. So it is inserted here in a way that may have to
    // be reviewed:
    if (magic === "b3dm") {
      if (Object.keys(featureTableJson).length === 0) {
        featureTableJson = {
          BATCH_LENGTH: tileDataLayout.legacyBatchLength,
        };
      }
    }

    // Assemble the final `TileData`
    const header = {
      magic: magic,
      version: version,
      gltfFormat: gltfFormat,
    };
    const featureTable = {
      json: featureTableJson,
      binary: featureTableBinaryBuffer,
    };
    const batchTable = {
      json: batchTableJson,
      binary: batchTableBinaryBuffer,
    };
    const tileData = {
      header: header,
      featureTable: featureTable,
      batchTable: batchTable,
      payload: payloadBuffer,
    };
    return tileData;
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
  static extractGlbBuffers(tileDataBuffer: Buffer): Buffer[] {
    const glbBuffers: Buffer[] = [];
    TileFormats.extractGlbBuffersInternal(tileDataBuffer, glbBuffers);
    return glbBuffers;
  }

  /**
   * Implementation for `extractGlbBuffers`, called recursively.
   *
   * @param tileDataBuffer - The tile data buffer
   * @param glbBuffers The array of GLB buffers
   */
  private static extractGlbBuffersInternal(
    tileDataBuffer: Buffer,
    glbBuffers: Buffer[]
  ): void {
    const isComposite = TileFormats.isComposite(tileDataBuffer);
    if (isComposite) {
      const compositeTileData =
        TileFormats.readCompositeTileData(tileDataBuffer);
      for (const innerTileDataBuffer of compositeTileData.innerTileBuffers) {
        TileFormats.extractGlbBuffersInternal(innerTileDataBuffer, glbBuffers);
      }
    } else {
      const tileData = TileFormats.readTileData(tileDataBuffer);
      if (
        tileData.header.magic === "b3dm" ||
        tileData.header.magic === "i3dm"
      ) {
        glbBuffers.push(tileData.payload);
      }
    }
  }

  /**
   * Creates a Batched 3D Model (B3DM) `TileData` instance from
   * a buffer that is assumed to contain valid binary glTF (GLB)
   * data.
   *
   * @param glbData - The GLB data
   * @returns The `TileData`
   */
  static createDefaultB3dmTileDataFromGlb(glbData: Buffer): TileData {
    return TileFormats.createB3dmTileDataFromGlb(
      glbData,
      undefined,
      undefined,
      undefined,
      undefined
    );
  }

  /**
   * Creates a Batched 3D Model (B3DM) `TileData` instance from
   * a buffer that is assumed to contain valid binary glTF (GLB)
   * data.
   *
   * @param glbData - The GLB data
   * @param featureTableJson - The feature table JSON
   * @param featureTableBinary - The feature table binary
   * @param batchTableJson - The batch table JSON
   * @param batchTableBinary - The batch table binary
   * @returns The `TileData`
   */
  static createB3dmTileDataFromGlb(
    glbData: Buffer,
    featureTableJson: any,
    featureTableBinary: Buffer | undefined,
    batchTableJson: any,
    batchTableBinary: Buffer | undefined
  ): TileData {
    const defaultFeatureTableJson = {
      BATCH_LENGTH: 0,
    };

    const header = {
      magic: "b3dm",
      version: 1,
      gltfFormat: undefined,
    };
    const featureTable = {
      json: featureTableJson ?? defaultFeatureTableJson,
      binary: featureTableBinary ?? Buffer.alloc(0),
    };
    const batchTable = {
      json: batchTableJson ?? {},
      binary: batchTableBinary ?? Buffer.alloc(0),
    };
    const tileData = {
      header: header,
      featureTable: featureTable,
      batchTable: batchTable,
      payload: glbData,
    };
    return tileData;
  }

  /**
   * Creates an Instanced 3D Model (I3DM) `TileData` instance from
   * a buffer that is assumed to contain valid binary glTF (GLB)
   * data. The resulting tile data will represent a single instance,
   * namely exactly the given GLB object.
   *
   * @param glbData - The GLB data
   * @param featureTableJson - The feature table JSON
   * @param featureTableBinary - The feature table binary
   * @param batchTableJson - The batch table JSON
   * @param batchTableBinary - The batch table binary
   * @returns The `TileData`
   */
  static createDefaultI3dmTileDataFromGlb(glbData: Buffer): TileData {
    return TileFormats.createI3dmTileDataFromGlb(
      glbData,
      undefined,
      undefined,
      undefined,
      undefined
    );
  }

  /**
   * Creates an Instanced 3D Model (I3DM) `TileData` instance from
   * a buffer that is assumed to contain valid binary glTF (GLB)
   * data.
   *
   * If no feature table information is given, then the resulting tile
   * data will represent a single instance, namely exactly the given
   * GLB object.
   *
   * @param glbData - The GLB data
   * @param featureTableJson - The feature table JSON
   * @param featureTableBinary - The feature table binary
   * @param batchTableJson - The batch table JSON
   * @param batchTableBinary - The batch table binary
   * @returns The `TileData`
   */
  static createI3dmTileDataFromGlb(
    glbData: Buffer,
    featureTableJson: any,
    featureTableBinary: Buffer | undefined,
    batchTableJson: any,
    batchTableBinary: Buffer | undefined
  ): TileData {
    const defaultFeatureTableJson = {
      INSTANCES_LENGTH: 1,
      POSITION: {
        byteOffset: 0,
      },
    };
    const defaultFeatureTableBinary = Buffer.alloc(12, 0); // [0, 0, 0]

    const header = {
      magic: "i3dm",
      version: 1,
      gltfFormat: 1,
    };
    const featureTable = {
      json: featureTableJson ?? defaultFeatureTableJson,
      binary: featureTableBinary ?? defaultFeatureTableBinary,
    };
    const batchTable = {
      json: batchTableJson ?? {},
      binary: batchTableBinary ?? Buffer.alloc(0),
    };
    const tileData = {
      header: header,
      featureTable: featureTable,
      batchTable: batchTable,
      payload: glbData,
    };
    return tileData;
  }

  /**
   * Creates a Composite Tile Data (CMPT) instance from the given
   * `TileData` instances.
   *
   * @param tileDatas - The `TileData` instances
   * @returns The `CompositeTileData`
   */
  static createCompositeTileData(tileDatas: TileData[]): CompositeTileData {
    const innerBuffers = [];
    for (const tileData of tileDatas) {
      const innerBuffer = TileFormats.createTileDataBuffer(tileData);
      innerBuffers.push(innerBuffer);
    }
    const header = {
      magic: "cmpt",
      version: 1,
    };
    const compositeTileData = {
      header: header,
      innerTileBuffers: innerBuffers,
    };
    return compositeTileData;
  }

  /**
   * Creates a buffer from the given `TileData`.
   *
   * The resulting buffer will contain a representation of the
   * tile data that can directly be written to a file. The
   * method will ensure that the padding requirements for the
   * 3D Tiles tile formats are met.
   *
   * @param tileData - The `TileData`
   * @returns The buffer
   */
  static createTileDataBuffer(tileData: TileData): Buffer {
    const header = tileData.header;
    const featureTable = tileData.featureTable;
    const batchTable = tileData.batchTable;

    let headerByteLength = 28;
    if (header.magic === "i3dm") {
      headerByteLength = 32;
    }
    const featureTableJsonBuffer = Buffers.getJsonBufferPadded(
      featureTable.json,
      headerByteLength
    );
    const featureTableBinaryBuffer = Buffers.getBufferPadded(
      featureTable.binary
    );
    const batchTableJsonBuffer = Buffers.getJsonBufferPadded(batchTable.json);
    const batchTableBinaryBuffer = Buffers.getBufferPadded(batchTable.binary);
    const payload = Buffers.getBufferPadded(tileData.payload);

    const byteLength =
      headerByteLength +
      featureTableJsonBuffer.length +
      featureTableBinaryBuffer.length +
      batchTableJsonBuffer.length +
      batchTableBinaryBuffer.length +
      payload.length;
    const headerBuffer = Buffer.alloc(headerByteLength);
    headerBuffer.write(header.magic, 0);
    headerBuffer.writeUInt32LE(tileData.header.version, 4);
    headerBuffer.writeUInt32LE(byteLength, 8);
    headerBuffer.writeUInt32LE(featureTableJsonBuffer.length, 12);
    headerBuffer.writeUInt32LE(featureTableBinaryBuffer.length, 16);
    headerBuffer.writeUInt32LE(batchTableJsonBuffer.length, 20);
    headerBuffer.writeUInt32LE(batchTableBinaryBuffer.length, 24);
    if (header.magic === "i3dm") {
      const gltfFormat = header.gltfFormat ?? 0;
      headerBuffer.writeUInt32LE(gltfFormat, 28);
    }
    return Buffer.concat([
      headerBuffer,
      featureTableJsonBuffer,
      featureTableBinaryBuffer,
      batchTableJsonBuffer,
      batchTableBinaryBuffer,
      payload,
    ]);
  }

  /**
   * Creates a buffer from the given `CompositeTileData`.
   *
   * The resulting buffer will contain a representation of the
   * tile data that can directly be written to a file. The
   * method will ensure that the padding requirements for the
   * 3D Tiles tile formats are met.
   *
   * @param compositeTileData - The `CompositeTileData`
   * @returns The buffer
   */
  static createCompositeTileDataBuffer(
    compositeTileData: CompositeTileData
  ): Buffer {
    const buffers = [];

    // Create one buffer for the header
    const headerByteLength = 16;
    const header = Buffer.alloc(headerByteLength);
    buffers.push(header);

    // Create one buffer for each inner tile
    let byteLength = headerByteLength;
    const innerBuffers = compositeTileData.innerTileBuffers;
    const tilesLength = innerBuffers.length;
    for (let i = 0; i < tilesLength; i++) {
      const innerBuffer = innerBuffers[i];
      const innerBufferPadded = Buffers.getBufferPadded(
        innerBuffer,
        byteLength
      );

      // Update the length information of the inner tile,
      // for the case that padding bytes have been inserted.
      innerBufferPadded.writeUInt32LE(innerBufferPadded.length, 8);
      buffers.push(innerBufferPadded);
      byteLength += innerBufferPadded.length;
    }

    // Write magic, version, byteLength and tilesLength
    header.write("cmpt", 0);
    header.writeUInt32LE(1, 4);
    header.writeUInt32LE(byteLength, 8);
    header.writeUInt32LE(tilesLength, 12);

    return Buffer.concat(buffers);
  }
}

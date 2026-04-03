import { Buffers } from "../../base";

import { TileFormatError } from "./TileFormatError";

/**
 * An interface describing the start, length, and end (in bytes)
 * of one "block" inside the tile data.
 *
 * A "block" can be the feature- and batch table JSON and binary,
 * as well as the payload.
 *
 * @internal
 */
export interface TileDataBlockLayout {
  start: number;
  length: number;
  end: number;
}

/**
 * An interface describing the layout of tile data (B3DM,
 * I3DM and PNTS)
 *
 * @internal
 */
export interface TileDataLayout {
  magic: string;
  headerLength: number;
  byteLength: number;

  featureTableJson: TileDataBlockLayout;
  featureTableBinary: TileDataBlockLayout;

  batchTableJson: TileDataBlockLayout;
  batchTableBinary: TileDataBlockLayout;

  payload: TileDataBlockLayout;

  // The BATCH_LENGTH for the feature table JSON,
  // for the case that a legacy B3DM format was
  // used, where this is derived from the legacy
  // data layout
  legacyBatchLength: number | undefined;
}

/**
 * Methods to compute `TileDataLayout` instances from the information
 * that was read from the binary header.
 *
 * @internal
 */
export class TileDataLayouts {
  static create(buffer: Buffer): TileDataLayout {
    // Basic checks for magic number, length and version
    const magic = Buffers.getMagicString(buffer);
    if (magic !== "b3dm" && magic !== "pnts" && magic !== "i3dm") {
      throw new TileFormatError(
        `Expected magic "b3dm", "i3dm", or "pnts", but found "${magic}"`
      );
    }
    let headerLength = 28;
    if (magic === "i3dm") {
      headerLength = 32;
    }
    if (buffer.length < headerLength) {
      throw new TileFormatError(
        `Expected ${headerLength} bytes for ${magic} header, ` +
          `but only got ${buffer.length}`
      );
    }
    const version = buffer.readUInt32LE(4);
    if (version !== 1) {
      throw new TileFormatError(`Expected version "1", but got: "${version}'"`);
    }

    // Read the basic data layout information, i.e. the lengths
    // of feature- and batch table JSON and binaries.
    const byteLength = buffer.readUInt32LE(8);
    let featureTableJsonLength = buffer.readUInt32LE(12);
    let featureTableBinaryLength = buffer.readUInt32LE(16);
    let batchTableJsonLength = buffer.readUInt32LE(20);
    let batchTableBinaryLength = buffer.readUInt32LE(24);

    let batchLength: number | undefined = undefined;
    if (magic === "b3dm") {
      // Keep this legacy check in for now since a lot of tilesets are still using the old header.
      // Legacy header #1: [batchLength] [batchTableLength]
      // Legacy header #2: [batchTableJsonLength] [batchTableBinaryLength] [batchLength]
      // Current header: [featureTableJsonLength] [featureTableBinaryLength] [batchTableJsonLength] [batchTableBinaryLength]
      // If the header is in the first legacy format 'batchTableJsonLength'
      // will be the start of the JSON string (a quotation mark) or the glTF magic.
      // Accordingly its first byte will be either 0x22 or 0x67, and so the minimum uint32 expected
      // is 0x22000000 = 570425344 = 570MB. It is unlikely that the feature table Json will exceed this length.
      // The check for the second legacy format is similar, except it checks 'batchTableBinaryLength' instead
      if (batchTableJsonLength >= 570425344) {
        // First legacy check
        headerLength = 20;
        batchLength = featureTableJsonLength;
        batchTableJsonLength = featureTableBinaryLength;
        batchTableBinaryLength = 0;
        featureTableJsonLength = 0;
        featureTableBinaryLength = 0;
      } else if (batchTableBinaryLength >= 570425344) {
        // Second legacy check
        headerLength = 24;
        batchLength = batchTableJsonLength;
        batchTableJsonLength = featureTableJsonLength;
        batchTableBinaryLength = featureTableBinaryLength;
        featureTableJsonLength = 0;
        featureTableBinaryLength = 0;
      }
    }

    const featureTableJsonStart = headerLength;
    const featureTableJsonEnd = featureTableJsonStart + featureTableJsonLength;

    const featureTableBinaryStart = featureTableJsonEnd;
    const featureTableBinaryEnd =
      featureTableBinaryStart + featureTableBinaryLength;

    const batchTableJsonStart = featureTableBinaryEnd;
    const batchTableJsonEnd = batchTableJsonStart + batchTableJsonLength;

    const batchTableBinaryStart = batchTableJsonEnd;
    const batchTableBinaryEnd = batchTableBinaryStart + batchTableBinaryLength;

    const payloadStart = batchTableBinaryEnd;
    const payloadLength = byteLength - payloadStart;
    const payloadEnd = payloadStart + payloadLength;

    return {
      magic: magic,
      headerLength: headerLength,
      byteLength: byteLength,
      featureTableJson: {
        start: featureTableJsonStart,
        length: featureTableJsonLength,
        end: featureTableJsonEnd,
      },
      featureTableBinary: {
        start: featureTableBinaryStart,
        length: featureTableBinaryLength,
        end: featureTableBinaryEnd,
      },
      batchTableJson: {
        start: batchTableJsonStart,
        length: batchTableJsonLength,
        end: batchTableJsonEnd,
      },
      batchTableBinary: {
        start: batchTableBinaryStart,
        length: batchTableBinaryLength,
        end: batchTableBinaryEnd,
      },
      payload: {
        start: payloadStart,
        length: payloadLength,
        end: payloadEnd,
      },
      legacyBatchLength: batchLength,
    };
  }
}

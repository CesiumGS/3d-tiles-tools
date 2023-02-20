import fs from "fs";

import { Buffers } from "../../src/base/Buffers";
import { TileFormats } from "../../src/tileFormats/TileFormats";
import { SpecHelpers } from "./SpecHelpers";

const b3dmPath = "./specs/data/batchedWithBatchTableBinary.b3dm";
const i3dmPath = "./specs/data/instancedWithBatchTableBinary.i3dm";

describe("makeCompositeTile", function () {
  it("makes a composite tile", function () {
    const b3dm = fs.readFileSync(b3dmPath);
    const i3dm = fs.readFileSync(i3dmPath);

    const b3dmOriginalLength = b3dm.length;
    const i3dmOriginalLength = i3dm.length;
    expect(b3dmOriginalLength % 8 > 0).toBe(true); // initially not aligned

    const b3dmTileData = TileFormats.readTileData(b3dm);
    const i3dmTileData = TileFormats.readTileData(i3dm);
    const cmptTileData = TileFormats.createCmpt([b3dmTileData, i3dmTileData]);
    const cmpt = TileFormats.createCompositeTileDataBuffer(cmptTileData);
    const magic = Buffers.getMagic(cmpt);
    const version = cmpt.readUInt32LE(4);
    const byteLength = cmpt.readUInt32LE(8);
    const tilesLength = cmpt.readUInt32LE(12);

    const headerByteLength = 16;
    const expectedByteLength =
      headerByteLength +
      SpecHelpers.getPaddedByteLength(b3dmOriginalLength) +
      SpecHelpers.getPaddedByteLength(i3dmOriginalLength);

    expect(magic).toBe("cmpt");
    expect(version).toBe(1);
    expect(byteLength).toBe(cmpt.length);
    expect(byteLength).toBe(expectedByteLength);
    expect(tilesLength).toBe(2);

    const b3dmMagic = Buffers.getMagic(cmpt, headerByteLength);
    const b3dmByteLength = cmpt.readUInt32LE(headerByteLength + 8);
    expect(b3dmMagic).toBe("b3dm");
    expect(b3dmByteLength % 8 === 0).toBe(true); // b3dm is aligned

    const i3dmMagic = Buffers.getMagic(cmpt, headerByteLength + b3dmByteLength);
    const i3dmByteLength = cmpt.readUInt32LE(
      headerByteLength + b3dmByteLength + 8
    );
    expect(i3dmMagic).toBe("i3dm");
    expect(i3dmByteLength % 8 === 0).toBe(true); // i3dm is aligned
  });
});

import fs from "fs";
const b3dmPath = "./specs/data/batchedWithBatchTableBinary.b3dm";

import { TileFormats } from "../../src/tileFormats/TileFormats";

describe("extractB3dm", function () {
  let b3dmBuffer: Buffer;
  beforeAll(function () {
    b3dmBuffer = fs.readFileSync(b3dmPath);
  });

  it("extracts a b3dm from buffer", function () {
    const b3dm = TileFormats.readTileData(b3dmBuffer);
    expect(b3dm.header.magic).toBe("b3dm");
    expect(b3dm.header.version).toBe(1);
    expect(b3dm.featureTable.json).toBeDefined();
    expect(b3dm.featureTable.json.BATCH_LENGTH).toBe(10);
    expect(b3dm.featureTable.binary.length).toBe(0);
    expect(b3dm.batchTable.json).toBeDefined();
    expect(b3dm.batchTable.json.Height).toBeDefined();
    expect(b3dm.batchTable.binary.length).toBe(256);
    expect(b3dm.payload.length).toBe(14141);
  });
});

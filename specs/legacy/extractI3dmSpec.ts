import fs from "fs";
import { TileFormats } from "../../src/tileFormats/TileFormats";

const i3dmPath = "./specs/data/instancedWithBatchTableBinary.i3dm";

describe("extractI3dm", function () {
  let i3dmBuffer: Buffer;

  beforeAll(function () {
    i3dmBuffer = fs.readFileSync(i3dmPath);
  });

  it("extracts a i3dm from buffer", function () {
    const i3dm = TileFormats.readTileData(i3dmBuffer);
    expect(i3dm.header.magic).toBe("i3dm");
    expect(i3dm.header.version).toBe(1);
    expect(i3dm.featureTable.json).toBeDefined();
    expect(i3dm.featureTable.json.INSTANCES_LENGTH).toBe(25);
    expect(i3dm.featureTable.binary.length).toBe(304);
    expect(i3dm.batchTable.json).toBeDefined();
    expect(i3dm.batchTable.json.id).toBeDefined();
    expect(i3dm.batchTable.binary.length).toBe(104);
    expect(i3dm.payload.length).toBe(5352);
  });
});

import fs from "fs";

import { TileFormats } from "../../src/tileFormats/TileFormats";

const glbPath = "./specs/data/CesiumTexturedBox/CesiumTexturedBox.glb";

// Notes:
// - Some tests here originally tested exact memory layouts.
//   In the new implementation, the responsibility for proper
//   layout and alignment is in the library. We don't (want to or
//   have to) care about the layout, as long as it complies to
//   the specification.
// - Some tests originally relied on "invalid" outputs to be
//   generated (e.g. a B3DM without the mandatory JSON header).
// - Some of the original specs data already WAS invalid in terms
//   of alignment. Any tests that relied on the input being correct
//   (and comparing it to the NEW output, that indeed IS correct)
//   have  therefore been bound to fail.

describe("glbToB3dm", function () {
  let glbBuffer: Buffer;

  beforeAll(function () {
    glbBuffer = fs.readFileSync(glbPath);
  });

  it("generates a basic b3dm header for a glb", function () {
    const headerByteLength = 28;
    const b3dmTileData =
      TileFormats.createDefaultB3dmTileDataFromGlb(glbBuffer);
    const b3dmBuffer = TileFormats.createTileDataBuffer(b3dmTileData);
    const header = b3dmBuffer.subarray(0, headerByteLength);
    expect(header.toString("utf8", 0, 4)).toEqual("b3dm"); // magic
    expect(header.readUInt32LE(4)).toEqual(1); // version
    expect(header.readUInt32LE(12)).not.toEqual(0); // featureTableJSONByteLength
    expect(header.readUInt32LE(16)).toEqual(0); // featureTableBinaryByteLength
    expect(header.readUInt32LE(20)).toEqual(0); // batchTableJSONByteLength
    expect(header.readUInt32LE(24)).toEqual(0); // batchTableBinaryByteLength
  });

  it("generates a b3dm with feature table and batch table", function () {
    const featureTableJson = {
      BATCH_LENGTH: 10,
    };
    const batchTableJson = {
      height: {
        componentType: "FLOAT",
        type: "SCALAR",
        byteOffset: 0,
      },
    };
    const featureTableBinaryBuffer = Buffer.alloc(16); // Contents don't matter
    const batchTableBinaryBuffer = Buffer.alloc(32); // Contents don't matter

    const tileData = TileFormats.createB3dmTileDataFromGlb(
      glbBuffer,
      featureTableJson,
      featureTableBinaryBuffer,
      batchTableJson,
      batchTableBinaryBuffer
    );
    const b3dmBuffer = TileFormats.createTileDataBuffer(tileData);
    const headerByteLength = 28;
    const header = b3dmBuffer.subarray(0, headerByteLength);
    expect(header.toString("utf8", 0, 4)).toEqual("b3dm"); // magic
    expect(header.readUInt32LE(4)).toEqual(1); // version
    expect(header.readUInt32LE(8)).not.toEqual(0); // byteLength
    expect(header.readUInt32LE(12)).not.toEqual(0); // featureTableJSONByteLength
    expect(header.readUInt32LE(16)).toEqual(featureTableBinaryBuffer.length); // featureTableBinaryByteLength
    expect(header.readUInt32LE(20)).not.toEqual(0); // batchTableJSONByteLength
    expect(header.readUInt32LE(24)).toEqual(batchTableBinaryBuffer.length); // batchTableBinaryByteLength
  });
});

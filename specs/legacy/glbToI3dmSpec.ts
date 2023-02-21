import fs from "fs";
import { TileFormats } from "../../src/tileFormats/TileFormats";

const glbPath = "./specs/data/CesiumTexturedBox/CesiumTexturedBox.glb";

// Notes: The same as in the notes of "glbToB3dmSpec" applies here.

describe("glbToI3dm", function () {
  let glbBuffer: Buffer;

  beforeAll(function () {
    glbBuffer = fs.readFileSync(glbPath);
  });

  it("generates a basic i3dm header for a glb", function () {
    const headerByteLength = 32;
    const tileData = TileFormats.createDefaultI3dmTileDataFromGlb(glbBuffer);
    const i3dmBuffer = TileFormats.createTileDataBuffer(tileData);
    const header = i3dmBuffer.subarray(0, headerByteLength);
    expect(header.toString("utf8", 0, 4)).toEqual("i3dm"); // magic
    expect(header.readUInt32LE(4)).toEqual(1); // version
    expect(header.readUInt32LE(12)).not.toEqual(0); // featureTableJSONByteLength
    expect(header.readUInt32LE(16)).not.toEqual(0); // featureTableBinaryByteLength
    expect(header.readUInt32LE(20)).toEqual(0); // batchTableJSONByteLength
    expect(header.readUInt32LE(24)).toEqual(0); // batchTableBinaryByteLength
    expect(header.readUInt32LE(28)).toEqual(1); // gltfFormat
  });

  it("generates an i3dm with feature table and batch table", function () {
    const featureTableJson = {
      INSTANCES_LENGTH: 1,
      POSITION: {
        byteOffset: 0,
      },
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

    const tileData = TileFormats.createI3dmTileDataFromGlb(
      glbBuffer,
      featureTableJson,
      featureTableBinaryBuffer,
      batchTableJson,
      batchTableBinaryBuffer
    );
    const i3dmBuffer = TileFormats.createTileDataBuffer(tileData);
    const headerByteLength = 32;
    const header = i3dmBuffer.subarray(0, headerByteLength);
    expect(header.toString("utf8", 0, 4)).toEqual("i3dm"); // magic
    expect(header.readUInt32LE(4)).toEqual(1); // version
    expect(header.readUInt32LE(8)).not.toEqual(0); // byteLength
    expect(header.readUInt32LE(12)).not.toEqual(0); // featureTableJSONByteLength
    expect(header.readUInt32LE(16)).toEqual(featureTableBinaryBuffer.length); // featureTableBinaryByteLength
    expect(header.readUInt32LE(20)).not.toEqual(0); // batchTableJSONByteLength
    expect(header.readUInt32LE(24)).toEqual(batchTableBinaryBuffer.length); // batchTableBinaryByteLength
    expect(header.readUInt32LE(28)).toEqual(1); // gltfFormat
  });
});

import fs from "fs";
import path from "path";
import { Buffers } from "../../../src/base";

import { TileFormats } from "../../../src/tilesets";

import { SpecHelpers } from "../../SpecHelpers";

const SPECS_DATA_BASE_DIRECTORY = SpecHelpers.getSpecsDataBaseDirectory();

function createResolver(
  input: string
): (uri: string) => Promise<Buffer | undefined> {
  const baseDir = path.dirname(input);
  const resolver = async (uri: string): Promise<Buffer | undefined> => {
    const externalGlbUri = path.resolve(baseDir, uri);
    try {
      return fs.readFileSync(externalGlbUri);
    } catch (error) {
      console.error(`Could not resolve ${uri} against ${baseDir}`);
    }
  };
  return resolver;
}

describe("TileFormats", function () {
  it("reads B3DM (deprecated 1) from a buffer", function () {
    const p =
      SPECS_DATA_BASE_DIRECTORY + "/BatchedDeprecated1/batchedDeprecated1.b3dm";
    const tileDataBuffer = fs.readFileSync(p);

    const tileData = TileFormats.readTileData(tileDataBuffer);
    expect(tileData.header.magic).toBe("b3dm");
    expect(tileData.header.version).toBe(1);

    expect(tileData.featureTable.json).toBeDefined();
    expect(tileData.featureTable.json.BATCH_LENGTH).toBe(10);
    expect(tileData.featureTable.binary.length).toBe(0);

    expect(tileData.batchTable.json).toBeDefined();
    expect(tileData.batchTable.json.Height).toBeDefined();
    expect(tileData.batchTable.binary.length).toBe(0);

    expect(tileData.payload.length).toBe(14137);
  });

  it("reads B3DM (deprecated 2) from a buffer", function () {
    const p =
      SPECS_DATA_BASE_DIRECTORY + "/BatchedDeprecated2/batchedDeprecated2.b3dm";
    const tileDataBuffer = fs.readFileSync(p);

    const tileData = TileFormats.readTileData(tileDataBuffer);
    expect(tileData.header.magic).toBe("b3dm");
    expect(tileData.header.version).toBe(1);

    expect(tileData.featureTable.json).toBeDefined();
    expect(tileData.featureTable.json.BATCH_LENGTH).toBe(10);
    expect(tileData.featureTable.binary.length).toBe(0);

    expect(tileData.batchTable.json).toBeDefined();
    expect(tileData.batchTable.json.Height).toBeDefined();
    expect(tileData.batchTable.binary.length).toBe(0);

    expect(tileData.payload.length).toBe(14137);
  });

  it("reads B3DM from a buffer", function () {
    const p = SPECS_DATA_BASE_DIRECTORY + "/contentTypes/content.b3dm";
    const tileDataBuffer = fs.readFileSync(p);

    const tileData = TileFormats.readTileData(tileDataBuffer);
    expect(tileData.header.magic).toBe("b3dm");
    expect(tileData.header.version).toBe(1);

    expect(tileData.featureTable.json).toBeDefined();
    expect(tileData.featureTable.json.BATCH_LENGTH).toBe(10);
    expect(tileData.featureTable.binary.length).toBe(0);

    expect(tileData.batchTable.json).toBeDefined();
    expect(tileData.batchTable.json.Longitude).toBeDefined();
    expect(tileData.batchTable.json.Latitude).toBeDefined();
    expect(tileData.batchTable.json.Height).toBeDefined();
    expect(tileData.batchTable.binary.length).toBe(0);

    expect(tileData.payload.length).toBe(8944);
  });

  it("reads I3DM from a buffer", function () {
    const p = SPECS_DATA_BASE_DIRECTORY + "/contentTypes/content.i3dm";
    const tileDataBuffer = fs.readFileSync(p);

    const tileData = TileFormats.readTileData(tileDataBuffer);
    expect(tileData.header.magic).toBe("i3dm");
    expect(tileData.header.version).toBe(1);

    expect(tileData.featureTable.json).toBeDefined();
    expect(tileData.featureTable.binary.length).toBe(304);

    expect(tileData.batchTable.json).toBeDefined();
    expect(tileData.batchTable.json.Height).toBeDefined();
    expect(tileData.batchTable.binary.length).toBe(0);

    expect(tileData.payload.length).toBe(3284);
  });

  it("reads PNTS from a buffer", function () {
    const p = SPECS_DATA_BASE_DIRECTORY + "/contentTypes/content.pnts";
    const tileDataBuffer = fs.readFileSync(p);

    const tileData = TileFormats.readTileData(tileDataBuffer);
    expect(tileData.header.magic).toBe("pnts");
    expect(tileData.header.version).toBe(1);

    expect(tileData.featureTable.json).toBeDefined();
    expect(tileData.featureTable.json.POINTS_LENGTH).toBe(1000);
    expect(tileData.featureTable.binary.length).toBe(15000);

    expect(tileData.batchTable.json).toBeDefined();
    expect(tileData.batchTable.json.temperature).toBeDefined();
    expect(tileData.batchTable.json.secondaryColor).toBeDefined();
    expect(tileData.batchTable.json.id).toBeDefined();
    expect(tileData.batchTable.binary.length).toBe(18000);

    expect(tileData.payload.length).toBe(0);
  });

  it("reads CMPT from a buffer", function () {
    const p = SPECS_DATA_BASE_DIRECTORY + "/contentTypes/content.cmpt";
    const tileDataBuffer = fs.readFileSync(p);

    const tileData = TileFormats.readCompositeTileData(tileDataBuffer);
    expect(tileData.header.magic).toBe("cmpt");
    expect(tileData.header.version).toBe(1);

    expect(tileData.innerTileBuffers).toBeDefined();
    expect(tileData.innerTileBuffers.length).toBe(2);
  });

  it("extracts a single GLB buffers from B3DM", async function () {
    const p = SPECS_DATA_BASE_DIRECTORY + "/contentTypes/content.b3dm";
    const tileDataBuffer = fs.readFileSync(p);
    const externalGlbResolver = createResolver(p);
    const glbBuffers = await TileFormats.extractGlbBuffers(
      tileDataBuffer,
      externalGlbResolver
    );
    expect(glbBuffers.length).toBe(1);
  });

  it("extracts multiple GLB buffers from CMPT", async function () {
    const p = SPECS_DATA_BASE_DIRECTORY + "/contentTypes/content.cmpt";
    const tileDataBuffer = fs.readFileSync(p);
    const externalGlbResolver = createResolver(p);
    const glbBuffers = await TileFormats.extractGlbBuffers(
      tileDataBuffer,
      externalGlbResolver
    );
    expect(glbBuffers.length).toBe(2);
  });

  it("extracts a single GLB buffer from an I3DM that refers to an external GLB", async function () {
    const p =
      SPECS_DATA_BASE_DIRECTORY + "/tileFormats/instancedGltfExternal.i3dm";
    const tileDataBuffer = fs.readFileSync(p);
    const externalGlbResolver = createResolver(p);
    const glbBuffers = await TileFormats.extractGlbBuffers(
      tileDataBuffer,
      externalGlbResolver
    );
    expect(glbBuffers.length).toBe(1);
  });

  it("extracts no GLB buffers from PNTS", async function () {
    const p = SPECS_DATA_BASE_DIRECTORY + "/contentTypes/content.pnts";
    const tileDataBuffer = fs.readFileSync(p);
    const externalGlbResolver = createResolver(p);
    const glbBuffers = await TileFormats.extractGlbBuffers(
      tileDataBuffer,
      externalGlbResolver
    );
    expect(glbBuffers.length).toBe(0);
  });

  it("properly omits padding bytes in extractGlbPayload for b3dmToGlb", async function () {
    const p = SPECS_DATA_BASE_DIRECTORY + "/tileFormats/box.glb";

    const inputGlbBuffer = fs.readFileSync(p);
    const inputB3dmTileData =
      TileFormats.createDefaultB3dmTileDataFromGlb(inputGlbBuffer);
    const b3dmBuffer = TileFormats.createTileDataBuffer(inputB3dmTileData);

    const outputB3dmTileData = TileFormats.readTileData(b3dmBuffer);
    const outputGlbBuffer = TileFormats.extractGlbPayload(outputB3dmTileData);

    // The input GLB is NOT 8-byte-aligned
    expect(inputGlbBuffer.length % 8).not.toEqual(0);

    // The payload from the generated B3DM tile data is
    // aligned to 8 bytes
    expect(outputB3dmTileData.payload.length % 8).toEqual(0);

    // The GLB that is extracted from the B3DM tile data
    // has the same length as the original input
    expect(outputGlbBuffer.length).toEqual(inputGlbBuffer.length);
  });

  it("splits a composite with splitCmpt", async function () {
    const p = SPECS_DATA_BASE_DIRECTORY + "/composite.cmpt";
    const recursive = false;
    const inputBuffer = fs.readFileSync(p);
    const outputBuffers = await TileFormats.splitCmpt(inputBuffer, recursive);
    expect(outputBuffers.length).toEqual(2);
  });

  it("splits a composite-of-composite into a single file with non-recursive splitCmpt", async function () {
    const p = SPECS_DATA_BASE_DIRECTORY + "/compositeOfComposite.cmpt";
    const recursive = false;
    const inputBuffer = fs.readFileSync(p);
    const outputBuffers = await TileFormats.splitCmpt(inputBuffer, recursive);
    expect(outputBuffers.length).toEqual(1);
  });

  it("splits a composite-of-composite into a all 'leaf' tiles with recursive splitCmpt", async function () {
    const p = SPECS_DATA_BASE_DIRECTORY + "/compositeOfComposite.cmpt";
    const recursive = true;
    const inputBuffer = fs.readFileSync(p);
    const outputBuffers = await TileFormats.splitCmpt(inputBuffer, recursive);
    expect(outputBuffers.length).toEqual(2);
  });

  it("throws an error when trying to read tile data from a buffer that does not contain B3DM, I3DM, or PNTS", function () {
    const p = SPECS_DATA_BASE_DIRECTORY + "/contentTypes/content.cmpt";
    const tileDataBuffer = fs.readFileSync(p);
    expect(function () {
      TileFormats.readTileData(tileDataBuffer);
    }).toThrowError();
  });

  it("throws an error when trying to read composite tile data from a buffer that does not contain CMPT", function () {
    const p = SPECS_DATA_BASE_DIRECTORY + "/contentTypes/content.b3dm";
    const tileDataBuffer = fs.readFileSync(p);
    expect(function () {
      TileFormats.readCompositeTileData(tileDataBuffer);
    }).toThrowError();
  });

  it("creates the required default feature table JSON for B3DM", function () {
    const glbBuffer = Buffer.alloc(10);
    const tileData = TileFormats.createB3dmTileDataFromGlb(
      glbBuffer,
      undefined,
      undefined,
      undefined,
      undefined
    );

    expect(tileData.featureTable.json).toBeDefined();
    expect(tileData.featureTable.json.BATCH_LENGTH).toBe(0);
  });

  it("creates the required default feature table for I3DM", function () {
    const glbBuffer = Buffer.alloc(10);
    const tileData = TileFormats.createI3dmTileDataFromGlb(
      glbBuffer,
      undefined,
      undefined,
      undefined,
      undefined
    );

    expect(tileData.featureTable.json).toBeDefined();
    expect(tileData.featureTable.json.INSTANCES_LENGTH).toBe(1);
    expect(tileData.featureTable.json.POSITION).toBeDefined();
    expect(tileData.featureTable.binary).toBeDefined();
    expect(tileData.featureTable.binary.length).toBe(12);
  });

  //==========================================================================
  // Note: Some/most of the remaining tests have been ported from the
  // legacy state of the tests, with caveats:
  // - Some tests originally tested exact memory layouts.
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
  // This has been addressed in a hopefully reasonable way, with
  // some details being omitted here...

  it("creates a valid buffer from B3DM tile data", function () {
    const glbBuffer = Buffer.alloc(10);
    const tileData = TileFormats.createDefaultB3dmTileDataFromGlb(glbBuffer);
    const buffer = TileFormats.createTileDataBuffer(tileData);

    // Note: There are some assumptions here about the exact
    // format of the default feature table JSON that is
    // inserted. It COULD contain an arbitrary number of
    // spaces/indentation and would still be valid. In
    // any case, it will be padded to end at 8-byte boundary.
    // But it's probably reasonable to test what's there:
    const expectedByteLength = 64;
    const expectedFeatureTableJsonByteLength = 20;

    expect(buffer.toString("utf8", 0, 4)).toEqual("b3dm"); // magic
    expect(buffer.readUInt32LE(4)).toEqual(1); // version
    expect(buffer.readUInt32LE(8)).toEqual(expectedByteLength); // byteLength
    expect(buffer.readUInt32LE(12)).toEqual(expectedFeatureTableJsonByteLength); // featureTableJSONByteLength
    expect(buffer.readUInt32LE(16)).toEqual(0); // featureTableBinaryByteLength
    expect(buffer.readUInt32LE(20)).toEqual(0); // batchTableJSONByteLength
    expect(buffer.readUInt32LE(24)).toEqual(0); // batchTableBinaryByteLength
  });

  it("creates a valid buffer from I3DM tile data", function () {
    const glbBuffer = Buffer.alloc(10);
    const tileData = TileFormats.createDefaultI3dmTileDataFromGlb(glbBuffer);
    const buffer = TileFormats.createTileDataBuffer(tileData);

    // Note: There are some assumptions here about the exact
    // format of the default feature table JSON that is
    // inserted. It COULD contain an arbitrary number of
    // spaces/indentation and would still be valid. In
    // any case, it will be padded to end at 8-byte boundary.
    // But it's probably reasonable to test what's there:
    const expectedByteLength = 120;
    const expectedFeatureTableJsonByteLength = 56;
    const expectedFeatureTableBinaryByteLength = 16;

    expect(buffer.toString("utf8", 0, 4)).toEqual("i3dm"); // magic
    expect(buffer.readUInt32LE(4)).toEqual(1); // version
    expect(buffer.readUInt32LE(8)).toEqual(expectedByteLength); // byteLength
    expect(buffer.readUInt32LE(12)).toEqual(expectedFeatureTableJsonByteLength); // featureTableJSONByteLength
    expect(buffer.readUInt32LE(16)).toEqual(
      expectedFeatureTableBinaryByteLength
    ); // featureTableBinaryByteLength
    expect(buffer.readUInt32LE(20)).toEqual(0); // batchTableJSONByteLength
    expect(buffer.readUInt32LE(24)).toEqual(0); // batchTableBinaryByteLength
    expect(buffer.readUInt32LE(28)).toEqual(1); // gltfFormat (1=embedded GLB)
  });

  it("creates a valid buffer from CMPT tile data", function () {
    const glbBuffer = Buffer.alloc(10);
    const b3dmTileData =
      TileFormats.createDefaultB3dmTileDataFromGlb(glbBuffer);
    const i3dmTileData =
      TileFormats.createDefaultI3dmTileDataFromGlb(glbBuffer);

    const b3dmBuffer = TileFormats.createTileDataBuffer(b3dmTileData);
    const i3dmBuffer = TileFormats.createTileDataBuffer(i3dmTileData);
    const b3dmOriginalLength = b3dmBuffer.length;
    const i3dmOriginalLength = i3dmBuffer.length;

    const cmptTileData = TileFormats.createCompositeTileData([
      b3dmTileData,
      i3dmTileData,
    ]);
    const cmpt = TileFormats.createCompositeTileDataBuffer(cmptTileData);

    const magic = Buffers.getMagicString(cmpt);
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

    const b3dmMagic = Buffers.getMagicString(cmpt, headerByteLength);
    const b3dmByteLength = cmpt.readUInt32LE(headerByteLength + 8);
    expect(b3dmMagic).toBe("b3dm");
    expect(b3dmByteLength % 8 === 0).toBe(true); // b3dm is aligned

    const i3dmMagic = Buffers.getMagicString(
      cmpt,
      headerByteLength + b3dmByteLength
    );
    const i3dmByteLength = cmpt.readUInt32LE(
      headerByteLength + b3dmByteLength + 8
    );
    expect(i3dmMagic).toBe("i3dm");
    expect(i3dmByteLength % 8 === 0).toBe(true); // i3dm is aligned
  });

  it("extracts a b3dm from buffer", function () {
    // Ported from legacy tests
    const b3dmPath =
      SPECS_DATA_BASE_DIRECTORY + "/batchedWithBatchTableBinary.b3dm";
    const b3dmBuffer = fs.readFileSync(b3dmPath);
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

  it("extracts a b3dm and i3dm from composite buffer", function () {
    // Ported from legacy tests
    const compositePath = SPECS_DATA_BASE_DIRECTORY + "/composite.cmpt";
    const compositeBuffer = fs.readFileSync(compositePath);
    const compositeTileData =
      TileFormats.readCompositeTileData(compositeBuffer);
    const innerTiles = compositeTileData.innerTileBuffers;
    const b3dmMagic = innerTiles[0].toString("utf8", 0, 4);
    const i3dmMagic = innerTiles[1].toString("utf8", 0, 4);

    expect(innerTiles.length).toBe(2);
    expect(b3dmMagic).toBe("b3dm");
    expect(i3dmMagic).toBe("i3dm");
  });

  it("extracts a b3dm and i3dm from composite-of-composite buffer", function () {
    // Ported from legacy tests
    const compositeOfCompositePath =
      SPECS_DATA_BASE_DIRECTORY + "/compositeOfComposite.cmpt";
    const compositeOfCompositeBuffer = fs.readFileSync(
      compositeOfCompositePath
    );
    const compositeOfCompositeTileData = TileFormats.readCompositeTileData(
      compositeOfCompositeBuffer
    );
    const innerCompositeBuffer =
      compositeOfCompositeTileData.innerTileBuffers[0];
    const compositeTileData =
      TileFormats.readCompositeTileData(innerCompositeBuffer);
    const innerTiles = compositeTileData.innerTileBuffers;
    const b3dmMagic = innerTiles[0].toString("utf8", 0, 4);
    const i3dmMagic = innerTiles[1].toString("utf8", 0, 4);
    expect(innerTiles.length).toBe(2);
    expect(b3dmMagic).toBe("b3dm");
    expect(i3dmMagic).toBe("i3dm");
  });

  it("extracts a i3dm from buffer", function () {
    // Ported from legacy tests
    const i3dmPath =
      SPECS_DATA_BASE_DIRECTORY + "/instancedWithBatchTableBinary.i3dm";
    const i3dmBuffer = fs.readFileSync(i3dmPath);
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

  it("generates a basic b3dm header for a glb", function () {
    // Ported from legacy tests
    const glbPath =
      SPECS_DATA_BASE_DIRECTORY + "/CesiumTexturedBox/CesiumTexturedBox.glb";
    const glbBuffer = fs.readFileSync(glbPath);
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
    // Ported from legacy tests
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

    const glbPath =
      SPECS_DATA_BASE_DIRECTORY + "/CesiumTexturedBox/CesiumTexturedBox.glb";
    const glbBuffer = fs.readFileSync(glbPath);
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

  it("generates a basic i3dm header for a glb", function () {
    // Ported from legacy tests (as far as reasonably possible..)
    const glbPath =
      SPECS_DATA_BASE_DIRECTORY + "/CesiumTexturedBox/CesiumTexturedBox.glb";
    const glbBuffer = fs.readFileSync(glbPath);
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
    // Ported from legacy tests (as far as reasonably possible..)
    const glbPath =
      SPECS_DATA_BASE_DIRECTORY + "/CesiumTexturedBox/CesiumTexturedBox.glb";
    const glbBuffer = fs.readFileSync(glbPath);

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

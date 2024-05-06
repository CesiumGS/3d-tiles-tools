// Note: Most of the migrations are tested in the `TileFormatsMigrationSpec`,
// generically, independent of the input type, and by comparing the results
// to "golden" reference files.
// The tests here only focus on narrow aspects of the migration of B3DM.

import { Document } from "@gltf-transform/core";
import { Accessor } from "@gltf-transform/core";

import { GltfTransform } from "../../../src/tools";
import { TileFormatsMigrationB3dm } from "../../../src/tools";

import { TileFormats } from "../../../src/tilesets";

// Create a glTF-Transform document that only contains two mesh primitives
// that have the `_BATCHID` and `BATCHID` attributes that are specific
// for GLB in B3DM. The attributes will refer to the same accessors,
// and the migration should convert them into `_FEATURE_ID_` attributes
// without duplicating the accessor data. This is a regression test
// for https://github.com/CesiumGS/3d-tiles-tools/issues/123
async function createTileFormatsMigrationB3dmSpecDocument() {
  const document = new Document();
  const buffer = document.createBuffer();

  const mesh = document.createMesh();

  // Create two accessors that will be used as BATCHID
  // acccessors in numltiple primitives
  const accessor0 = document.createAccessor();
  accessor0.setBuffer(buffer);
  accessor0.setType(Accessor.Type.SCALAR);
  const ids0 = [0, 1, 0, 1, 0, 1, 0, 1, 0];
  accessor0.setArray(new Int16Array(ids0));

  const accessor1 = document.createAccessor();
  accessor1.setBuffer(buffer);
  accessor1.setType(Accessor.Type.SCALAR);
  const ids1 = [0, 1, 0, 1, 0, 1, 0, 1, 0];
  accessor1.setArray(new Int16Array(ids1));

  // Create 4 primitives:

  // The first two primitives refer to the first accessor, as
  // the  "_BATCHID" and the (legacy) "BATCHID" attribute
  const primitive0a = document.createPrimitive();
  primitive0a.setAttribute("_BATCHID", accessor0);
  mesh.addPrimitive(primitive0a);

  const primitive0b = document.createPrimitive();
  primitive0b.setAttribute("BATCHID", accessor0);
  mesh.addPrimitive(primitive0b);

  // The first two primitives refer to the second accessor, as
  // the  "_BATCHID" and the (legacy) "BATCHID" attribute
  const primitive1a = document.createPrimitive();
  primitive1a.setAttribute("_BATCHID", accessor1);
  mesh.addPrimitive(primitive1a);

  const primitive1b = document.createPrimitive();
  primitive1b.setAttribute("BATCHID", accessor1);
  mesh.addPrimitive(primitive1b);

  return document;
}

// Create the buffer with the data of a B3DM file that contains the
// GLB of the given glTF-Transform document as its payload, with
// a dummy feature table that has a batch length of 2 (to enforce
// taking the path that handles creating a property table)
async function createB3dmBuffer(document: Document) {
  const io = await GltfTransform.getIO();
  const inputGlbData = await io.writeBinary(document);
  const featureTableJson = {
    BATCH_LENGTH: 2,
  };
  const featureTableBinary = Buffer.alloc(0);
  const batchTableJson = {};
  const batchTableBinary = Buffer.alloc(0);

  const inputB3dmTileData = TileFormats.createB3dmTileDataFromGlb(
    Buffer.from(inputGlbData),
    featureTableJson,
    featureTableBinary,
    batchTableJson,
    batchTableBinary
  );
  const b3dmBuffer = TileFormats.createTileDataBuffer(inputB3dmTileData);
  return b3dmBuffer;
}

describe("TileFormatsMigrationB3dm", function () {
  it("does not duplicate data when converting batch IDs to feature IDs", async function () {
    const io = await GltfTransform.getIO();

    const inputDocument = await createTileFormatsMigrationB3dmSpecDocument();

    const inputJsonDocument = await io.writeJSON(inputDocument);
    const inputJson = inputJsonDocument.json;

    // Initially, there should be two accessors, and they should
    // be used as the _BATCHID and BATCHID attributes inside
    // the mesh primitives
    const actualInputNumAccessors = inputJson.accessors?.length;
    expect(actualInputNumAccessors).toBe(2);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const inputPrimitives = inputJson.meshes![0].primitives as any[];
    expect(inputPrimitives[0].attributes).toEqual({ _BATCHID: 0 });
    expect(inputPrimitives[1].attributes).toEqual({ BATCHID: 0 });
    expect(inputPrimitives[2].attributes).toEqual({ _BATCHID: 1 });
    expect(inputPrimitives[3].attributes).toEqual({ BATCHID: 1 });

    const b3dmBuffer = await createB3dmBuffer(inputDocument);
    const outputGlb = await TileFormatsMigrationB3dm.convertB3dmToGlb(
      b3dmBuffer
    );
    const outputDocument = await io.readBinary(outputGlb);

    const outputJsonDocument = await io.writeJSON(outputDocument);
    const outputJson = outputJsonDocument.json;

    // After the migration, there should STILL be only two accessors, and
    // they should be used as the _FEATURE_ID attributes inside the mesh
    // primitives

    const actualOutputNumAccessors = outputJson.accessors?.length;
    expect(actualOutputNumAccessors).toBe(2);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const outputPrimitives = outputJson.meshes![0].primitives as any[];
    expect(outputPrimitives[0].attributes).toEqual({ _FEATURE_ID_0: 0 });
    expect(outputPrimitives[1].attributes).toEqual({ _FEATURE_ID_0: 0 });
    expect(outputPrimitives[2].attributes).toEqual({ _FEATURE_ID_0: 1 });
    expect(outputPrimitives[3].attributes).toEqual({ _FEATURE_ID_0: 1 });
  });
});

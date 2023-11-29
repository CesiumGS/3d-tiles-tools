import fs from "fs";

import { GltfTransform } from "../../src/contentProcessing/GltfTransform.js";

const SPECS_DATA_BASE_DIRECTORY = "../../specs/data/";

describe("GltfTransform::getIO", function () {
  it("can read a GLB without compression", async function () {
    const glb = fs.readFileSync(SPECS_DATA_BASE_DIRECTORY + "gltf/Box.glb");
    const io = await GltfTransform.getIO();
    const document = await io.readBinary(glb);
    expect(document).toBeDefined();
  });
  it("can read a GLB with Draco compression", async function () {
    const glb = fs.readFileSync(
      SPECS_DATA_BASE_DIRECTORY + "gltf/BoxDraco.glb"
    );
    const io = await GltfTransform.getIO();
    const document = await io.readBinary(glb);
    expect(document).toBeDefined();
  });
  it("can read a GLB with meshopt compression", async function () {
    const glb = fs.readFileSync(
      SPECS_DATA_BASE_DIRECTORY + "gltf/BoxMeshopt.glb"
    );
    const io = await GltfTransform.getIO();
    const document = await io.readBinary(glb);
    expect(document).toBeDefined();
  });
});

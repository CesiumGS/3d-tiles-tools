import fs from "fs";

import { GltfTransform } from "../../src/contentProcessing/GltfTransform.js";

describe("GltfTransform::getIO", function () {
  it("can read a GLB without compression", async function () {
    const glb = fs.readFileSync("./specs/data/gltf/Box.glb");
    const io = await GltfTransform.getIO();
    const document = await io.readBinary(glb);
    expect(document).toBeDefined();
  });
  it("can read a GLB with Draco compression", async function () {
    const glb = fs.readFileSync("./specs/data/gltf/BoxDraco.glb");
    const io = await GltfTransform.getIO();
    const document = await io.readBinary(glb);
    expect(document).toBeDefined();
  });
  it("can read a GLB with meshopt compression", async function () {
    const glb = fs.readFileSync("./specs/data/gltf/BoxMeshopt.glb");
    const io = await GltfTransform.getIO();
    const document = await io.readBinary(glb);
    expect(document).toBeDefined();
  });
});

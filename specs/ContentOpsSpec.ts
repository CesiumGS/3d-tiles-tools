import fs from "fs";
import { Buffers } from "../src/base/Buffers";

import { ContentOps } from "../src/contentProcessing/ContentOps";
import { SpecHelpers } from "./SpecHelpers";

describe("ContentOps", function () {
  it("extracts a single GLB buffers from B3DM", async function () {
    const p = "./specs/data/contentTypes/content.b3dm";
    const tileDataBuffer = fs.readFileSync(p);

    const glbBuffers = await ContentOps.extractGlbBuffers(tileDataBuffer);
    expect(glbBuffers.length).toBe(1);
  });

  it("extracts multiple GLB buffers from CMPT", async function () {
    const p = "./specs/data/contentTypes/content.cmpt";
    const tileDataBuffer = fs.readFileSync(p);

    const glbBuffers = await ContentOps.extractGlbBuffers(tileDataBuffer);
    expect(glbBuffers.length).toBe(2);
  });

  it("extracts no GLB buffers from PNTS", async function () {
    const p = "./specs/data/contentTypes/content.pnts";
    const tileDataBuffer = fs.readFileSync(p);

    const glbBuffers = await ContentOps.extractGlbBuffers(tileDataBuffer);
    expect(glbBuffers.length).toBe(0);
  });
});

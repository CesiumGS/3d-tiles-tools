import fs from "fs";

import { Paths } from "@3d-tiles-tools/base";

import { TilesetOperations } from "../../src/tilesetProcessing/TilesetOperations.js";

import { SpecHelpers } from "@3d-tiles-tools/spec-helpers";

const basicInputs = [
  "./specs/data/mergeTilesets/basicMerge/TilesetA",
  "./specs/data/mergeTilesets/basicMerge/sub/TilesetA",
];
const basicOutput = "./specs/data/output/mergeTilesets/basicMerge";
const overwrite = true;

describe("TilesetMerger", function () {
  afterEach(function () {
    SpecHelpers.forceDeleteDirectory("./specs/data/output/mergeTilesets");
  });

  it("merges tilesets into a single tileset", async function () {
    await TilesetOperations.merge(basicInputs, basicOutput, overwrite);

    // Ensure that the output directory contains the expected files:
    // All files of the input, disambiguated for the same base name
    // (i.e. "TilesetA" and "TilesetA-0" - this is not specified,
    // but has to be assumed here)
    const actualRelativeFiles =
      SpecHelpers.collectRelativeFileNames(basicOutput);
    actualRelativeFiles.sort();
    const expectedRelativeFiles = [
      "TilesetA-0/ll.b3dm",
      "TilesetA-0/lr.b3dm",
      "TilesetA-0/parent.b3dm",
      "TilesetA-0/tileset.json",
      "TilesetA-0/ul.b3dm",
      "TilesetA-0/ur.b3dm",
      "TilesetA/ll.b3dm",
      "TilesetA/lr.b3dm",
      "TilesetA/parent.b3dm",
      "TilesetA/tileset.json",
      "TilesetA/ul.b3dm",
      "TilesetA/ur.b3dm",
      "tileset.json",
    ];
    expect(actualRelativeFiles).toEqual(expectedRelativeFiles);

    // Ensure that the single 'tileset.json' contains the
    // proper content URIs for the external tilesets:
    const tilesetJsonBuffer = fs.readFileSync(
      Paths.join(basicOutput, "tileset.json")
    );
    const tileset = JSON.parse(tilesetJsonBuffer.toString());
    const actualContentUris = await SpecHelpers.collectExplicitContentUris(
      tileset.root
    );
    actualContentUris.sort();

    const expectedContentUris = [
      "TilesetA-0/tileset.json",
      "TilesetA/tileset.json",
    ];
    expect(actualContentUris).toEqual(expectedContentUris);
  });
});

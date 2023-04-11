import fs from "fs";

import { Paths } from "../src/base/Paths";

import { Tilesets } from "../src/tilesets/Tilesets";

import { SpecHelpers } from "./SpecHelpers";

describe("TilesetMerger", function () {
  it("merges tilesets into a single tileset", async function () {
    const tilesetSourceNames = [
      "./specs/data/mergeTilesets/basicMerge/TilesetA/tileset.json",
      "./specs/data/mergeTilesets/basicMerge/sub/TilesetA/tileset.json",
    ];
    const tilesetTargetName = "./specs/data/output/mergeTilesets/basicMerge";
    const overwrite = true;

    await Tilesets.merge(tilesetSourceNames, tilesetTargetName, overwrite);

    // Ensure that the output directory contains the expected files:
    // All files of the input, disambiguated for the same base name
    // (i.e. "TilesetA" and "TilesetA-0" - this is not specified,
    // but has to be assumed here)
    const actualRelativeFiles =
      SpecHelpers.collectRelativeFileNames(tilesetTargetName);
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
      Paths.join(tilesetTargetName, "tileset.json")
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

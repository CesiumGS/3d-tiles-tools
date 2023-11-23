import fs from "fs";

import { Paths } from "../../src/base/Paths";

import { Tilesets } from "../../src/tilesets/Tilesets";

import { SpecHelpers } from "../SpecHelpers";

const basicInput = "./specs/data/combineTilesets/nestedExternal";
const basicOutput = "./specs/data/output/combineTilesets/nestedExternal";
const overwrite = true;

describe("TilesetCombiner", function () {
  afterEach(function () {
    SpecHelpers.forceDeleteDirectory("./specs/data/output/combineTilesets");
  });

  it("combines external tilesets into a single tileset", async function () {
    await Tilesets.combine(basicInput, basicOutput, overwrite);

    // Ensure that the output directory contains the expected files:
    // All files of the input, except for the external tileset JSON files
    const actualRelativeFiles =
      SpecHelpers.collectRelativeFileNames(basicOutput);
    actualRelativeFiles.sort();
    const expectedRelativeFiles = [
      "README.md",
      "sub0/sub01/tileD.b3dm",
      "sub0/tileC.b3dm",
      "sub1/sub10/tileF.b3dm",
      "sub1/tileE.b3dm",
      "tileA.b3dm",
      "tileB.b3dm",
      "tileset.json",
    ];
    expect(actualRelativeFiles).toEqual(expectedRelativeFiles);

    // Ensure that the single 'tileset.json' contains the
    // proper content URIs for the combined output
    const tilesetJsonBuffer = fs.readFileSync(
      Paths.join(basicOutput, "tileset.json")
    );
    const tileset = JSON.parse(tilesetJsonBuffer.toString());
    const actualContentUris = await SpecHelpers.collectExplicitContentUris(
      tileset.root
    );
    actualContentUris.sort();

    const expectedContentUris = [
      "sub0/sub01/tileD.b3dm",
      "sub0/tileC.b3dm",
      "sub1/sub10/tileF.b3dm",
      "sub1/tileE.b3dm",
      "tileA.b3dm",
      "tileB.b3dm",
    ];
    expect(actualContentUris).toEqual(expectedContentUris);
  });
});

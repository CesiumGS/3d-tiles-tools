import fs from "fs";

import { Tilesets } from "../../src/tilesets/Tilesets";
import { SpecHelpers } from "./SpecHelpers";

const tilesetDirectory = "./specs/data/TilesetOfTilesetsWithUris/";
const combinedDirectory =
  "./specs/data/output/TilesetOfTilesetsWithUris-combined";
const combinedJson =
  "./specs/data/output/TilesetOfTilesetsWithUris-combined/tileset.json";

describe("combineTileset", function () {
  afterEach(async function () {
    //SpecHelpers.forceDeleteDirectory(combinedDirectory);
  });

  it("combines external tilesets into a single tileset", async function () {
    const overwrite = true;
    await Tilesets.combine(tilesetDirectory, combinedDirectory, overwrite);

    const numberOfTilesets = SpecHelpers.getNumberOfTilesets(combinedDirectory);

    const combinedJsonBuffer = fs.readFileSync(combinedJson);
    const combinedJsonString = combinedJsonBuffer.toString();
    const contentUris = SpecHelpers.getContentUris(combinedJsonString);

    expect(numberOfTilesets).toBe(1);
    expect(contentUris).toEqual([
      "parent.b3dm",
      "tileset3/ll.b3dm",
      "lr.b3dm",
      "ur.b3dm",
      "ul.b3dm",
    ]);
  });
});

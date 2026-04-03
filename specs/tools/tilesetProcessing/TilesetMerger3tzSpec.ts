import fs from "fs";

import { Paths } from "../../../src/base";

import { TilesetOperations } from "../../../src/tools";

import { SpecHelpers } from "../../SpecHelpers";

const SPECS_DATA_BASE_DIRECTORY = SpecHelpers.getSpecsDataBaseDirectory();
const overwrite = true;

fdescribe("TilesetMerger3tz", function () {
  afterEach(function () {
    SpecHelpers.forceDeleteDirectory(
      Paths.join(SPECS_DATA_BASE_DIRECTORY, "output/mergeTilesets")
    );
  });
  it("mergeJson3tz merges 3TZ files into a single tileset JSON", async function () {
    const tilesetSourceNames = [
      Paths.join(
        SPECS_DATA_BASE_DIRECTORY,
        "mergeTilesets/mergeJson3tz/tilesetA.3tz"
      ),
      Paths.join(
        SPECS_DATA_BASE_DIRECTORY,
        "mergeTilesets/mergeJson3tz/tilesetB.3tz"
      ),
      Paths.join(
        SPECS_DATA_BASE_DIRECTORY,
        "mergeTilesets/mergeJson3tz/tilesetC.3tz"
      ),
      Paths.join(
        SPECS_DATA_BASE_DIRECTORY,
        "mergeTilesets/mergeJson3tz/tilesetD.3tz"
      ),
    ];
    const tilesetTargetName = Paths.join(
      SPECS_DATA_BASE_DIRECTORY,
      "output/mergeTilesets/mergeJson3tz/tileset.json"
    );

    await TilesetOperations.mergeJson3tz(
      tilesetSourceNames,
      tilesetTargetName,
      overwrite
    );

    // Ensure that the single 'tileset.json' contains the
    // proper content URIs for the external tilesets:
    const tilesetJsonBuffer = fs.readFileSync(tilesetTargetName);
    const tileset = JSON.parse(tilesetJsonBuffer.toString());
    const actualContentUris = await SpecHelpers.collectExplicitContentUris(
      tileset.root
    );
    actualContentUris.sort();

    const expectedContentUris = [
      "../../../mergeTilesets/mergeJson3tz/tilesetA.3tz",
      "../../../mergeTilesets/mergeJson3tz/tilesetB.3tz",
      "../../../mergeTilesets/mergeJson3tz/tilesetC.3tz",
      "../../../mergeTilesets/mergeJson3tz/tilesetD.3tz",
    ];
    expect(actualContentUris).toEqual(expectedContentUris);
  });

  it("mergeJson3tz merges 3TZ files that are found in a directory into a single tileset JSON", async function () {
    const tilesetSourceNames = [
      Paths.join(SPECS_DATA_BASE_DIRECTORY, "mergeTilesets/mergeJson3tz/"),
    ];
    const tilesetTargetName = Paths.join(
      SPECS_DATA_BASE_DIRECTORY,
      "output/mergeTilesets/mergeJson3tz/tileset.json"
    );

    await TilesetOperations.mergeJson3tz(
      tilesetSourceNames,
      tilesetTargetName,
      overwrite
    );

    // Ensure that the single 'tileset.json' contains the
    // proper content URIs for the external tilesets:
    const tilesetJsonBuffer = fs.readFileSync(tilesetTargetName);
    const tileset = JSON.parse(tilesetJsonBuffer.toString());
    const actualContentUris = await SpecHelpers.collectExplicitContentUris(
      tileset.root
    );
    actualContentUris.sort();

    const expectedContentUris = [
      "../../../mergeTilesets/mergeJson3tz/tilesetA.3tz",
      "../../../mergeTilesets/mergeJson3tz/tilesetB.3tz",
      "../../../mergeTilesets/mergeJson3tz/tilesetC.3tz",
      "../../../mergeTilesets/mergeJson3tz/tilesetD.3tz",
    ];
    expect(actualContentUris).toEqual(expectedContentUris);
  });
});

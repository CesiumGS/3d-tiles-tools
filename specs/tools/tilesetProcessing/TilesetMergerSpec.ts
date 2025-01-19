import fs from "fs";

import { Paths } from "../../../src/base";

import { TilesetOperations } from "../../../src/tools";

import { SpecHelpers } from "../../SpecHelpers";

const SPECS_DATA_BASE_DIRECTORY = SpecHelpers.getSpecsDataBaseDirectory();
const overwrite = true;

describe("TilesetMerger", function () {
  afterEach(function () {
    SpecHelpers.forceDeleteDirectory(
      Paths.join(SPECS_DATA_BASE_DIRECTORY, "output/mergeTilesets")
    );
  });
  it("merges tilesets from directories into a single tileset directory", async function () {
    const inputDirectories = [
      Paths.join(
        SPECS_DATA_BASE_DIRECTORY,
        "mergeTilesets/basicMerge/TilesetA"
      ),
      Paths.join(
        SPECS_DATA_BASE_DIRECTORY,
        "mergeTilesets/basicMerge/sub/TilesetA"
      ),
    ];
    const outputDirectory = Paths.join(
      SPECS_DATA_BASE_DIRECTORY,
      "output/mergeTilesets/basicMerge"
    );
    const outputFile = Paths.join(outputDirectory, "tileset.json");

    await TilesetOperations.merge(inputDirectories, outputDirectory, overwrite);

    // Ensure that the output directory contains the expected files:
    // All files of the input, disambiguated for the same base name
    // (i.e. "TilesetA" and "TilesetA-0" - this is not specified,
    // but has to be assumed here)
    const actualRelativeFiles =
      SpecHelpers.collectRelativeFileNames(outputDirectory);
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
    const tilesetJsonBuffer = fs.readFileSync(outputFile);
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

  it("merges tilesets from files into a single tileset file", async function () {
    const inputFiles = [
      Paths.join(
        SPECS_DATA_BASE_DIRECTORY,
        "mergeTilesets/basicMerge/TilesetA/tileset.json"
      ),
      Paths.join(
        SPECS_DATA_BASE_DIRECTORY,
        "mergeTilesets/basicMerge/sub/TilesetA/tileset.json"
      ),
    ];
    const outputDirectory = Paths.join(
      SPECS_DATA_BASE_DIRECTORY,
      "output/mergeTilesets/basicMerge"
    );
    const outputFile = Paths.join(outputDirectory, "tileset.json");

    await TilesetOperations.merge(inputFiles, outputFile, overwrite);

    // Ensure that the output directory contains the expected files:
    // All files of the input, disambiguated for the same base name
    // (i.e. "TilesetA" and "TilesetA-0" - this is not specified,
    // but has to be assumed here)
    const actualRelativeFiles =
      SpecHelpers.collectRelativeFileNames(outputDirectory);
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
    const tilesetJsonBuffer = fs.readFileSync(outputFile);
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

  it("merges tilesets from directories into a single tileset in a directory for mergeJson", async function () {
    const inputDirectories = [
      Paths.join(
        SPECS_DATA_BASE_DIRECTORY,
        "mergeTilesets/basicMerge/TilesetA"
      ),
      Paths.join(
        SPECS_DATA_BASE_DIRECTORY,
        "mergeTilesets/basicMerge/sub/TilesetA"
      ),
    ];
    const outputDirectory = Paths.join(
      SPECS_DATA_BASE_DIRECTORY,
      "output/mergeTilesets/basicMerge"
    );
    const outputFile = Paths.join(outputDirectory, "tileset.json");

    await TilesetOperations.mergeJson(
      inputDirectories,
      outputDirectory,
      overwrite
    );

    // Ensure that the output directory contains the expected files:
    const actualRelativeFiles =
      SpecHelpers.collectRelativeFileNames(outputDirectory);
    actualRelativeFiles.sort();
    const expectedRelativeFiles = ["tileset.json"];
    expect(actualRelativeFiles).toEqual(expectedRelativeFiles);

    // Ensure that the single 'tileset.json' contains the
    // proper content URIs for the external tilesets:
    const tilesetJsonBuffer = fs.readFileSync(outputFile);
    const tileset = JSON.parse(tilesetJsonBuffer.toString());
    const actualContentUris = await SpecHelpers.collectExplicitContentUris(
      tileset.root
    );
    actualContentUris.sort();

    const expectedContentUris = [
      "../../../mergeTilesets/basicMerge/TilesetA/tileset.json",
      "../../../mergeTilesets/basicMerge/sub/TilesetA/tileset.json",
    ];
    expect(actualContentUris).toEqual(expectedContentUris);
  });

  it("merges tilesets from files into a single tileset file for mergeJson", async function () {
    const inputFiles = [
      Paths.join(
        SPECS_DATA_BASE_DIRECTORY,
        "mergeTilesets/basicMerge/TilesetA/tileset.json"
      ),
      Paths.join(
        SPECS_DATA_BASE_DIRECTORY,
        "mergeTilesets/basicMerge/sub/TilesetA/tileset.json"
      ),
    ];
    const outputDirectory = Paths.join(
      SPECS_DATA_BASE_DIRECTORY,
      "output/mergeTilesets/basicMerge"
    );
    const outputFile = Paths.join(outputDirectory, "tileset.json");

    await TilesetOperations.mergeJson(inputFiles, outputFile, overwrite);

    // Ensure that the output directory contains the expected files:
    const actualRelativeFiles =
      SpecHelpers.collectRelativeFileNames(outputDirectory);
    actualRelativeFiles.sort();
    const expectedRelativeFiles = ["tileset.json"];
    expect(actualRelativeFiles).toEqual(expectedRelativeFiles);

    // Ensure that the single 'tileset.json' contains the
    // proper content URIs for the external tilesets:
    const tilesetJsonBuffer = fs.readFileSync(outputFile);
    const tileset = JSON.parse(tilesetJsonBuffer.toString());
    const actualContentUris = await SpecHelpers.collectExplicitContentUris(
      tileset.root
    );
    actualContentUris.sort();

    const expectedContentUris = [
      "../../../mergeTilesets/basicMerge/TilesetA/tileset.json",
      "../../../mergeTilesets/basicMerge/sub/TilesetA/tileset.json",
    ];
    expect(actualContentUris).toEqual(expectedContentUris);
  });

  it("merges two implicit tilesets into a valid output tileset", async function () {
    // Regression test for https://github.com/CesiumGS/3d-tiles-tools/issues/157
    // The input tileset is the 'dummy' implicit tileset that is used for other
    // specs, and it is used TWICE - this doesn't make sense, but serves the
    // purpose a spec for merging two implicit tilesets
    const inputFiles = [
      Paths.join(
        SPECS_DATA_BASE_DIRECTORY,
        "/tilesetProcessing/implicitProcessing"
      ),
      Paths.join(
        SPECS_DATA_BASE_DIRECTORY,
        "/tilesetProcessing/implicitProcessing"
      ),
    ];
    const outputDirectory = Paths.join(
      SPECS_DATA_BASE_DIRECTORY,
      "output/mergeTilesets/mergeImplicit"
    );
    const outputFile = Paths.join(outputDirectory, "tileset.json");

    await TilesetOperations.mergeJson(inputFiles, outputFile, overwrite);

    // Ensure that the output directory contains the tileset JSON
    const actualRelativeFiles =
      SpecHelpers.collectRelativeFileNames(outputDirectory);
    expect(actualRelativeFiles.includes("tileset.json")).toBeTrue();

    // Ensure that the root of the resulting tileset has two children,
    // and none of them defines the 'implicitTiling' (because this is
    // defined in the roots of the external tilesets)
    const tilesetJsonBuffer = fs.readFileSync(outputFile);
    const tileset = JSON.parse(tilesetJsonBuffer.toString());
    const root = tileset.root;
    const children = root.children;
    expect(children.length).toBe(2);
    expect(children[0].implicitTiling).toBeUndefined();
    expect(children[1].implicitTiling).toBeUndefined();
  });
});

import fs from "fs";

import { Paths } from "../../../src/base";

import { TilesetOperations } from "../../../src/tools";

import { SpecHelpers } from "../../SpecHelpers";

const SPECS_DATA_BASE_DIRECTORY = SpecHelpers.getSpecsDataBaseDirectory();
const INPUT_BASE_DIRECTORY = SPECS_DATA_BASE_DIRECTORY + "/combineTilesets/";
const OUTPUT_BASE_DIRECTORY =
  SPECS_DATA_BASE_DIRECTORY + "/output/combineTilesets/";
const overwrite = true;

describe("TilesetCombiner", function () {
  afterEach(function () {
    SpecHelpers.forceDeleteDirectory(
      SPECS_DATA_BASE_DIRECTORY + "/output/combineTilesets"
    );
  });

  it("combines external tilesets into a single tileset in nestedExternal", async function () {
    const testDirectoryName = "nestedExternal";
    const input = INPUT_BASE_DIRECTORY + testDirectoryName;
    const output = OUTPUT_BASE_DIRECTORY + testDirectoryName;

    await TilesetOperations.combine(input, output, overwrite);

    // Ensure that the output directory contains the expected files:
    // All files of the input, except for the external tileset JSON files
    const actualRelativeFiles = SpecHelpers.collectRelativeFileNames(output);
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
      Paths.join(output, "tileset.json")
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

  it("retains the transforms of root nodes of external tilesets in externalsWithTransform", async function () {
    const testDirectoryName = "externalsWithTransform";
    const input = INPUT_BASE_DIRECTORY + testDirectoryName;
    const output = OUTPUT_BASE_DIRECTORY + testDirectoryName;

    await TilesetOperations.combine(input, output, overwrite);

    // Ensure that the resulting tileset JSON contains the
    // proper content transforms and bounding volumes
    const tilesetJsonBuffer = fs.readFileSync(
      Paths.join(output, "tileset.json")
    );
    const tileset = JSON.parse(tilesetJsonBuffer.toString());

    // The expected bounding box for the root is
    // the bounding box of (0,0,0)-(4,5,6)
    const expectedRootBox = [2, 1.5, 3, 2, 0, 0, 0, -2.5, 0, 0, 0, 3];
    const rootBox = tileset.root.boundingVolume.box;
    expect(rootBox).toEqual(expectedRootBox);

    // The expected bounding box for each child is the unit
    // cube (it will be transformed into place by the
    // transform of the children!
    const expectedChildBox = [0.5, -0.5, 0.5, 0.5, 0, 0, 0, -0.5, 0, 0, 0, 0.5];

    const childBox0 = tileset.root.children[0].boundingVolume.box;
    const childBox1 = tileset.root.children[1].boundingVolume.box;
    const childBox2 = tileset.root.children[2].boundingVolume.box;
    expect(childBox0).toEqual(expectedChildBox);
    expect(childBox1).toEqual(expectedChildBox);
    expect(childBox2).toEqual(expectedChildBox);

    // The transforms of the nodes of the children that are created for the
    // external tilesets are expected to be their original transforms, namely,
    // - a translation of x=3 for the red cube
    // - a translation of y=4 for the green cube
    // - a translation of z=5 for the blue cube
    const expectedTransformR = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 3, 0, 0, 1];
    const childTransformR = tileset.root.children[0].transform;
    expect(childTransformR).toEqual(expectedTransformR);

    const expectedTransformG = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 4, 0, 1];
    const childTransformG = tileset.root.children[1].transform;
    expect(childTransformG).toEqual(expectedTransformG);

    const expectedTransformB = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 5, 1];
    const childTransformB = tileset.root.children[2].transform;
    expect(childTransformB).toEqual(expectedTransformB);
  });

  it("generates proper content URIs for externalInSameDirectory", async function () {
    const testDirectoryName = "externalInSameDirectory";
    const input = INPUT_BASE_DIRECTORY + testDirectoryName;
    const output = OUTPUT_BASE_DIRECTORY + testDirectoryName;

    await TilesetOperations.combine(input, output, overwrite);

    // Ensure that the output directory contains the expected files:
    // All files of the input, except for the external tileset JSON files
    const actualRelativeFiles = SpecHelpers.collectRelativeFileNames(output);
    actualRelativeFiles.sort();
    const expectedRelativeFiles = [
      "README.md",
      "sub0/tileA.b3dm",
      "sub0/tileB.b3dm",
      "tileset.json",
    ];
    expect(actualRelativeFiles).toEqual(expectedRelativeFiles);

    // Ensure that the single 'tileset.json' contains the
    // proper content URIs for the combined output
    const tilesetJsonBuffer = fs.readFileSync(
      Paths.join(output, "tileset.json")
    );
    const tileset = JSON.parse(tilesetJsonBuffer.toString());
    const actualContentUris = await SpecHelpers.collectExplicitContentUris(
      tileset.root
    );
    actualContentUris.sort();

    const expectedContentUris = ["sub0/tileA.b3dm", "sub0/tileB.b3dm"];
    expect(actualContentUris).toEqual(expectedContentUris);
  });

  it("handles multiple contents with external tilesets in externalMultipleContents", async function () {
    const testDirectoryName = "externalMultipleContents";
    const input = INPUT_BASE_DIRECTORY + testDirectoryName;
    const output = OUTPUT_BASE_DIRECTORY + testDirectoryName;

    await TilesetOperations.combine(input, output, overwrite);

    // Ensure that the output directory contains the expected files:
    // All files of the input, except for the external tileset JSON files
    const actualRelativeFiles = SpecHelpers.collectRelativeFileNames(output);
    actualRelativeFiles.sort();
    const expectedRelativeFiles = [
      "README.md",
      "subA/tileA0.b3dm",
      "subA/tileA1.b3dm",
      "subB/tileB0x.b3dm",
      "subB/tileB0y.b3dm",
      "tile.b3dm",
      "tileset.json",
    ];
    expect(actualRelativeFiles).toEqual(expectedRelativeFiles);

    // Ensure that the single 'tileset.json' contains the
    // proper content URIs for the combined output
    const tilesetJsonBuffer = fs.readFileSync(
      Paths.join(output, "tileset.json")
    );
    const tileset = JSON.parse(tilesetJsonBuffer.toString());
    const actualContentUris = await SpecHelpers.collectExplicitContentUris(
      tileset.root
    );
    actualContentUris.sort();

    const expectedContentUris = [
      "subA/tileA0.b3dm",
      "subA/tileA1.b3dm",
      "subB/tileB0x.b3dm",
      "subB/tileB0y.b3dm",
      "tile.b3dm",
    ];
    expect(actualContentUris).toEqual(expectedContentUris);
  });
});

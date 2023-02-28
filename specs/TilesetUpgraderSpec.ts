/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { TilesetUpgrader } from "../src/tilesetProcessing/TilesetUpgrader";

import { Tileset } from "../src/structure/Tileset";

// By default, the `TilesetUpgrader` will log messages for
// each modification (upgrade step) to the console.
// This flag can be used to disable the log messages:
const quiet = true;

// A unit bounding box, used for all tiles
const unitBoundingBox = {
  box: [0.5, 0.5, 0.5, 0.5, 0.0, 0.0, 0.0, 0.5, 0.0, 0.0, 0.0, 0.5],
};

// An input tileset for the upgrader, with the following
// elements requiring an update:
// - The `asset.version` should become 1.1
// - The `refine` value must be given in uppercase
// - The `content.url` must be a `content.uri`
//   (checked for both `content` and `contents`)
const inputTilesetJsonRaw: unknown = {
  asset: {
    version: "0.0",
  },
  geometricError: 2.0,
  root: {
    boundingVolume: unitBoundingBox,
    refine: "replace",
    geometricError: 1.0,
    content: {
      url: "example.url",
    },
    children: [
      {
        boundingVolume: unitBoundingBox,
        refine: "add",
        geometricError: 1.0,
        contents: [
          {
            url: "exampleA.url",
          },
          {
            url: "exampleB.url",
          },
        ],
      },
      {
        boundingVolume: unitBoundingBox,
        geometricError: 1.0,
      },
    ],
  },
};
const inputTilesetJsonString = JSON.stringify(inputTilesetJsonRaw);

describe("TilesetUpgrader", function () {
  it("upgrades the version number to 1.1", async function () {
    const tilesetUpgrader = new TilesetUpgrader(quiet);

    const tileset = JSON.parse(inputTilesetJsonString) as Tileset;
    await tilesetUpgrader.upgradeTileset(tileset);
    expect(tileset.asset.version).toBe("1.1");
  });

  it("upgrades the content.url to content.uri", async function () {
    const tilesetUpgrader = new TilesetUpgrader(quiet);

    const tileset = JSON.parse(inputTilesetJsonString) as Tileset;
    await tilesetUpgrader.upgradeTileset(tileset);

    expect(tileset.root.content!.uri).toBe("example.url");
    expect(tileset.root.children![0].contents![0].uri).toBe("exampleA.url");
    expect(tileset.root.children![0].contents![1].uri).toBe("exampleB.url");
  });

  it("upgrades the refine values to be in uppercase", async function () {
    const tilesetUpgrader = new TilesetUpgrader(quiet);

    const tileset = JSON.parse(inputTilesetJsonString) as Tileset;
    await tilesetUpgrader.upgradeTileset(tileset);

    expect(tileset.root.refine).toBe("REPLACE");
    expect(tileset.root.children![0].refine).toBe("ADD");
    expect(tileset.root.children![1].refine).toBeUndefined();
  });
});

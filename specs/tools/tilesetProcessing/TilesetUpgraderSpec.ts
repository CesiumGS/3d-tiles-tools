/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { TilesetUpgrader } from "../../../src/tools";

import { Tileset } from "../../../src/structure";

const gltfUpgradeOptions = undefined;

// A unit bounding box, used for all tiles
const unitBoundingBox = {
  box: [0.5, 0.5, 0.5, 0.5, 0.0, 0.0, 0.0, 0.5, 0.0, 0.0, 0.0, 0.5],
};

// An input tileset for the upgrader, with the following
// elements requiring an update:
// - The `asset.version` should become 1.1 (or 1.0)
// - The `refine` value must be given in uppercase
// - The `content.url` must be a `content.uri`
//   (checked for both `content` and `contents`)
// - The `extensionsUsed` and `extensionsRequired` should no
//   longer contain `3DTILES_content_gltf`
// - One tile has an empty 'children' array that should
//   be removed
const inputTilesetJsonRaw: unknown = {
  asset: {
    version: "0.0",
  },
  extensionsUsed: [
    "3DTILES_content_gltf",
    "EXAMPLE_extension_A",
    "EXAMPLE_extension_B",
  ],
  extensionsRequired: ["3DTILES_content_gltf", "EXAMPLE_extension_A"],
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
      {
        boundingVolume: unitBoundingBox,
        geometricError: 1.0,
        children: [],
      },
    ],
  },
};
const inputTilesetJsonString = JSON.stringify(inputTilesetJsonRaw);

describe("TilesetUpgrader", function () {
  it("upgrades the version number to 1.1", async function () {
    const targetVersion = "1.1";
    const tilesetUpgrader = new TilesetUpgrader(
      targetVersion,
      gltfUpgradeOptions
    );

    const tileset = JSON.parse(inputTilesetJsonString) as Tileset;
    await tilesetUpgrader.upgradeTileset(tileset);
    expect(tileset.asset.version).toBe("1.1");
  });

  it("upgrades the content.url to content.uri", async function () {
    const targetVersion = "1.0";
    const tilesetUpgrader = new TilesetUpgrader(
      targetVersion,
      gltfUpgradeOptions
    );

    const tileset = JSON.parse(inputTilesetJsonString) as Tileset;
    await tilesetUpgrader.upgradeTileset(tileset);

    expect(tileset.root.content!.uri).toBe("example.url");
    expect(tileset.root.children![0].contents![0].uri).toBe("exampleA.url");
    expect(tileset.root.children![0].contents![1].uri).toBe("exampleB.url");
  });

  it("upgrades the refine values to be in uppercase", async function () {
    const targetVersion = "1.0";
    const tilesetUpgrader = new TilesetUpgrader(
      targetVersion,
      gltfUpgradeOptions
    );

    const tileset = JSON.parse(inputTilesetJsonString) as Tileset;
    await tilesetUpgrader.upgradeTileset(tileset);

    expect(tileset.root.refine).toBe("REPLACE");
    expect(tileset.root.children![0].refine).toBe("ADD");
    expect(tileset.root.children![1].refine).toBeUndefined();
  });

  it("removes the unnecessary extension declaration for 3DTILES_content_gltf", async function () {
    const targetVersion = "1.1";
    const tilesetUpgrader = new TilesetUpgrader(
      targetVersion,
      gltfUpgradeOptions
    );

    const tileset = JSON.parse(inputTilesetJsonString) as Tileset;
    await tilesetUpgrader.upgradeTileset(tileset);

    expect(tileset.extensionsUsed).not.toContain("3DTILES_content_gltf");
    expect(tileset.extensionsRequired).not.toContain("3DTILES_content_gltf");
  });

  it("removes an empty 'children' array", async function () {
    const targetVersion = "1.1";
    const tilesetUpgrader = new TilesetUpgrader(
      targetVersion,
      gltfUpgradeOptions
    );

    const tileset = JSON.parse(inputTilesetJsonString) as Tileset;
    await tilesetUpgrader.upgradeTileset(tileset);

    expect(tileset.root.children![2].children).toBeUndefined();
  });
});

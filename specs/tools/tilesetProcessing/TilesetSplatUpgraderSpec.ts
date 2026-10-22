// A unit bounding box, used for all tiles
import { TilesetSplatUpgrader } from "../../../src/tools/tilesetProcessing/TilesetSplatUpgrader";
import { Tileset } from "../../../src";

const unitBoundingBox = {
  box: [0.5, 0.5, 0.5, 0.5, 0.0, 0.0, 0.0, 0.5, 0.0, 0.0, 0.0, 0.5],
};

const legacySplatTilesetJsonRaw: unknown = {
  asset: {
    version: "1.1",
  },
  extensions: {
    "3DTILES_content_gltf": {
      extensionsRequired: ["KHR_spz_gaussian_splats_compression"],
      extensionsUsed: ["KHR_spz_gaussian_splats_compression"],
    },
  },
  extensionsUsed: ["3DTILES_content_gltf"],
  geometricError: 1.0,
  root: {
    boundingVolume: unitBoundingBox,
    children: [
      {
        boundingVolume: unitBoundingBox,
        geometricError: 1.0,
      },
    ],
    geometricError: 1.0,
    refine: "REPLACE",
  },
};
const legacySplatTilesetJsonString = JSON.stringify(legacySplatTilesetJsonRaw);

describe("TilesetSplatUpgrader", function () {
  it("upgrades the 3DTILES_content_gltf required and used properties", async function () {
    const tilesetSplatUpgrader = new TilesetSplatUpgrader();

    const tileset = JSON.parse(legacySplatTilesetJsonString) as Tileset;
    await tilesetSplatUpgrader.upgradeTileset(tileset);

    const contentGltfExt = tileset.extensions?.["3DTILES_content_gltf"];
    expect(contentGltfExt?.extensionsRequired).toContain(
      "KHR_gaussian_splatting"
    );
    expect(contentGltfExt?.extensionsUsed).toContain(
      "KHR_gaussian_splatting_compression_spz_2"
    );
  });
});

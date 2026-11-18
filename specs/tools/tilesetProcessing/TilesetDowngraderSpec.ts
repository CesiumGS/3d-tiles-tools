import { Tileset } from "../../../src/structure";

import { DowngradeError } from "../../../src/tools";
import { TilesetDowngrader } from "../../../src/tools";

function createTileset11(): Tileset {
  return {
    asset: { version: "1.1" },
    geometricError: 100,
    schema: { id: "s", classes: {} },
    statistics: {},
    groups: [{ class: "g" }],
    metadata: { class: "t" },
    extensionsUsed: ["3DTILES_implicit_tiling", "3DTILES_metadata", "KEEP_ME"],
    extensionsRequired: ["3DTILES_implicit_tiling"],
    root: {
      boundingVolume: { box: [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1] },
      geometricError: 10,
      refine: "ADD",
      metadata: { class: "t" },
      contents: [{ uri: "a.glb", group: 0, metadata: { class: "c" } }],
      children: [
        {
          boundingVolume: { box: [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1] },
          geometricError: 1,
          content: { uri: "sub/b.glb" },
        },
      ],
    },
  } as Tileset;
}

describe("TilesetDowngrader", function () {
  describe("downgradeTo10", function () {
    it("removes metadata and collapses single contents", function () {
      const tileset = createTileset11();
      TilesetDowngrader.downgradeTo10(tileset, (uri) =>
        uri.replace(/\.glb$/, ".b3dm")
      );
      expect(tileset.asset.version).toBe("1.0");
      expect(tileset.schema).toBeUndefined();
      expect(tileset.statistics).toBeUndefined();
      expect(tileset.groups).toBeUndefined();
      expect(tileset.metadata).toBeUndefined();

      const root = tileset.root;
      expect(root.metadata).toBeUndefined();
      expect(root.contents).toBeUndefined();
      expect(root.content).toEqual({ uri: "a.b3dm" });
      const child = root.children?.[0];
      expect(child?.content?.uri).toBe("sub/b.b3dm");
    });

    it("removes 1.1 extension declarations but keeps others", function () {
      const tileset = createTileset11();
      TilesetDowngrader.downgradeTo10(tileset, (uri) => uri);
      expect(tileset.extensionsUsed).toEqual(["KEEP_ME"]);
      expect(tileset.extensionsRequired).toBeUndefined();
    });

    it("converts S2 bounding volumes to regions", function () {
      const tileset = createTileset11();
      tileset.extensionsUsed = ["3DTILES_bounding_volume_S2"];
      tileset.root.children![0].boundingVolume = {
        extensions: {
          "3DTILES_bounding_volume_S2": {
            token: "1",
            minimumHeight: 0,
            maximumHeight: 1,
          },
        },
      };
      TilesetDowngrader.downgradeTo10(tileset, (uri) => uri);
      const bv = tileset.root.children![0].boundingVolume;
      expect(bv.region).toBeDefined();
      expect(bv.extensions).toBeUndefined();
      expect(tileset.extensionsUsed).toBeUndefined();
    });

    it("keeps extension declarations that are still used", function () {
      const tileset = createTileset11();
      tileset.extensionsUsed = ["SOME_OTHER_EXTENSION"];
      tileset.root.children![0].boundingVolume.extensions = {
        SOME_OTHER_EXTENSION: {},
      };
      TilesetDowngrader.downgradeTo10(tileset, (uri) => uri);
      expect(tileset.extensionsUsed).toEqual(["SOME_OTHER_EXTENSION"]);
    });

    it("adds a root refine value when it is missing", function () {
      const tileset = createTileset11();
      delete tileset.root.refine;
      TilesetDowngrader.downgradeTo10(tileset, (uri) => uri);
      expect(tileset.root.refine as string | undefined).toBe("REPLACE");
    });

    it("rejects tiles with multiple contents", function () {
      const tileset = createTileset11();
      tileset.root.contents = [{ uri: "a.glb" }, { uri: "b.glb" }];
      expect(() =>
        TilesetDowngrader.downgradeTo10(tileset, (uri) => uri)
      ).toThrowError(DowngradeError);
    });
  });

  describe("finalize11", function () {
    it("keeps metadata and removes the implicit tiling declaration", function () {
      const tileset = createTileset11();
      TilesetDowngrader.finalize11(tileset);
      expect(tileset.asset.version).toBe("1.1");
      expect(tileset.schema).toBeDefined();
      expect(tileset.root.metadata).toBeDefined();
      expect(tileset.extensionsUsed).toEqual(["3DTILES_metadata", "KEEP_ME"]);
      expect(tileset.extensionsRequired).toBeUndefined();
      // A single-element contents array is simplified to content
      expect(tileset.root.contents).toBeUndefined();
      expect(tileset.root.content?.uri).toBe("a.glb");
    });

    it("drops a schema that no remaining metadata entity refers to", function () {
      const tileset = createTileset11();
      delete tileset.metadata;
      delete tileset.groups;
      delete tileset.root.metadata;
      delete tileset.root.contents?.[0].metadata;
      TilesetDowngrader.finalize11(tileset);
      expect(tileset.schema).toBeUndefined();
      expect(tileset.statistics).toBeUndefined();
    });
  });

  describe("removeBoundingVolumeSemantics", function () {
    it("removes stale TILE_BOUNDING_BOX properties and empty entities", function () {
      const tileset = createTileset11();
      tileset.schema = {
        id: "s",
        classes: {
          tile: {
            properties: {
              tightBoundingBox: {
                type: "SCALAR",
                componentType: "FLOAT64",
                array: true,
                count: 12,
                semantic: "TILE_BOUNDING_BOX",
              },
              name: { type: "STRING" },
            },
          },
        },
      };
      tileset.root.metadata = {
        class: "tile",
        properties: { tightBoundingBox: new Array(12).fill(0), name: "a" },
      };
      tileset.root.children![0].metadata = {
        class: "tile",
        properties: { tightBoundingBox: new Array(12).fill(0) },
      };
      const removed = TilesetDowngrader.removeBoundingVolumeSemantics(tileset);
      expect(removed).toBe(2);
      expect(tileset.root.metadata?.properties).toEqual({ name: "a" });
      expect(tileset.root.children![0].metadata).toBeUndefined();
    });
  });
});

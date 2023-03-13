import path from "path";

import { readJsonUnchecked } from "./readJsonUnchecked";

import { ResourceResolvers } from "../src/io/ResourceResolvers";
import { TilesetTraverser } from "../src/traversal/TilesetTraverser";

async function tilesetTraversalDemo(filePath: string) {
  const directory = path.dirname(filePath);
  const resourceResolver =
    ResourceResolvers.createFileResourceResolver(directory);
  const tileset = await readJsonUnchecked(filePath);
  // Note: External schemas are not considered here
  const schema = tileset.schema;
  const depthFirst = false;
  console.log("Traversing tileset");
  await TilesetTraverser.traverse(
    tileset,
    schema,
    resourceResolver,
    async (traversedTile) => {
      const contentUris = traversedTile.getFinalContents().map((c) => c.uri);
      const geometricError = traversedTile.asFinalTile().geometricError;
      console.log(
        `  Traversed tile: ${traversedTile}, ` +
          `path: ${traversedTile.path}, ` +
          `contents [${contentUris}], ` +
          `geometricError ${geometricError}`
      );
      return true;
    },
    depthFirst
  );
  console.log("Traversing tileset DONE");
}

async function runDemo() {
  const tilesetFileName =
    "../3d-tiles-samples/1.1/SparseImplicitQuadtree/tileset.json";
  await tilesetTraversalDemo(tilesetFileName);
}

runDemo();

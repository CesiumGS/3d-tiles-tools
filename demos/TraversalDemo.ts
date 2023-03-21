import path from "path";

import { readJsonUnchecked } from "./readJsonUnchecked";

import { ResourceResolvers } from "../src/io/ResourceResolvers";
import { TilesetTraverser } from "../src/traversal/TilesetTraverser";

async function tilesetTraversalDemo(filePath: string) {
  console.log(`Traversing tileset ${filePath}`);

  const directory = path.dirname(filePath);
  const resourceResolver =
    ResourceResolvers.createFileResourceResolver(directory);
  const tileset = await readJsonUnchecked(filePath);
  // Note: External schemas are not considered here
  const schema = tileset.schema;
  const depthFirst = false;
  const traverseExternalTilesets = true;
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
    depthFirst,
    traverseExternalTilesets
  );
  console.log("Traversing tileset DONE");
}

async function runBasicDemo() {
  const tilesetFileName = "./specs/data/TilesetWithUris/tileset.json";
  await tilesetTraversalDemo(tilesetFileName);
}

async function runExternalDemo() {
  const tilesetFileName = "./specs/data/TilesetOfTilesetsWithUris/tileset.json";
  await tilesetTraversalDemo(tilesetFileName);
}

async function runDemo() {
  await runBasicDemo();
  await runExternalDemo();
}

runDemo();

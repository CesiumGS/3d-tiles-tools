import path from "path";

import { readJsonUnchecked } from "../readJsonUnchecked";

import { ResourceResolvers } from "3d-tiles-tools";
import { TilesetTraverser } from "3d-tiles-tools";
import { TraversedTile } from "3d-tiles-tools";
import { Tileset } from "3d-tiles-tools";

const SPECS_DATA_BASE_DIRECTORY = "./specs/data";

async function tilesetTraversalDemo(filePath: string) {
  console.log(`Traversing tileset ${filePath}`);

  const directory = path.dirname(filePath);
  const resourceResolver =
    ResourceResolvers.createFileResourceResolver(directory);
  const tileset = readJsonUnchecked(filePath) as Tileset;
  if (tileset === undefined) {
    return;
  }

  const tilesetTraverser = new TilesetTraverser(directory, resourceResolver, {
    depthFirst: false,
    traverseExternalTilesets: true,
  });
  await tilesetTraverser.traverse(
    tileset,
    async (traversedTile: TraversedTile) => {
      const contentUris = traversedTile.getFinalContents().map((c) => c.uri);
      const geometricError = traversedTile.asFinalTile().geometricError;
      console.log(
        `  Traversed tile: ${traversedTile}, ` +
          `path: ${traversedTile.path}, ` +
          `contents [${contentUris}], ` +
          `geometricError ${geometricError}`
      );
      return true;
    }
  );
  console.log("Traversing tileset DONE");
}

async function runBasicDemo() {
  const tilesetFileName =
    SPECS_DATA_BASE_DIRECTORY + "/TilesetWithUris/tileset.json";
  await tilesetTraversalDemo(tilesetFileName);
}

async function runExternalDemo() {
  const tilesetFileName =
    SPECS_DATA_BASE_DIRECTORY + "/TilesetOfTilesetsWithUris/tileset.json";
  await tilesetTraversalDemo(tilesetFileName);
}

async function runDemo() {
  await runBasicDemo();
  await runExternalDemo();
}

runDemo();

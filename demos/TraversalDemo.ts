import fs from "fs";
import path from "path";

import { ResourceResolvers } from "../src";
import { TilesetTraverser } from "../src/traversal/TilesetTraverser";

/**
 * Only for internal use and basic tests:
 *
 * Reads a JSON file, parses it, and returns the result.
 * If the file cannot be read or parsed, then an error
 * message will be printed and `undefined` is returned.
 *
 * @param filePath - The path to the file
 * @returns A promise that resolves with the result or `undefined`
 */
async function readJsonUnchecked(filePath: string): Promise<any> {
  try {
    const data = fs.readFileSync(filePath);
    if (!data) {
      console.error("Could not read " + filePath);
      return undefined;
    }
    const jsonString = data.toString();
    const result = JSON.parse(jsonString);
    return result;
  } catch (error) {
    console.error("Could not parse JSON", error);
    return undefined;
  }
}

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
      const contentUris = traversedTile.getContents().map((c) => c.uri);
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
  const tilesetFile =
    "../3d-tiles-samples/1.1/SparseImplicitQuadtree/tileset.json";
  await tilesetTraversalDemo(tilesetFile);
}

runDemo();

import { TraversedTile } from "3d-tiles-tools";
import { TilesetEntry } from "3d-tiles-tools";

import { BasicTilesetProcessor } from "3d-tiles-tools";

import { Tileset } from "3d-tiles-tools";
import { Schema } from "3d-tiles-tools";
import { Tile } from "3d-tiles-tools";

import { ContentDataTypes } from "3d-tiles-tools";

const SPECS_DATA_BASE_DIRECTORY = "./specs/data";

/**
 * Creates an explicit hierarchy of `Tile` objects from the
 * given traversed tile.
 *
 * @param traversedTile - The traversed tile
 * @returns A promise to the explicit `Tile` object
 */
async function buildExplicitHierarchy(
  traversedTile: TraversedTile
): Promise<Tile> {
  const explicitTile = traversedTile.asFinalTile();

  // For the root of implicit tilesets, remove the implicitTiling
  // and contents (which contains the template URI)
  if (traversedTile.isImplicitTilesetRoot()) {
    delete explicitTile.implicitTiling;
    delete explicitTile.content;
    delete explicitTile.contents;
  }

  // Build the explicit children, recursively
  const explicitChildren: Tile[] = [];
  const children = await traversedTile.getChildren();
  for (const child of children) {
    const explicitChild = await buildExplicitHierarchy(child);
    explicitChildren.push(explicitChild);
  }
  if (explicitChildren.length > 0) {
    explicitTile.children = explicitChildren;
  }
  return explicitTile;
}

async function runConversionDemo(
  tilesetSourceName: string,
  tilesetTargetName: string
) {
  const overwrite = true;

  const tilesetProcessor = new BasicTilesetProcessor();
  await tilesetProcessor.begin(tilesetSourceName, tilesetTargetName, overwrite);

  // Apply a callback to the given input tileset
  await tilesetProcessor.forTileset(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async (tileset: Tileset, schema: Schema | undefined): Promise<Tileset> => {
      // Call the traversal function, and build the
      // explicit root from the traversed root.
      let explicitRoot: Tile | undefined;
      await tilesetProcessor.forEachTile(
        async (traversedTile: TraversedTile): Promise<boolean> => {
          explicitRoot = await buildExplicitHierarchy(traversedTile);
          // The `buildExplicitHierarcy` function already traverses
          // all children - so stop the traversal here:
          return false;
        }
      );
      if (!explicitRoot) {
        console.log("Could not create explicit root");
        return tileset;
      }

      // Create the target tileset, which is a copy of
      // the source tileset, but with the explicit root
      const targetTileset: Tileset = {
        asset: tileset.asset,
        properties: tileset.properties,
        schema: tileset.schema,
        schemaUri: tileset.schemaUri,
        statistics: tileset.statistics,
        groups: tileset.groups,
        metadata: tileset.metadata,
        geometricError: tileset.geometricError,
        root: explicitRoot,
        extensionsUsed: tileset.extensionsUsed,
        extensionsRequired: tileset.extensionsRequired,
      };
      return targetTileset;
    }
  );
  // Process all entries: When their type is CONTENT_TYPE_SUBT,
  // then they are omitted in the output.
  await tilesetProcessor.processAllEntries(
    async (
      sourceEntry: TilesetEntry,
      type: string | undefined
    ): Promise<TilesetEntry | undefined> => {
      if (type === ContentDataTypes.CONTENT_TYPE_SUBT) {
        return undefined;
      }
      return sourceEntry;
    }
  );

  await tilesetProcessor.end();
}

async function runDemo() {
  const tilesetSourceName =
    SPECS_DATA_BASE_DIRECTORY +
    "/tilesetProcessing/implicitProcessing/tileset.json";
  const tilesetTargetName = "./output/implicitToExplicit-result/tileset.json";
  await runConversionDemo(tilesetSourceName, tilesetTargetName);
}

runDemo();

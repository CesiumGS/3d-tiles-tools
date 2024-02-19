/* eslint-disable @typescript-eslint/no-unused-vars */
import { Schema } from "3d-tiles-tools";
import { Tile } from "3d-tiles-tools";
import { Tileset } from "3d-tiles-tools";

import { TilesetEntry } from "3d-tiles-tools";
import { TraversedTile } from "3d-tiles-tools";

import { BasicTilesetProcessor } from "3d-tiles-tools";

const SPECS_DATA_BASE_DIRECTORY = "./specs/data";

async function example() {
  const tilesetSourceName =
    SPECS_DATA_BASE_DIRECTORY +
    "/tilesetProcessing/implicitProcessing/tileset.json";
  const tilesetTargetName = "./output/tilesetProcessing-result/tileset.json";
  const overwrite = true;

  const tilesetProcessor = new BasicTilesetProcessor();
  await tilesetProcessor.begin(tilesetSourceName, tilesetTargetName, overwrite);

  // Apply a callback to each (explicit) `Tile`
  await tilesetProcessor.forEachExplicitTile(
    async (tile: Tile): Promise<void> => {
      console.log("In forEachExplicitTile");
      return;
    }
  );

  // Apply a callback to each `TraversedTile`
  await tilesetProcessor.forEachTile(
    async (traversedTile: TraversedTile): Promise<boolean> => {
      console.log("In forEachTile");
      return true;
    }
  );

  // Process all entries that are tile content
  await tilesetProcessor.processTileContentEntries(
    (uri: string) => uri,
    async (
      sourceEntry: TilesetEntry,
      type: string | undefined
    ): Promise<TilesetEntry> => {
      console.log("In processTileContentEntries");
      return sourceEntry;
    }
  );

  // Apply a callback to the tileset and its schema
  await tilesetProcessor.forTileset(
    async (tileset: Tileset, schema: Schema | undefined): Promise<Tileset> => {
      console.log("In forTileset");
      return tileset;
    }
  );

  await tilesetProcessor.end();
}

example();

/* eslint-disable @typescript-eslint/no-unused-vars */
import { Content } from "../src/structure/Content";
import { Schema } from "../src/structure/Metadata/Schema";
import { Tile } from "../src/structure/Tile";
import { Tileset } from "../src/structure/Tileset";

import { TilesetEntry } from "../src/tilesetData/TilesetEntry";

import { BasicTilesetProcessor } from "../src/tilesetProcessing/BasicTilesetProcessor";

import { TraversedTile } from "../src/traversal/TraversedTile";

async function example() {
  const tilesetSourceName =
    "../3d-tiles-samples/1.1/SparseImplicitQuadtree/tileset.json";
  const tilesetTargetName =
    "./output/SparseImplicitQuadtree-result/tileset.json";
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
    async (traversedTile: TraversedTile): Promise<void> => {
      console.log("In forEachTile");
    }
  );

  // Process all entries
  await tilesetProcessor.processAllEntries(
    async (
      sourceEntry: TilesetEntry,
      type: string | undefined
    ): Promise<TilesetEntry> => {
      console.log("In processAllEntries");
      return sourceEntry;
    }
  );

  // Process all entries
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
    async (tileset: Tileset, schema: Schema | undefined): Promise<void> => {
      console.log("In forTileset");
      return;
    }
  );

  await tilesetProcessor.end();
}

example();

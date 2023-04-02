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

  // Apply a callback to each `TraversedTile`
  await tilesetProcessor.forEachTile(
    async (traversedTile: TraversedTile): Promise<void> => {
      console.log("In forEachTile");
      return;
    }
  );

  // Apply a callback to each (explicit) `Tile`
  await tilesetProcessor.forEachExplicitTile(
    async (tile: Tile): Promise<void> => {
      console.log("In forEachExplicitTile");
      return;
    }
  );

  // Create a callback that receives a `Tile` and
  // applies a callback to each content
  const contentCallback = BasicTilesetProcessor.callbackForEachContent(
    async (content: Content): Promise<void> => {
      console.log("In contentCallback for implicit tiling roots", content.uri);
      return;
    }
  );

  // Apply a callback to each content of an (explicit) `Tile`
  await tilesetProcessor.forEachExplicitTile(
    async (tile: Tile): Promise<void> => {
      console.log("In forEachExplicitTile ");
      if (tile.implicitTiling) {
        contentCallback(tile);
      }
    }
  );

  // Apply a callback to each entry that is the content
  // of an explicit `Tile`
  await tilesetProcessor.forEachExplicitTileContentEntry(
    async (
      sourceEntry: TilesetEntry,
      type: string | undefined
    ): Promise<TilesetEntry[]> => {
      console.log("In forEachExplicitTileContentEntry");
      return [sourceEntry];
    }
  );

  // Apply a callback to each entry that is the content
  // of a tile
  await tilesetProcessor.forEachTileContentEntry(
    async (
      sourceEntry: TilesetEntry,
      type: string | undefined
    ): Promise<TilesetEntry[]> => {
      console.log("In forEachTileContentEntry");
      return [sourceEntry];
    }
  );

  // Apply a callback to each entry
  await tilesetProcessor.forEachEntry(
    async (
      sourceEntry: TilesetEntry,
      type: string | undefined
    ): Promise<TilesetEntry[]> => {
      console.log("In forEachEntry");
      return [sourceEntry];
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

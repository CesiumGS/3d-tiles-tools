import { Tile } from "../structure/Tile";
import { Tileset } from "../structure/Tileset";
import { Content } from "../structure/Content";
import { Schema } from "../structure/Metadata/Schema";

import { TilesetSourceResourceResolver } from "../io/TilesetSourceResourceResolver";

import { TilesetEntry } from "../tilesetData/TilesetEntry";
import { TilesetSources } from "../tilesetData/TilesetSources";

import { Tiles } from "../tilesets/Tiles";

import { TilesetProcessor } from "./TilesetProcessor";
import { TilesetEntryProcessor } from "./TilesetEntryProcessor";

import { TraversedTile } from "../traversal/TraversedTile";
import { TilesetTraverser } from "../traversal/TilesetTraverser";

/**
 * Implementation of a `TilesetProcessor` that offers methods for
 * common operations on tileset data.
 *
 * The operations are applied by callbacks on certain elements
 * of the tileset data:
 *
 * - Tiles and their content
 * - Explicit tiles and their content
 * - Unspecified entries (files) in the tileset
 * - The tileset (and its schema) itself
 *
 * Each entry that is processed with one of the `forEach*Entry`
 * methods will be processed only _once_, and then marked as
 * already having been processed. Entries that have not been
 * processed when `TilesetProcessor.end` is called will be
 * moved to the tileset target as they are.
 */
export class BasicTilesetProcessor extends TilesetProcessor {
  /**
   * Creates a new instance
   *
   * @param quiet - Whether log messages should be omitted
   */
  constructor(quiet?: boolean) {
    super(quiet);
  }

  /**
   * Apply the given callback to all `TraversedTile` instances
   * that result from traversing the tileset.
   *
   * @param callback - The callback
   * @returns A promise that resolves when the process is finished
   * @throws DeveloperError If `begin` was not called yet
   * @throws TilesetError When an error is thrown during processing
   */
  async forEachTile(
    callback: (traversedTile: TraversedTile) => Promise<void>
  ): Promise<void> {
    const context = this.getContext();
    const tilesetSource = context.tilesetSource;
    const tileset = context.tileset;
    const schema = context.schema;

    // Create the resource resolver that will be used for
    // resolving ".subtree" files of implicit tilesets
    // during the traversal
    const resourceResolver = new TilesetSourceResourceResolver(
      ".",
      tilesetSource
    );
    const tilesetTraverser = new TilesetTraverser(".", resourceResolver, {
      depthFirst: false,
      traverseExternalTilesets: true,
    });
    await tilesetTraverser.traverseWithSchema(
      tileset,
      schema,
      async (traversedTile) => {
        await callback(traversedTile);
        return true;
      }
    );
  }

  /**
   * Apply the given callback to all entries that represent tile
   * content, if they have not been processed yet.
   *
   * @param callback - The callback
   * @returns A promise that resolves when the process is finished
   * @throws DeveloperError If `begin` was not called yet
   * @throws TilesetError When an error is thrown during processing
   */
  async forEachTileContentEntry(
    callback: TilesetEntryProcessor
  ): Promise<void> {
    await this.forEachTile(
      async (traversedTile: TraversedTile): Promise<void> => {
        if (!traversedTile.isImplicitTilesetRoot()) {
          const contentUris = traversedTile
            .getFinalContents()
            .map((c) => c.uri);
          for (const contentUri of contentUris) {
            await this.processEntryInternal(contentUri, callback);
          }
        }
      }
    );
  }

  /**
   * Apply the given callback to each tile that appears as `Tile`
   * object in the tileset JSON
   *
   * @param callback - The callback
   * @returns A promise that resolves when the process is finished
   * @throws DeveloperError If `begin` was not called yet
   * @throws TilesetError When an error is thrown during processing
   */
  async forEachExplicitTile(
    callback: (tile: Tile) => Promise<void>
  ): Promise<void> {
    const context = this.getContext();
    const tileset = context.tileset;
    const root = tileset.root;
    await Tiles.traverseExplicit(root, async (tilePath: Tile[]) => {
      const tile = tilePath[tilePath.length - 1];
      await callback(tile);
      return true;
    });
  }

  /**
   * Apply the given callback to all entries that represent the content
   * of explicit tiles (i.e. tiles that appear as `Tile` objects in
   * the tileset JSON), if they have not been processed yet.
   *
   * The tileset JSON will automatically be updated to take into account
   * the result of the given callback: When the callback receives an
   * entry with a certain `key` (file name), and returns an entry with
   * a different `key`, then the `content.uri` will be updated
   * accordingly (also taking into account whether the content was
   * deleted to split into multiple contents).
   *
   * @param callback - The callback
   * @returns A promise that resolves when the process is finished
   * @throws DeveloperError If `begin` was not called yet
   * @throws TilesetError When an error is thrown during processing
   */
  async forEachExplicitTileContentEntry(
    callback: TilesetEntryProcessor
  ): Promise<void> {
    await this.forEachExplicitTile(async (tile: Tile) => {
      await this.processExplicitTileContentEntries(tile, callback);
    });
  }

  /**
   * Process all entries that are content of the given tile, and
   * update the tile content to reflect the changes from the
   * callback (see `forEachExplicitTileContentEntry` and
   * `updateTileContent`)
   *
   * @param tile - The tile
   * @returns A promise that resolves when the process is finished
   * @throws DeveloperError If `begin` was not called yet
   * @throws TilesetError When the input could not be processed
   */
  private async processExplicitTileContentEntries(
    tile: Tile,
    callback: TilesetEntryProcessor
  ): Promise<void> {
    // For roots of implicit tilesets, the content URI
    // is a template URI (i.e. they are not explicit,
    // and therefore not considered here)
    if (tile.implicitTiling) {
      return;
    }
    if (tile.content) {
      const content = tile.content;
      const targetEntries = await this.processEntryInternal(
        content.uri,
        callback
      );
      BasicTilesetProcessor.updateTileContent(tile, targetEntries);
    } else if (tile.contents) {
      const allTargetEntries = [];
      for (const content of tile.contents) {
        const targetEntries = await this.processEntryInternal(
          content.uri,
          callback
        );
        allTargetEntries.push(...targetEntries);
      }
      BasicTilesetProcessor.updateTileContent(tile, allTargetEntries);
    }
  }

  /**
   * Update the content of the given tile to reflect the given entries.
   *
   * When the given entries are empty, then the `content` and `contents`
   * of the given tile will be deleted.
   *
   * When there is one entry, then the `content` of the given tile will
   * receive the `key` (file name) of this entry as the content `uri`.
   *
   * When there are multiple entries, the tile will receive `contents`
   * where each content `uri` is one `key` file name of the entries.
   *
   * @param tile - The tile
   * @param targetEntries - The target entries
   */
  private static updateTileContent(tile: Tile, targetEntries: TilesetEntry[]) {
    if (targetEntries.length === 0) {
      delete tile.content;
      delete tile.contents;
      return;
    }
    if (targetEntries.length === 1) {
      const targetEntry = targetEntries[0];
      if (tile.content) {
        tile.content.uri = targetEntry.key;
      } else {
        const content = {
          uri: targetEntry.key,
        };
        tile.content = content;
        delete tile.contents;
      }
    }

    const newContents: Content[] = [];
    for (const targetEntry of targetEntries) {
      const content = {
        uri: targetEntry.key,
      };
      newContents.push(content);
    }
    tile.contents = newContents;
    delete tile.content;
  }

  /**
   * Applies the given callback to each `TilesetEntry` that has not
   * yet been processed.
   *
   * @param callback - The callback
   * @returns A promise that resolves when the process is finished
   * @throws DeveloperError If `begin` was not called yet
   * @throws TilesetError When the input could not be processed
   */
  async forEachEntry(callback: TilesetEntryProcessor) {
    const context = this.getContext();
    const tilesetSource = context.tilesetSource;
    const entries = TilesetSources.getEntries(tilesetSource);
    for (const entry of entries) {
      const key = entry.key;
      await this.processEntryInternal(key, callback);
    }
  }

  /**
   * Apply the given callback to the `Tileset` and the metadata
   * schema.
   *
   * @param callback - The callback
   * @returns A promise that resolves when the process is finished
   * @throws DeveloperError If `begin` was not called yet
   * @throws TilesetError When an error is thrown during processing
   */
  async forTileset(
    callback: (tileset: Tileset, schema: Schema | undefined) => Promise<void>
  ) {
    const context = this.getContext();
    const tileset = context.tileset;
    const schema = context.schema;
    await callback(tileset, schema);
  }

  /**
   * Creates a callback that receives a `Tile` object, and calls
   * the given callback on each of its `Content` objects.
   *
   * @param callback - The callback for the content
   * @returns The callback for the tile
   */
  static callbackForEachContent(
    callback: (content: Content) => Promise<void>
  ): (tile: Tile) => Promise<void> {
    return async (tile: Tile) => {
      if (tile.content) {
        const content = tile.content;
        await callback(content);
      }
      if (tile.contents) {
        for (const content of tile.contents) {
          await callback(content);
        }
      }
    };
  }
}

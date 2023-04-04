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
 * - All tiles (as `TraversedTile` instances)
 * - Explicit tiles (as `Tile` instances)
 * - Unspecified entries (files) in the tileset (as `TilesetEntry` objects)
 * - The tileset (and its schema) itself
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
    const tileset = context.tileset;
    await this.forEachTileAt(tileset.root, callback);
  }

  /**
   * Apply the given callback to all `TraversedTile` instances
   * that result from traversing the tile hierarchy, starting
   * at the given tile.
   *
   * The given tile is assumed to be an explicit tile in the
   * current tileset.
   *
   * @param tile The tile where to start the traversal
   * @param callback - The callback
   * @returns A promise that resolves when the process is finished
   * @throws DeveloperError If `begin` was not called yet
   * @throws TilesetError When an error is thrown during processing
   */
  private async forEachTileAt(
    tile: Tile,
    callback: (traversedTile: TraversedTile) => Promise<void>
  ): Promise<void> {
    const context = this.getContext();
    const tilesetSource = context.tilesetSource;
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
    await tilesetTraverser.traverseWithSchemaAt(
      tile,
      schema,
      async (traversedTile) => {
        await callback(traversedTile);
        return true;
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
   * Applies the given callback to each `TilesetEntry` that has not
   * yet been processed.
   *
   * @param callback - The callback
   * @returns A promise that resolves when the process is finished
   * @throws DeveloperError If `begin` was not called yet
   * @throws TilesetError When the input could not be processed
   */
  async processAllEntries(entryProcessor: TilesetEntryProcessor) {
    const context = this.getContext();
    const tilesetSource = context.tilesetSource;
    const entries = TilesetSources.getEntries(tilesetSource);
    for (const entry of entries) {
      await this.processEntry(entry, entryProcessor);
    }
  }

  /**
   * Process all entries that are tile content.
   *
   * This will process all tile content entries of the source tileset
   * with the given `TilesetEntryProcessor`. The given `uriProcessor`
   * will be used for updating the `key` (file name) of the entries,
   * as well as possible template URIs at the roots of implicit
   * tilesets.
   *
   * @param uriProcessor - The processor that updates keys and URIs
   * @param entryProcessor - The `TilesetEntryProcessor`
   * @returns A promise that resolves when the process is finished
   * @throws Error If one of the processing steps causes
   * an error.
   */
  async processTileContentEntries(
    uriProcessor: (uri: string) => string,
    entryProcessor: TilesetEntryProcessor
  ): Promise<void> {
    // Traverse the (explicit) tiles of the input tileset
    await this.forEachExplicitTile(async (tile: Tile): Promise<void> => {
      // When the tile is not an implicit tiling root,
      // then just update the entries that correspond
      // to the tile contents.
      if (!tile.implicitTiling) {
        await this.processExplicitTileContentEntries(tile, entryProcessor);
      } else {
        // For implicit tiling roots, traverse the implicit tile hierarchy
        // that starts at this tile, and process each entry that corresponds
        // to the content of one of the implicit tiles.
        await this.forEachTileAt(tile, async (traversedTile: TraversedTile) => {
          await this.processTraversedTileContentEntries(
            traversedTile,
            entryProcessor
          );
        });

        // After the traversal, update the content URIs of the
        // implicit tiling root (which are template URIs)
        const contents = Tiles.getContents(tile);
        for (const content of contents) {
          content.uri = uriProcessor(content.uri);
        }
      }
    });
  }

  /**
   * Process all entries that correspond to content of the given tile.
   *
   * This determines the entries in the tileset source that represent
   * content of the given tile, calls `processEntry` for each of them,
   * and stores the resulting entries.
   *
   * The `tile.content.uri` or `tile.contents[i].uri` of the given tile
   * will be updated to reflect possible changes of the keys (file
   * names) that are performed by the `entryProcessor`.
   *
   * @param tile - The tile
   * @param entryProcessor The `TilesetEntryProcessor`
   * @returns A promise that resolves when the process is finished
   */
  private async processExplicitTileContentEntries(
    tile: Tile,
    entryProcessor: TilesetEntryProcessor
  ): Promise<void> {
    const sourceEntries = await this.fetchTileContentEntries(tile);
    const targetEntries = await this.processEntries(
      sourceEntries,
      entryProcessor
    );
    BasicTilesetProcessor.updateTileContent(tile, targetEntries);
    this.storeTargetEntries(...targetEntries);
  }

  /**
   * Process all entries that correspond to content of the given traversed tile.
   *
   * This determines the entries in the tileset source that represent
   * content of the given tile, calls `processEntry` for each of them,
   * and stores the resulting entries.
   *
   * @param traversedTile - The traversed tile
   * @param entryProcessor The `TilesetEntryProcessor`
   * @returns A promise that resolves when the process is finished
   */
  private async processTraversedTileContentEntries(
    traversedTile: TraversedTile,
    entryProcessor: TilesetEntryProcessor
  ): Promise<void> {
    const sourceEntries = await this.fetchTraversedTileContentEntries(
      traversedTile
    );
    const targetEntries = await this.processEntries(
      sourceEntries,
      entryProcessor
    );
    this.storeTargetEntries(...targetEntries);
  }

  /**
   * Fetch all entries from the tileset source that correspond to the
   * contents of the given tile.
   *
   * @param tile - The tile
   * @returns A promise with the entries
   */
  private async fetchTileContentEntries(tile: Tile): Promise<TilesetEntry[]> {
    const contents = BasicTilesetProcessor.getTileContents(tile);
    const entries = await this.fetchContentEntries(contents);
    return entries;
  }

  /**
   * Fetch all entries from the tileset source that correspond to the
   * contents of the given traversed tile.
   *
   * @param traversedTile - The traversed tile
   * @returns A promise with the entries
   */
  private async fetchTraversedTileContentEntries(
    traversedTile: TraversedTile
  ): Promise<TilesetEntry[]> {
    if (traversedTile.isImplicitTilesetRoot()) {
      return [];
    }
    const contents = traversedTile.getFinalContents();
    const entries = await this.fetchContentEntries(contents);
    return entries;
  }

  /**
   * Fetch all entries from the tileset source that correspond to the
   * given contents.
   *
   * @param contents - The contents
   * @returns A promise with the entries
   */
  private async fetchContentEntries(
    contents: Content[]
  ): Promise<TilesetEntry[]> {
    const entries = [];
    for (const content of contents) {
      const entry = await this.fetchSourceEntry(content.uri);
      if (entry) {
        entries.push(entry);
      }
    }
    return entries;
  }

  /**
   * Returns an array with all contents of the give tile.
   *
   * @param contents - The contents
   * @returns A promise with the entries
   */
  private static getTileContents(tile: Tile): Content[] {
    if (tile.content) {
      return [tile.content];
    }
    if (tile.contents) {
      return tile.contents;
    }
    return [];
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
}

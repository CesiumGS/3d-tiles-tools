import { Tile } from "../structure/Tile";
import { Tileset } from "../structure/Tileset";
import { Content } from "../structure/Content";
import { Schema } from "../structure/Metadata/Schema";

import { TilesetSourceResourceResolver } from "../io/TilesetSourceResourceResolver";

import { Tiles } from "../tilesets/Tiles";

import { TilesetProcessor } from "./TilesetProcessor";
import { TilesetEntryProcessor } from "./TilesetEntryProcessor";

import { TraversedTile } from "../traversal/TraversedTile";
import { TilesetTraverser } from "../traversal/TilesetTraverser";
import { TilesetEntry } from "../tilesetData/TilesetEntry";

/**
 * Implementation of a `TilesetProcessor` that offers methods for
 * common operations on tileset data.
 *
 * The operations are applied by callbacks on certain elements
 * of the tileset data:
 *
 * - All tiles (as `TraversedTile` instances)
 * - Explicit tiles (as `Tile` instances)
 * - The tileset (and its schema) itself
 *
 * The operations may involve modifiications of the actual
 * `Tileset` object. The modified tileset object will be
 * written into the target when `end()` is called.
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
   * Overridden method from `TilesetProcessor` to save the
   * possibly modified tileset JSON in the target, finish
   * processing the source tileset and write all entries
   * that have not been processed yet into the target.
   *
   * @returns A promise that resolves when the operation finished
   * @throws TilesetError When there was an error while processing
   * or storing the entries.
   */
  override async end(): Promise<void> {
    await this.storeTargetTileset();
    await super.end();
  }

  /**
   * Store the target tileset as the entry for the tileset
   * JSON in the current target.
   *
   * This will mark the source- and target tileset JSON name
   * as 'processed'
   *
   * @throws DeveloperError If `begin` was not called yet
   * @throws TilesetError When the input could not be processed
   */
  private async storeTargetTileset() {
    const context = this.getContext();
    const targetTileset = context.targetTileset;
    const tilesetSourceJsonFileName = context.tilesetSourceJsonFileName;
    const tilesetTargetJsonFileName = context.tilesetTargetJsonFileName;

    await this.processEntry(
      tilesetSourceJsonFileName,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      async (sourceEntry: TilesetEntry, type: string | undefined) => {
        const targetTilesetJsonString = JSON.stringify(targetTileset, null, 2);
        const targetTilesetJsonBuffer = Buffer.from(targetTilesetJsonString);
        const targetEntry = {
          key: tilesetTargetJsonFileName,
          value: targetTilesetJsonBuffer,
        };
        return targetEntry;
      }
    );
  }

  /**
   * Applies the given entry processor to each `TilesetEntry` that
   * has not yet been processed, except for the entry of the
   * main tileset JSON.
   *
   * @param entryProcessor - The entry processor
   * @returns A promise that resolves when the process is finished
   * @throws DeveloperError If `begin` was not called yet
   * @throws TilesetError When the input could not be processed
   */
  async processAllEntries(entryProcessor: TilesetEntryProcessor) {
    const context = this.getContext();
    const tilesetSource = context.tilesetSource;
    const tilesetSourceJsonFileName = context.tilesetSourceJsonFileName;
    const sourceKeys = tilesetSource.getKeys();
    for (const sourceKey of sourceKeys) {
      if (sourceKey !== tilesetSourceJsonFileName) {
        await this.processEntry(sourceKey, entryProcessor);
      }
    }
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
    callback: (traversedTile: TraversedTile) => Promise<boolean>
  ): Promise<void> {
    const context = this.getContext();
    const tileset = context.sourceTileset;
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
    callback: (traversedTile: TraversedTile) => Promise<boolean>
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
    await tilesetTraverser.traverseWithSchemaAt(tile, schema, callback);
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
    const tileset = context.sourceTileset;
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
   * @returns A promise that resolves when the process is finished,
   * and contains the tileset that should be written into the
   * target. This may be identical to the given input tileset.
   * @throws DeveloperError If `begin` was not called yet
   * @throws TilesetError When an error is thrown during processing
   */
  async forTileset(
    callback: (tileset: Tileset, schema: Schema | undefined) => Promise<Tileset>
  ) {
    const context = this.getContext();
    const tileset = context.sourceTileset;
    const schema = context.schema;
    const targetTileset = await callback(tileset, schema);
    context.targetTileset = targetTileset;
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
          return true;
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
    const contents = BasicTilesetProcessor.getTileContents(tile);
    const targetContentUris = await this.processContentEntries(
      contents,
      entryProcessor
    );
    BasicTilesetProcessor.updateTileContent(tile, targetContentUris);
  }

  /**
   * Process all entries that correspond to content of the given traversed tile.
   *
   * This determines the entries in the tileset source that represent
   * content of the given tile, calls `processEntries` on them,
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
    if (traversedTile.isImplicitTilesetRoot()) {
      return;
    }
    const contents = traversedTile.getFinalContents();
    await this.processContentEntries(contents, entryProcessor);
  }

  /**
   * Process all entries that correspond to the given contents.
   *
   * @param tile - The tile
   * @param entryProcessor The `TilesetEntryProcessor`
   * @returns A promise that resolves when the process is finished,
   * containing the new names that the entries have after processing
   */
  private async processContentEntries(
    contents: Content[],
    entryProcessor: TilesetEntryProcessor
  ): Promise<string[]> {
    const targetContentUris: string[] = [];
    for (const content of contents) {
      const sourceContentUri = content.uri;
      let targetContentUri;
      if (this.isProcessed(sourceContentUri)) {
        targetContentUri = this.getTargetKey(sourceContentUri);
      } else {
        await this.processEntry(sourceContentUri, entryProcessor);
        targetContentUri = this.getTargetKey(sourceContentUri);
      }
      if (targetContentUri) {
        targetContentUris.push(targetContentUri);
      }
    }
    return targetContentUris;
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
   * Update the content of the given tile to reflect the given URIs.
   *
   * When the given array is empty, then the `content` and `contents`
   * of the given tile will be deleted.
   *
   * When there is one element, then the `content` of the given tile will
   * receive this element as the content `uri`.
   *
   * When there are multiple elements, the tile will receive `contents`
   * where each content `uri` is one element of the array.
   *
   * @param tile - The tile
   * @param contentUris - The content URIs
   */
  static updateTileContent(tile: Tile, contentUris: string[]) {
    if (contentUris.length === 0) {
      delete tile.content;
      delete tile.contents;
      return;
    }
    if (contentUris.length === 1) {
      const contentUri = contentUris[0];
      if (tile.content) {
        tile.content.uri = contentUri;
      } else {
        const content = {
          uri: contentUri,
        };
        tile.content = content;
        delete tile.contents;
      }
      return;
    }

    const newContents: Content[] = [];
    for (const contentUri of contentUris) {
      const content = {
        uri: contentUri,
      };
      newContents.push(content);
    }
    tile.contents = newContents;
    delete tile.content;
  }
}

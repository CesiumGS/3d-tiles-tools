import path from "path";

import { ContentDataTypes } from "../../base";
import { Paths } from "../../base";

import { Tile } from "../../structure";
import { Tileset } from "../../structure";
import { Content } from "../../structure";
import { Schema } from "../../structure";

import { TilesetSourceResourceResolver } from "../../tilesets";
import { Tiles } from "../../tilesets";
import { TraversedTile } from "../../tilesets";
import { TilesetTraverser } from "../../tilesets";
import { TraversalCallback } from "../../tilesets";
import { TilesetEntry } from "../../tilesets";

import { TilesetProcessor } from "./TilesetProcessor";
import { TilesetEntryProcessor } from "./TilesetEntryProcessor";

import { Loggers } from "../../base";
const logger = Loggers.get("tilesetProcessing");

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
 * The operations may involve modifications of the actual
 * `Tileset` object. The modified tileset object will be
 * written into the target when `end()` is called.
 *
 * @internal
 */
export class BasicTilesetProcessor extends TilesetProcessor {
  /**
   * Whether external tilesets should be processed transparently.
   *
   * When this is 'true', then the methods that process tile
   * content will also be applied to the contents of external
   * tilesets.
   */
  private readonly processExternalTilesets: boolean;

  /**
   * Creates a new instance
   *
   * @param processExternalTilesets - Whether external tilesets
   * should be processed.
   */
  constructor(processExternalTilesets?: boolean) {
    super();
    if (processExternalTilesets === undefined) {
      this.processExternalTilesets = true;
    } else {
      this.processExternalTilesets = processExternalTilesets;
    }
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
   * @param callback - The callback.
   * @returns A promise that resolves when the process is finished
   * @throws DeveloperError If `begin` was not called yet
   * @throws TilesetError When an error is thrown during processing
   */
  async forEachTile(callback: TraversalCallback): Promise<void> {
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
   * @param tile - The tile where to start the traversal
   * @param callback - The callback
   * @returns A promise that resolves when the process is finished
   * @throws DeveloperError If `begin` was not called yet
   * @throws TilesetError When an error is thrown during processing
   */
  private async forEachTileAt(
    tile: Tile,
    callback: TraversalCallback
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
    // Use the processed tileset as the source of subsequent operations
    context.sourceTileset = targetTileset;
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
   * @throws Error If one of the processing steps causes an error.
   */
  async processTileContentEntries(
    uriProcessor: (uri: string) => string,
    entryProcessor: TilesetEntryProcessor
  ): Promise<void> {
    const context = this.getContext();
    const tileset = context.sourceTileset;
    const basePath = ".";
    await this.processTilesetTileContentEntries(
      basePath,
      tileset,
      uriProcessor,
      entryProcessor
    );
  }

  /**
   * Process all entries that are tile content of any of the
   * tiles in the given tileset.
   *
   * This will process all tile content entries of the given tileset
   * with the given `TilesetEntryProcessor`. The given `uriProcessor`
   * will be used for updating the `key` (file name) of the entries,
   * as well as possible template URIs at the roots of implicit
   * tilesets.
   *
   * @param basePath - The path that the (relative) content URIs of
   * the given tileset are resolved against, in order to obtain the
   * full path for the content data. For the root tileset, this is
   * just the current directory, `"."`. For external tilesets, it
   * will be the directory that contained the tileset JSON file of
   * the external tileset.
   * @param tileset - The tileset
   * @param uriProcessor - The processor that updates keys and URIs
   * @param entryProcessor - The `TilesetEntryProcessor`
   * @returns A promise that resolves when the process is finished
   * @throws Error If one of the processing steps causes
   * an error.
   */
  private async processTilesetTileContentEntries(
    basePath: string,
    tileset: Tileset,
    uriProcessor: (uri: string) => string,
    entryProcessor: TilesetEntryProcessor
  ): Promise<void> {
    // The callback that will be applied to each explicit
    // tile in the tileset.
    const tileCallback = async (tile: Tile): Promise<void> => {
      // When the tile is not an implicit tiling root,
      // then just update the entries that correspond
      // to the tile contents.
      if (!tile.implicitTiling) {
        await this.processExplicitTileContentEntries(
          basePath,
          tile,
          uriProcessor,
          entryProcessor
        );
      } else {
        // For implicit tiling roots, traverse the implicit tile hierarchy
        // that starts at this tile, and process each entry that corresponds
        // to the content of one of the implicit tiles.
        await this.forEachTileAt(tile, async (traversedTile: TraversedTile) => {
          await this.processTraversedTileContentEntries(
            basePath,
            traversedTile,
            uriProcessor,
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
    };

    const root = tileset.root;
    await Tiles.traverseExplicit(root, async (tilePath: Tile[]) => {
      const tile = tilePath[tilePath.length - 1];
      await tileCallback(tile);
      return true;
    });
  }

  /**
   * Process all entries that correspond to content of the given tile.
   *
   * The `tile.content.uri` or `tile.contents[i].uri` of the given tile
   * will be updated to reflect possible changes of the keys (file
   * names) that are performed by the `entryProcessor`.
   *
   * @param basePath - The base path (see processTilesetTileContentEntries)
   * @param tile - The tile
   * @param uriProcessor - The processor that updates keys and URIs
   * @param entryProcessor - The `TilesetEntryProcessor`
   * @returns A promise that resolves when the process is finished
   */
  private async processExplicitTileContentEntries(
    basePath: string,
    tile: Tile,
    uriProcessor: (uri: string) => string,
    entryProcessor: TilesetEntryProcessor
  ): Promise<void> {
    const contents = BasicTilesetProcessor.getTileContents(tile);
    const targetContentUris = await this.processContentEntries(
      basePath,
      contents,
      uriProcessor,
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
   * @param basePath - The base path (see processTilesetTileContentEntries)
   * @param traversedTile - The traversed tile
   * @param uriProcessor - The processor that updates keys and URIs
   * @param entryProcessor - The `TilesetEntryProcessor`
   * @returns A promise that resolves when the process is finished
   */
  private async processTraversedTileContentEntries(
    basePath: string,
    traversedTile: TraversedTile,
    uriProcessor: (uri: string) => string,
    entryProcessor: TilesetEntryProcessor
  ): Promise<void> {
    if (traversedTile.isImplicitTilesetRoot()) {
      return;
    }
    const contents = traversedTile.getFinalContents();
    await this.processContentEntries(
      basePath,
      contents,
      uriProcessor,
      entryProcessor
    );
  }

  /**
   * Process all entries that correspond to the given contents.
   *
   * The method will return the "target names" of these contents - i.e.
   * the file names / uris that the contents have after being processed
   * with the given entry processor (and it will make sure that the
   * entry processor is only applied ONCE to each entry).
   *
   * If one of the contents is an external tileset, and the
   * `this.processExternalTilesets` flag is `true`, then the
   * method will call `processTilesetTileContentEntries`
   * on this tileset, to recursively handle the content entries
   * of the external tileset.
   *
   * @param basePath - The base path (see processTilesetTileContentEntries)
   * @param contents - The contents
   * @param uriProcessor - The processor that updates keys and URIs
   * @param entryProcessor - The `TilesetEntryProcessor`
   * @returns A promise that resolves when the process is finished,
   * containing the new names that the entries have after processing
   */
  private async processContentEntries(
    basePath: string,
    contents: Content[],
    uriProcessor: (uri: string) => string,
    entryProcessor: TilesetEntryProcessor
  ): Promise<string[]> {
    const targetContentUris: string[] = [];
    for (const content of contents) {
      // Resolve the content URI against the base path, to
      // obtain the full URI (which is still relative to
      // the directory of the "root" tileset)
      const sourceContentUri = content.uri;
      const fullSourceContentUri = Paths.join(basePath, sourceContentUri);

      let fullTargetContentUri;
      if (this.isProcessed(fullSourceContentUri)) {
        fullTargetContentUri = this.getTargetKey(fullSourceContentUri);
      } else {
        // By default, each content entry will be processed with
        // the given entryProcessor. But if external tilesets
        // should be processed, and the given entry is an
        // external tileset, then it will also be processed with
        // the 'processExternalTilesetContentEntries' method, to
        // recursively handle the contents of the external tileset.
        let externalHandlingEntryProcessor = entryProcessor;
        if (this.processExternalTilesets) {
          externalHandlingEntryProcessor = async (
            sourceEntry: TilesetEntry,
            type: string | undefined
          ) => {
            const targetEntry = await entryProcessor(sourceEntry, type);
            if (targetEntry) {
              if (type === ContentDataTypes.CONTENT_TYPE_TILESET) {
                const externalBasePath = path.dirname(sourceEntry.key);
                return this.processExternalTilesetContentEntries(
                  externalBasePath,
                  targetEntry,
                  uriProcessor,
                  entryProcessor
                );
              }
            }
            return targetEntry;
          };
        }
        await this.processEntry(
          fullSourceContentUri,
          externalHandlingEntryProcessor
        );
        fullTargetContentUri = this.getTargetKey(fullSourceContentUri);
      }
      if (fullTargetContentUri) {
        // Remove the "basePath" from the (possibly modified)
        // URI, to obtain the URI that will become the new
        // content.uri in the tileset JSON.
        const targetContentUri = Paths.relativize(
          basePath,
          fullTargetContentUri
        );
        targetContentUris.push(targetContentUri);
      }
    }
    return targetContentUris;
  }

  /**
   * Process all entries that correspond to tile content of a tile
   * in the given tileset.
   *
   * This will traverse the tile hierarchy of the given tileset
   * and eventually apply the given entry processor to each tile
   * content. The JSON that is parsed from the given entry will
   * be modified, and the modified JSON (with possibly updated
   * content URIs) will be returned as the new entry for the
   * external tileset.
   *
   * @param basePath - The base path (see processTilesetTileContentEntries)
   * @param externalTilesetSourceEntry - The tileset entry that
   * contains the external tileset.
   * @param uriProcessor - The processor that updates keys and URIs
   * @param entryProcessor - The `TilesetEntryProcessor`
   * @returns A promise that resolves when the process is finished,
   * containing the new names that the entries have after processing
   * @throws Error If processing the external tileset causes an error
   */
  private async processExternalTilesetContentEntries(
    basePath: string,
    externalTilesetSourceEntry: TilesetEntry,
    uriProcessor: (uri: string) => string,
    entryProcessor: TilesetEntryProcessor
  ): Promise<TilesetEntry> {
    logger.debug(
      `Processing external tileset ${externalTilesetSourceEntry.key}`
    );

    // Parse the external tileset from the given entry
    const externalTileset = JSON.parse(
      externalTilesetSourceEntry.value.toString()
    ) as Tileset;

    // Process all content entries of the external tileset
    // (possibly updating the content URIs in this tileset)
    await this.processTilesetTileContentEntries(
      basePath,
      externalTileset,
      uriProcessor,
      entryProcessor
    );

    // Create the buffer that contains the (possibly modified)
    // external tileset JSON data, and return this as the
    // new entry for the external tileset.
    const externalTilesetJsonString = JSON.stringify(externalTileset, null, 2);
    const targetTilesetJsonBuffer = Buffer.from(externalTilesetJsonString);
    const externalTilesetTargetEntry = {
      key: externalTilesetSourceEntry.key,
      value: targetTilesetJsonBuffer,
    };

    logger.debug(
      `Processing external tileset ${externalTilesetSourceEntry.key} DONE`
    );

    return externalTilesetTargetEntry;
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

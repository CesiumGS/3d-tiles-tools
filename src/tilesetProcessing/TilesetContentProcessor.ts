import { DeveloperError } from "../base/DeveloperError";

import { TilesetSourceResourceResolver } from "../io/TilesetSourceResourceResolver";

import { Tile } from "../structure/Tile";
import { Tileset } from "../structure/Tileset";
import { Content } from "../structure/Content";
import { Schema } from "../structure/Metadata/Schema";

import { TilesetEntry } from "../tilesetData/TilesetEntry";

import { TilesetTraverser } from "../traversal/TilesetTraverser";

import { Tiles } from "../tilesets/Tiles";

import { TilesetProcessor } from "./TilesetProcessor";

/**
 * A base class for classes that can process the content of tiles of
 * tilesets.
 *
 * It defines two abstract methods: The `processTileContentEntry` method
 * may be overridden by subclasses to process each entry as necessary.
 *
 * The `processImplicitTilesetRootContent` method may be called to
 * update the `content.uri` (i.e. the template URI) of tiles that are
 * the roots of implicit tilesets, so that they reflect the modifications
 * of key (file names) that are done in `processTileContentEntry`.
 *
 * Entries that are no tile content will be processed with the
 * `processEntry` method, which is implemented as a no-op by
 * default.
 */
export abstract class TilesetContentProcessor extends TilesetProcessor {
  /**
   * Creates a new instance
   *
   * @param quiet - Whether log messages should be omitted
   */
  constructor(quiet?: boolean) {
    super(quiet);
  }

  /** {@inheritDoc TilesetProcessor.processTilesetInternal} */
  override async processTilesetInternal(
    tileset: Tileset,
    schema: Schema | undefined
  ): Promise<void> {
    this.log(`Processing all tiles`);
    await this.processAllTilesContentEntries(tileset, schema);

    this.log(`Processing all entries`);
    await this.processEntries();

    this.log(`Processing all implicit tileset roots`);
    await this.processImplicitTilesetRoots(tileset);

    this.log(`Processing tileset JSON`);
    await this.processTilesetJson(tileset, schema);
  }

  /**
   * Process all tiles that are roots of implicit tilesets.
   *
   * @param tileset - The tileset
   * @returns A promise that resolves when the process is finished
   * @throws TilesetError When the input could not be processed
   */
  private async processImplicitTilesetRoots(tileset: Tileset): Promise<void> {
    const root = tileset.root;
    await Tiles.traverseExplicit(root, async (tilePath: Tile[]) => {
      const tile = tilePath[tilePath.length - 1];
      if (tile.implicitTiling) {
        await this.processImplicitTilesetRoot(tile);
      }
      return true;
    });
  }

  /**
   * Process the given tile, which is a root of an implicit tileset.
   *
   * @param tile - The tile
   * @returns A promise that resolves when the process is finished
   * @throws TilesetError When the input could not be processed
   */
  private async processImplicitTilesetRoot(tile: Tile): Promise<void> {
    if (tile.content) {
      const content = tile.content;
      const newContent = await this.processImplicitTilesetRootContent(content);
      tile.content = newContent;
    } else if (tile.contents) {
      for (let i = 0; i < tile.contents.length; i++) {
        const content = tile.contents[i];
        const newContent = await this.processImplicitTilesetRootContent(
          content
        );
        tile.contents[i] = newContent;
      }
    }
  }

  /**
   * Process all entries that are tile content (both of explicit
   * and implicit tiles).
   *
   * @param tileset - The tileset
   * @param schema - The optional metadata schema for the tileset
   * @returns A promise that resolves when the process is finished
   * @throws DeveloperError When the source is not opened
   * @throws TilesetError When the input could not be processed
   */
  private async processAllTilesContentEntries(
    tileset: Tileset,
    schema: Schema | undefined
  ): Promise<void> {
    const tilesetSource = this.getTilesetSource();
    if (!tilesetSource) {
      throw new DeveloperError("The source must be defined");
    }

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
        if (!traversedTile.isImplicitTilesetRoot()) {
          const contentUris = traversedTile
            .getFinalContents()
            .map((c) => c.uri);
          for (const contentUri of contentUris) {
            await this.processEntryInternal(
              contentUri,
              this.processTileContentEntry
            );
          }
        }
        return true;
      }
    );
  }

  /** {@inheritDoc TilesetProcessor.processEntry} */
  protected override async processEntry(
    sourceEntry: TilesetEntry,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type: string | undefined
  ): Promise<TilesetEntry[]> {
    return [sourceEntry];
  }

  /**
   * Process a single entry that represents the content of a tile.
   *
   * This is the main configuration point for this class: Implementors
   * may override this method, perform arbitrary operations on the
   * given entry, and return the result.
   *
   * (A no-op implementation of this method would be to just return an
   * array that contains the given source entry as its only element)
   *
   * @param sourceEntry - The source entry
   * @param type The content data type (see `ContentDataTypes`)
   * @returns The target entries
   */
  abstract processTileContentEntry(
    sourceEntry: TilesetEntry,
    type: string | undefined
  ): Promise<TilesetEntry[]>;

  /**
   * Process the `content` of a tile that is the root of an implicit tileset.
   *
   * Implementors may override this method, and modify the given content
   * as necessary, to reflect modifications that may have been done in
   * `processTileContentEntry`.
   *
   * (A no-op implementation of this method would be to just return
   * the given content, as it is)
   *
   * @param sourceEntry - The source entry
   * @param type The content data type (see `ContentDataTypes`)
   * @returns The target entries
   */
  abstract processImplicitTilesetRootContent(
    content: Content
  ): Promise<Content>;
}

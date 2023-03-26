import { Tile } from "../structure/Tile";
import { Tileset } from "../structure/Tileset";
import { Content } from "../structure/Content";
import { Schema } from "../structure/Metadata/Schema";

import { TilesetEntry } from "../tilesetData/TilesetEntry";

import { Tiles } from "../tilesets/Tiles";
import { TilesetProcessor } from "./TilesetProcessor";

/**
 * A base class for classes that can process the content of
 * explicit tiles of tilesets.
 *
 * The abstract `processExplicitTileContentEntry` method is the main
 * configuration point: It may be overridden by subclasses to process
 * each entry as necessary.
 *
 * Entries that are not explicit tile content will be processed with
 * the `processEntry` method, which is implemented as a no-op by
 * default.
 */
export abstract class TilesetExplicitContentProcessor extends TilesetProcessor {
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    schema: Schema | undefined
  ): Promise<void> {
    this.log(`Processing explicit tile content entries`);
    await this.processExplicitTilesContentEntries(tileset);

    this.log(`Processing all entries`);
    await this.processEntries();

    this.log(`Processing tileset JSON`);
    await this.processTilesetJson(tileset, schema);
  }

  /**
   * Process all entries that are tile content of explicit tiles.
   *
   * @param tileset - The tileset
   * @returns A promise that resolves when the process is finished
   * @throws TilesetError When the input could not be processed
   */
  private async processExplicitTilesContentEntries(
    tileset: Tileset
  ): Promise<void> {
    const root = tileset.root;
    await Tiles.traverseExplicit(root, async (tilePath: Tile[]) => {
      const tile = tilePath[tilePath.length - 1];
      await this.processExplicitTileContentEntries(tile);
      return true;
    });
  }

  /**
   * Process all entries that are content of the given tile.
   *
   * @param tile - The tile
   * @returns A promise that resolves when the process is finished
   * @throws TilesetError When the input could not be processed
   */
  private async processExplicitTileContentEntries(tile: Tile): Promise<void> {
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
        this.processExplicitTileContentEntry
      );
      this.updateTileContent(tile, targetEntries);
    } else if (tile.contents) {
      const allTargetEntries = [];
      for (const content of tile.contents) {
        const targetEntries = await this.processEntryInternal(
          content.uri,
          this.processExplicitTileContentEntry
        );
        allTargetEntries.push(...targetEntries);
      }
      this.updateTileContent(tile, allTargetEntries);
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
  private updateTileContent(tile: Tile, targetEntries: TilesetEntry[]) {
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

  /** {@inheritDoc TilesetProcessor.processEntry} */
  protected override async processEntry(
    sourceEntry: TilesetEntry,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type: string | undefined
  ): Promise<TilesetEntry[]> {
    return [sourceEntry];
  }

  /**
   * Process a single entry that represents the content of an explicit tile.
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
  abstract processExplicitTileContentEntry(
    sourceEntry: TilesetEntry,
    type: string | undefined
  ): Promise<TilesetEntry[]>;
}

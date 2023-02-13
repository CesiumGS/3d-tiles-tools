import path from "path";

import { Paths } from "../base/Paths";

import { Tileset } from "../structure/Tileset";
import { Tile } from "../structure/Tile";
import { Content } from "../structure/Content";

import { TilesetSource } from "../tilesetData/TilesetSource";
import { TilesetTarget } from "../tilesetData/TilesetTarget";
import { TilesetError } from "../tilesetData/TilesetError";
import { TilesetSources } from "../tilesetData/TilesetSources";
import { TilesetTargets } from "../tilesetData/TilesetTargets";

import { Tiles } from "../tilesets/Tiles";
import { Tilesets } from "../tilesets/Tilesets";

// TODO Content type detection to be extracted from validator
import { ContentTypes_Dummy } from "../contentTypes/ContentTypes_Dummy";

/**
 * A class for combining external tileset of a given tileset, to
 * create a new, combined tileset.
 *
 */
export class TilesetCombiner {
  /**
   * The file names of external tilesets, relative to the
   * root directory of the input tileset
   */
  private readonly externalTilesetFileNames: string[];

  /**
   * The tileset source for the input
   */
  private tilesetSource: TilesetSource | undefined;

  /**
   * The tileset target for the output.
   */
  private tilesetTarget: TilesetTarget | undefined;

  /**
   * Creates a new instance
   */
  constructor() {
    this.externalTilesetFileNames = [];
  }

  /**
   * Combines ("inlines") the external tilesets that are referred to by
   * the given source tileset, and writes the result to the given target.
   *
   * @param tilesetSourceName - The tileset source name
   * @param tilesetTargetName - The tileset target name
   * @param overwrite Whether the target should be overwritten if
   * it already exists
   * @returns A promise that resolves when the process is finished
   * @throws TilesetError When the input could not be processed
   * @throws TilesetError When the output already exists
   * and `overwrite` was `false`.
   */
  async combine(
    tilesetSourceName: string,
    tilesetTargetName: string,
    overwrite: boolean
  ): Promise<void> {
    const tilesetSource = TilesetSources.createAndOpen(tilesetSourceName);
    const tilesetTarget = TilesetTargets.createAndBegin(
      tilesetTargetName,
      overwrite
    );

    const tilesetJsonFileName =
      Tilesets.determineTilesetJsonFileName(tilesetSourceName);

    await this.combineInternal(
      tilesetSource,
      tilesetJsonFileName,
      tilesetTarget
    );

    tilesetSource.close();
    await tilesetTarget.end();
  }

  /**
   * Combines all external tilesets in the given source, and writes
   * the result into the given target.
   *
   * The caller is responsible for opening and closing the given
   * source and target.
   *
   * @param tilesetSource The tileset source
   * @param tilesetJsonFileName The name of the top-level tileset in
   * the given source (usually `tileset.json`).
   * @param tilesetTarget The tileset target
   * @returns A promise that resolves when the process is finished.
   * @throws TilesetError When the input tileset file can not be
   * found
   * @throws TilesetError If `open` was not called on the
   * input, or `begin` was not called on the output.
   */
  private async combineInternal(
    tilesetSource: TilesetSource,
    tilesetJsonFileName: string,
    tilesetTarget: TilesetTarget
  ): Promise<void> {
    this.tilesetSource = tilesetSource;
    this.tilesetTarget = tilesetTarget;

    const tilesetJsonBuffer = tilesetSource.getValue(tilesetJsonFileName);
    if (!tilesetJsonBuffer) {
      const message = `No ${tilesetJsonFileName} found in input`;
      throw new TilesetError(message);
    }
    const tileset = JSON.parse(tilesetJsonBuffer.toString()) as Tileset;

    this.externalTilesetFileNames.length = 0;
    await this.combineTilesetsInternal(".", tileset, undefined);
    this.copyResources();

    const combinedTilesetJsonString = JSON.stringify(tileset, null, 2);
    const combinedTilesetJsonBuffer = Buffer.from(combinedTilesetJsonString);
    tilesetTarget.addEntry("tileset.json", combinedTilesetJsonBuffer);

    this.tilesetSource = undefined;
    this.tilesetTarget = undefined;
  }

  /**
   * Internal method to combine the given tileset.
   *
   * This is called with the source tileset, and then with every
   * external tileset that is encountered.
   *
   * The current directory is tracked as a directory relative to the
   * root of the original source tileset, leading to the directory
   * that contains the current tileset.
   *
   * @param currentDirectory - The current directory
   * @param tileset - The current tileset
   * @param parentTile - The optional parent tile
   */
  private async combineTilesetsInternal(
    currentDirectory: string,
    tileset: Tileset,
    parentTile: Tile | undefined
  ): Promise<void> {
    const root = tileset.root;
    if (parentTile) {
      parentTile.content = root.content;
      parentTile.contents = root.contents;
      parentTile.children = root.children;
    }
    await Tiles.traverseExplicit(root, async (tilePath: Tile[]) => {
      const tile = tilePath[tilePath.length - 1];
      this.combineTileInternal(currentDirectory, tile);
      return true;
    });
  }

  /**
   * This is called for each (explicit) tile in the source tileset and
   * its external tilesets, and calls `combineContentInternal`
   * for each content, in order to process the external tilesets
   * that the contents may contain, and to update tile content URLs
   * for the combined output.
   *
   * @param currentDirectory - The current directory (see `combineTilesetsInternal`)
   * @param tile - The current tile
   */
  private combineTileInternal(currentDirectory: string, tile: Tile): void {
    if (tile.content) {
      this.combineContentInternal(currentDirectory, tile, tile.content);
    } else if (tile.contents) {
      for (const content of tile.contents) {
        this.combineContentInternal(currentDirectory, tile, content);
      }
    }
  }

  /**
   * This is called for each content of each tile of the source tileset and
   * all of its external tilesets.
   *
   * If the given content points to an external tileset, it is inlined
   * by calling `combineTilesetsInternal` with the directory and JSON of the
   * external tileset.
   *
   * Otherwise, the URL of the content is updated to be relative to
   * the root of the resulting combined tileset.
   *
   * @param currentDirectory - The current directory (see `combineTilesetsInternal`)
   * @param tile - The current tile
   * @param content - The current tile content
   */
  private combineContentInternal(
    currentDirectory: string,
    tile: Tile,
    content: Content
  ): void {
    const contentUri = content.uri;
    const isTileset = ContentTypes_Dummy.isProbablyTileset(contentUri);
    console.log(
      "Content uri is " + contentUri + ", assuming tileset? " + isTileset
    );
    if (isTileset) {
      const externalFileName = Paths.join(currentDirectory, contentUri);
      this.externalTilesetFileNames.push(externalFileName);
      const externalTilesetDirectory = path.dirname(externalFileName);
      console.log("externalFileName is " + externalFileName);
      const externalTilesetBuffer =
        this.tilesetSource!.getValue(externalFileName);
      const externalTileset = JSON.parse(
        externalTilesetBuffer!.toString()
      ) as Tileset;
      this.combineTilesetsInternal(
        externalTilesetDirectory,
        externalTileset,
        tile
      );
    } else {
      const externalFileName = Paths.resolve(currentDirectory, contentUri);
      const newUri = Paths.relativize(".", externalFileName);
      console.log(
        "Current directory is " +
          currentDirectory +
          ", URI is " +
          contentUri +
          ", newUri is " +
          newUri
      );
      content.uri = newUri;
    }
  }

  /**
   * Copy all elements from the tileset source to the tileset target,
   * except for the ones that have been determined to be external
   * tilesets.
   */
  private copyResources(): void {
    const keys = this.tilesetSource!.getKeys();
    for (const key of keys) {
      //console.log("About to copy "+key+" except for "+this.externalTilesetFileNames);
      if (this.externalTilesetFileNames.includes(key)) {
        continue;
      }
      const value = this.tilesetSource!.getValue(key);
      this.tilesetTarget!.addEntry(key, value!);
    }
  }
}

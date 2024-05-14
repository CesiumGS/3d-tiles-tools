import path from "path";

import { Paths } from "../../base";
import { DeveloperError } from "../../base";
import { ContentData } from "../../base";
import { BufferedContentData } from "../../base";

import { Tileset } from "../../structure";
import { Tile } from "../../structure";
import { Content } from "../../structure";

import { TilesetSource } from "../../tilesets";
import { TilesetTarget } from "../../tilesets";
import { TilesetError } from "../../tilesets";
import { TilesetSources } from "../../tilesets";
import { TilesetTargets } from "../../tilesets";
import { Tiles } from "../../tilesets";
import { Tilesets } from "../../tilesets";

/**
 * A class for combining external tileset of a given tileset, to
 * create a new, combined tileset.
 *
 * @internal
 */
export class TilesetCombiner {
  /**
   * A predicate that is used to detect whether a given
   * content data refers to an external tileset.
   */
  private readonly externalTilesetDetector: (
    contentData: ContentData
  ) => Promise<boolean>;

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
   *
   * @param externalTilesetDetector - The predicate that is used to
   * detect whether something is an external tileset
   */
  constructor(
    externalTilesetDetector: (contentData: ContentData) => Promise<boolean>
  ) {
    this.externalTilesetDetector = externalTilesetDetector;
    this.externalTilesetFileNames = [];
  }

  /**
   * Combines ("inlines") the external tilesets that are referred to by
   * the given source tileset, and writes the result to the given target.
   *
   * @param tilesetSourceName - The tileset source name
   * @param tilesetTargetName - The tileset target name
   * @param overwrite - Whether the target should be overwritten if
   * it already exists
   * @returns A promise that resolves when the process is finished
   * @throws TilesetError When the input could not be processed,
   * or when the output already exists and `overwrite` was `false`.
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

    this.tilesetSource = tilesetSource;
    this.tilesetTarget = tilesetTarget;

    const tilesetSourceJsonFileName =
      Tilesets.determineTilesetJsonFileName(tilesetSourceName);

    const tilesetTargetJsonFileName =
      Tilesets.determineTilesetJsonFileName(tilesetTargetName);

    await this.combineInternal(
      tilesetSource,
      tilesetSourceJsonFileName,
      tilesetTarget,
      tilesetTargetJsonFileName
    );

    tilesetSource.close();
    await tilesetTarget.end();

    this.tilesetSource = undefined;
    this.tilesetTarget = undefined;
  }

  /**
   * Combines all external tilesets in the given source, and writes
   * the result into the given target.
   *
   * The caller is responsible for opening and closing the given
   * source and target.
   *
   * @param tilesetSource - The tileset source
   * @param tilesetSourceJsonFileName - The name of the top-level tileset in
   * the given source (usually `tileset.json`).
   * @param tilesetTarget - The tileset target
   * @param tilesetTargetJsonFileName - The name of the top-level tileset in
   * the given target (usually `tileset.json`).
   * @returns A promise that resolves when the process is finished.
   * @throws TilesetError When the input tileset file can not be
   * found
   * @throws TilesetError If `open` was not called on the
   * input, or `begin` was not called on the output.
   */
  private async combineInternal(
    tilesetSource: TilesetSource,
    tilesetSourceJsonFileName: string,
    tilesetTarget: TilesetTarget,
    tilesetTargetJsonFileName: string
  ): Promise<void> {
    const tilesetJsonBuffer = tilesetSource.getValue(tilesetSourceJsonFileName);
    if (!tilesetJsonBuffer) {
      const message = `No ${tilesetSourceJsonFileName} found in input`;
      throw new TilesetError(message);
    }
    const tileset = JSON.parse(tilesetJsonBuffer.toString()) as Tileset;

    this.externalTilesetFileNames.length = 0;
    await this.combineTilesetsInternal(".", tileset, undefined);

    this.copyResources(tilesetTargetJsonFileName);

    const combinedTilesetJsonString = JSON.stringify(tileset, null, 2);
    const combinedTilesetJsonBuffer = Buffer.from(combinedTilesetJsonString);
    tilesetTarget.addEntry(
      tilesetTargetJsonFileName,
      combinedTilesetJsonBuffer
    );
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
      parentTile.boundingVolume = root.boundingVolume;
      parentTile.transform = root.transform;
    }
    await Tiles.traverseExplicit(root, async (tilePath: Tile[]) => {
      const tile = tilePath[tilePath.length - 1];
      await this.combineTileInternal(currentDirectory, tile);
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
  private async combineTileInternal(
    currentDirectory: string,
    tile: Tile
  ): Promise<void> {
    if (tile.content) {
      await this.combineContentInternal(currentDirectory, tile, tile.content);
    } else if (tile.contents) {
      for (const content of tile.contents) {
        await this.combineContentInternal(currentDirectory, tile, content);
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
  private async combineContentInternal(
    currentDirectory: string,
    tile: Tile,
    content: Content
  ): Promise<void> {
    if (!this.tilesetSource || !this.tilesetTarget) {
      throw new DeveloperError("The source and target must be defined");
    }

    const contentUri = content.uri;
    if (!contentUri) {
      // This is the case for legacy data (including some of the
      // original spec data), so handle this case explicitly here.
      throw new TilesetError("Content does not have a URI");
    }
    const externalFileName = Paths.join(currentDirectory, contentUri);
    const externalFileBuffer = this.tilesetSource.getValue(externalFileName);
    if (!externalFileBuffer) {
      throw new TilesetError(`No data found for ${externalFileName}`);
    }
    const contentData = new BufferedContentData(contentUri, externalFileBuffer);
    const isTileset = await this.externalTilesetDetector(contentData);
    if (!isTileset) {
      // When the data is not an external tileset, then just update
      // the content URI to point to the path that the content data
      // will end up in
      const newUri = Paths.relativize(".", externalFileName);
      content.uri = newUri;
    } else {
      // When the data is an external tileset, recursively combine
      // ("inline") that tileset, and insert its content, contents
      // and children into the current tile
      this.externalTilesetFileNames.push(externalFileName);
      const externalTilesetDirectory = path.dirname(externalFileName);
      const externalTilesetBuffer =
        this.tilesetSource.getValue(externalFileName);
      if (!externalTilesetBuffer) {
        throw new TilesetError(
          `Could not obtain data for external ` +
            `tileset file ${externalFileName}`
        );
      }
      const externalTileset = JSON.parse(
        externalTilesetBuffer.toString()
      ) as Tileset;
      await this.combineTilesetsInternal(
        externalTilesetDirectory,
        externalTileset,
        tile
      );
    }
  }

  /**
   * Copy all elements from the tileset source to the tileset target,
   * except for the ones that have been determined to be external
   * tilesets, and the one that has the given target name.
   *
   * This is supposed to be called when the `tilesetSource` and
   * `tilesetTarget` are defined, and BEFORE the entry for the
   * combined tileset JSON (with the given name) is added
   * to the target.
   *
   * @param tilesetTargetJsonFileName - The name of the target file
   * that will contain the combined tileset JSON
   */
  private copyResources(tilesetTargetJsonFileName: string): void {
    if (!this.tilesetSource || !this.tilesetTarget) {
      throw new DeveloperError("The source and target must be defined");
    }
    const entries = TilesetSources.getEntries(this.tilesetSource);
    for (const entry of entries) {
      const key = entry.key;
      if (key === tilesetTargetJsonFileName) {
        continue;
      }
      if (this.externalTilesetFileNames.includes(key)) {
        continue;
      }
      this.tilesetTarget.addEntry(key, entry.value);
    }
  }
}

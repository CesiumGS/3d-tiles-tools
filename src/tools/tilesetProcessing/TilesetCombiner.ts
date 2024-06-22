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

import { Loggers } from "../../base";
const logger = Loggers.get("tilesetProcessing");

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
    logger.debug(`Running combine`);
    logger.debug(`  tilesetSourceName: ${tilesetSourceName}`);
    logger.debug(`  tilesetTargetName: ${tilesetTargetName}`);

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

    logger.debug(`Running combine DONE`);
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
    await this.combineTilesetsInternal(".", tileset);

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
   */
  private async combineTilesetsInternal(
    currentDirectory: string,
    tileset: Tileset
  ): Promise<void> {
    // Traverse the tileset, depth-first, and call `combineTileInternal`
    // on each tile. If the tile contains a content with an external
    // tileset, then this external tileset will be "inlined". Note
    // that depending on the structure of the tileset, this may cause
    // new children to be added to the tile. This has to be taken
    // into account here (and this is the reason why this cannot
    // be implemented with `Tiles.traverseExplicit`).
    const root = tileset.root;
    const stack: Tile[] = [];
    stack.push(root);
    while (stack.length > 0) {
      const tile = stack[stack.length - 1];
      stack.pop();

      // Create a copy of the children array, to handle the
      // case that new children are added to the tile while
      // "inlining" the external tilesets.
      const children = tile.children?.slice();
      await this.combineTileInternal(currentDirectory, tile);
      if (children) {
        for (const child of children) {
          stack.push(child);
        }
      }
    }
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
      await this.combineSingleContentInternal(currentDirectory, tile);
    } else if (tile.contents) {
      await this.combineMultipleContentsInternal(currentDirectory, tile);
    }
  }

  /**
   * Processes an external tileset that was found during the traversal.
   * This will be called recursively on all external tilesets. It will
   * return the external tileset, AFTER it has itself been combined
   * by passing it to `combineTilesetsInternal`
   *
   * @param externalFileName - The full file name of the external tileset
   * @param externalFileBuffer - The buffer containing the JSON of the
   * external tileset
   * @returns The processed external tileset
   */
  private async processExternalTileset(
    externalFileName: string,
    externalFileBuffer: Buffer
  ) {
    this.externalTilesetFileNames.push(externalFileName);
    const externalTilesetDirectory = path.dirname(externalFileName);
    const externalTileset = JSON.parse(
      externalFileBuffer.toString()
    ) as Tileset;
    await this.combineTilesetsInternal(
      externalTilesetDirectory,
      externalTileset
    );
    return externalTileset;
  }

  /**
   * This is called for each tile of the source tileset that has a single
   * content.
   *
   * If the content points to an external tileset, then
   * - The external tileset is 'combined' by calling `processExternalTileset`
   * - The properties of the given tile are replaced with the properties of
   *   the root of the (combined) external tileset.
   *
   * Otherwise, the URL of the content is updated to be relative to
   * the root of the resulting combined tileset.
   *
   * @param currentDirectory - The current directory (see `combineTilesetsInternal`)
   * @param tile - The current tile
   */
  private async combineSingleContentInternal(
    currentDirectory: string,
    tile: Tile
  ): Promise<void> {
    if (!this.tilesetSource || !this.tilesetTarget) {
      throw new DeveloperError("The source and target must be defined");
    }
    const content = tile.content;
    if (!content) {
      throw new DeveloperError(
        "This should only be called for tiles with a single content"
      );
    }

    // Obtain the data of the content, and determine whether it is
    // an external tileset
    const contentUri = TilesetCombiner.obtainContentUri(content);
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
      return;
    }

    // The data is an external tileset. Process (combine) this
    // tileset, recursively
    const externalTileset = await this.processExternalTileset(
      externalFileName,
      externalFileBuffer
    );
    const externalRoot = externalTileset.root;

    // All relevant properties of the tile are replaced with
    // the properties of the external tileset root
    tile.geometricError = externalRoot.geometricError;
    tile.content = externalRoot.content;
    tile.contents = externalRoot.contents;
    tile.children = externalRoot.children;
    tile.boundingVolume = externalRoot.boundingVolume;
    tile.transform = externalRoot.transform;
  }

  /**
   * This is called for each tile of the source tileset that has multiple contents.
   *
   * It will process each content:
   *
   * If the content points to an external tileset, then
   * - The external tileset is 'combined' by calling `processExternalTileset`
   * - The root of this (combined) external tileset is added as a child to the give tile
   *
   * Otherwise, the URL of the content is updated to be relative to
   * the root of the resulting combined tileset.
   *
   * @param currentDirectory - The current directory (see `combineTilesetsInternal`)
   * @param tile - The current tile
   */
  private async combineMultipleContentsInternal(
    currentDirectory: string,
    tile: Tile
  ): Promise<void> {
    if (!this.tilesetSource || !this.tilesetTarget) {
      throw new DeveloperError("The source and target must be defined");
    }
    const contents = tile.contents;
    if (!contents) {
      throw new DeveloperError(
        "This should only be called for tiles with multiple contents"
      );
    }

    // The new contents (omitting the external tilesets),
    // and the new children (containing tiles for external tileset roots)
    const newContents: Content[] = [];
    let newChildren: Tile[] | undefined = undefined;

    for (const content of contents) {
      // Obtain the data of the content, and determine whether it is
      // an external tileset
      const contentUri = TilesetCombiner.obtainContentUri(content);
      const externalFileName = Paths.join(currentDirectory, contentUri);
      const externalFileBuffer = this.tilesetSource.getValue(externalFileName);
      if (!externalFileBuffer) {
        throw new TilesetError(`No data found for ${externalFileName}`);
      }
      const contentData = new BufferedContentData(
        contentUri,
        externalFileBuffer
      );
      const isTileset = await this.externalTilesetDetector(contentData);

      if (!isTileset) {
        // When the data is not an external tileset, then just update
        // the content URI to point to the path that the content data
        // will end up in
        const newUri = Paths.relativize(".", externalFileName);
        content.uri = newUri;
        newContents.push(content);
        continue;
      }

      // The data is an external tileset. Process (combine) this
      // tileset, recursively
      const externalTileset = await this.processExternalTileset(
        externalFileName,
        externalFileBuffer
      );
      const externalRoot = externalTileset.root;

      // Add a tile (that has the properties from the external tileset
      // root) as a new child
      const newChild: Tile = {
        geometricError: externalRoot.geometricError,
        content: externalRoot.content,
        contents: externalRoot.contents,
        children: externalRoot.children,
        boundingVolume: externalRoot.boundingVolume,
        transform: externalRoot.transform,
      };
      if (newChildren === undefined) {
        newChildren = [newChild];
      } else {
        newChildren.push(newChild);
      }
    }
    Tiles.setContents(tile, newContents);
    tile.children = newChildren;
  }

  /**
   * Returns the URI of the given content, handling the case that it
   * might be stored as the (legacy) `url` property.
   *
   * If the given content contains the (legacy) `url` property, then
   * it will be updated, in place: The `uri` property will be set to
   * the value of the `url` property, and the `url` property will
   * be deleted.
   *
   * @param content - The `Content`
   * @returns The content URI
   */
  private static obtainContentUri(content: Content): string {
    let contentUri = content.uri;
    if (contentUri !== undefined) {
      return contentUri;
    }
    // This is the case for legacy data (including some of the
    // original spec data), so handle this case explicitly here.
    const legacyContent = content as any;
    if (legacyContent.url === undefined) {
      // This should never be the case:
      throw new TilesetError(
        "Content does neither contain a 'uri' nor a (legacy) 'url' property"
      );
    }
    // Remove the legacy content.url, and set the URL
    // as the content.uri instead
    logger.warn(
      "The 'url' property of tile content is deprecated. Using 'uri' in combined result."
    );
    contentUri = legacyContent.url;
    delete legacyContent.url;
    legacyContent.uri = contentUri;
    return contentUri;
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

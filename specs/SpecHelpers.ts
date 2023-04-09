import fs from "fs";

import { Iterables } from "../src/base/Iterables";
import { Paths } from "../src/base/Paths";
import { DeveloperError } from "../src/base/DeveloperError";

import { Tile } from "../src/structure/Tile";
import { Tileset } from "../src/structure/Tileset";

import { Tiles } from "../src/tilesets/Tiles";

import { TilesetSourceResourceResolver } from "../src/io/TilesetSourceResourceResolver";

import { TilesetTraverser } from "../src/traversal/TilesetTraverser";

import { TilesetSource } from "../src/tilesetData/TilesetSource";

/**
 * Utility methods for the specs
 */
export class SpecHelpers {
  /**
   * Returns the given byte length, padded if necessary to
   * be a multiple of 8
   *
   * @param byteLength - The byte length
   * @returns The padded byte length
   */
  static getPaddedByteLength(byteLength: number): number {
    const boundary = 8;
    const remainder = byteLength % boundary;
    const padding = remainder === 0 ? 0 : boundary - remainder;
    return byteLength + padding;
  }

  /**
   * Forcefully deletes the given directory and all its contents
   * and subdirectories. Be careful.
   *
   * @param directory - The directory to delete
   */
  static forceDeleteDirectory(directory: string) {
    fs.rmSync(directory, {
      force: true,
      recursive: true,
    });
  }

  /**
   * Returns an array that contains the names of all files in
   * the given directory and its subdirectories, relative to
   * the given directory (with `/` as the path separator),
   * in unspecified order.
   *
   * @param directory - The directory
   * @returns The relative file names
   */
  static collectRelativeFileNames(directory: string): string[] {
    const allFiles = Iterables.overFiles(directory, true);
    const relativeFiles = Iterables.map(allFiles, (file: string) =>
      Paths.relativize(directory, file)
    );
    return Array.from(relativeFiles);
  }

  /**
   * Collect all content URIs that appear in the given tile or
   * any of its descendants, in unspecified order.
   *
   * @param startTile - The start tile
   * @returns A promise to all content URIs
   */
  static async collectExplicitContentUris(startTile: Tile) {
    const allContentUris: string[] = [];
    await Tiles.traverseExplicit(startTile, async (tiles: Tile[]) => {
      const tile = tiles[tiles.length - 1];
      const contentUris = Tiles.getContentUris(tile);
      allContentUris.push(...contentUris);
      return true;
    });
    return allContentUris;
  }

  /**
   * Collect all content URIs (excluding possible template URIs in
   * implicit tiling roots) that appear in the given tileset, in
   * unspecified order.
   *
   * @param tileset - The tileset
   * @param tilesetSource - The tileset source
   * @returns A promise to all content URIs
   */
  static async collectContentUris(
    tileset: Tileset,
    tilesetSource: TilesetSource
  ) {
    const resourceResolver = new TilesetSourceResourceResolver(
      ".",
      tilesetSource
    );
    const tilesetTraverser = new TilesetTraverser(".", resourceResolver, {
      depthFirst: false,
      traverseExternalTilesets: true,
    });
    const allContentUris: string[] = [];
    await tilesetTraverser.traverse(tileset, async (traversedTile) => {
      if (!traversedTile.isImplicitTilesetRoot()) {
        const contentUris = traversedTile.getFinalContents().map((c) => c.uri);
        allContentUris.push(...contentUris);
      }
      return true;
    });
    return allContentUris;
  }

  /**
   * Parse the tileset from the 'tileset.json' in the given source
   *
   * @param tilesetSource - The tileset source
   * @returns The tileset
   * @throws DeveloperError if the tileset could not be read
   */
  static parseTileset(tilesetSource: TilesetSource) {
    const tilesetJsonBuffer = tilesetSource.getValue("tileset.json");
    if (!tilesetJsonBuffer) {
      throw new DeveloperError("No tileset.json found in input");
    }
    try {
      const tileset = JSON.parse(tilesetJsonBuffer.toString()) as Tileset;
      return tileset;
    } catch (e) {
      throw new DeveloperError(`${e}`);
    }
  }
}

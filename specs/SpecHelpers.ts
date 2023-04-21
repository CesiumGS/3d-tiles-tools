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
import { TilesetSources } from "../src/tilesetData/TilesetSources";

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

  /**
   * Returns whether the specified packages are equal.
   *
   * This means that they contain the same keys, and the
   * keys are mapped to the same values.
   *
   * @param nameA - The first package name
   * @param nameB - The second package name
   * @returns A string describing the difference, or `undefined`
   * if there is no difference.
   */
  static computePackageDifference(
    nameA: string,
    nameB: string
  ): string | undefined {
    const tilesetSourceA = TilesetSources.createAndOpen(nameA);
    const tilesetSourceB = TilesetSources.createAndOpen(nameB);
    const result = SpecHelpers.computePackageDifferenceInternal(
      nameA,
      tilesetSourceA,
      nameB,
      tilesetSourceB
    );
    tilesetSourceA.close();
    tilesetSourceB.close();
    return result;
  }

  /**
   * Returns whether the specified packages are equal.
   *
   * This means that they contain the same keys, and the
   * keys are mapped to the same values.
   *
   * Entries that end in `.json` will be parsed and strigified
   * for the comparison (to handle formatting differences),
   * whereas other entries will be treated as "binary", and
   * their values will be compared byte-wise.
   *
   * @param nameA - The first package name
   * @param tilesetSourceA - The first package
   * @param nameB - The second package name
   * @param tilesetSourceB - The second package
   * @returns A string describing the difference, or `undefined`
   * if there is no difference.
   */
  static computePackageDifferenceInternal(
    nameA: string,
    tilesetSourceA: TilesetSource,
    nameB: string,
    tilesetSourceB: TilesetSource
  ): string | undefined {
    const keysA = [...tilesetSourceA.getKeys()].sort();
    const keysB = [...tilesetSourceB.getKeys()].sort();

    if (keysA.length != keysB.length) {
      return `There are ${keysA.length} keys in ${nameA} and ${keysB.length} keys in ${nameB}`;
    }
    for (let i = 0; i < keysA.length; i++) {
      if (keysA[i] != keysB[i]) {
        return `Key ${i} is ${keysA[i]} in ${nameA} and ${keysB[i]} in ${nameB}`;
      }
    }
    for (let i = 0; i < keysA.length; i++) {
      const valueA = tilesetSourceA.getValue(keysA[i]);
      const valueB = tilesetSourceB.getValue(keysB[i]);
      if (valueA && valueB) {
        if (keysA[i].endsWith(".json")) {
          const jsonA = JSON.parse(valueA.toString());
          const jsonB = JSON.parse(valueB.toString());
          const stringA = JSON.stringify(jsonA);
          const stringB = JSON.stringify(jsonB);
          if (stringA !== stringB) {
            return `Value ${keysA[i]} has different JSON contents in ${nameA} and in ${nameB}`;
          }
        } else {
          if (valueA?.length != valueB?.length) {
            return `Value ${keysA[i]} has ${valueA?.length} bytes in ${nameA} and ${valueB?.length} bytes in ${nameB}`;
          }
          const n = valueA.length;
          for (let j = 0; j < n; j++) {
            if (valueA[i] != valueB[i]) {
              return `Value ${keysA[i]} has ${valueA[i]} at index ${j} in ${nameA} but ${valueB[i]} in ${nameB}`;
            }
          }
        }
      }
    }
  }

  /**
   * Compares two arrays lexicographically.
   *
   * When the arrays have different lengths, then the shorter
   * one will be "padded" with elements that are smaller than
   * all other elements in the other array.
   *
   * @param a - The first array
   * @param b - The second array
   * @returns The result of the comparison
   */
  private static compareLexicographically(a: number[], b: number[]) {
    const n = Math.min(a.length, b.length);
    for (let i = 0; i < n; i++) {
      const d = a[i] - b[i];
      if (d !== 0) {
        return d;
      }
    }
    if (a.length < b.length) {
      return -1;
    }
    if (a.length > b.length) {
      return 1;
    }
    return 0;
  }

  /**
   * Sorts a 2D array lexicographically, in place.
   *
   * When two elements have different lengths, then the shorter
   * one will be "padded" with elements that are smaller than
   * all other elements in the other array.
   *
   * @param array - The array
   * @returns The array
   */
  static sortLexicographically(array: number[][]) {
    array.sort(SpecHelpers.compareLexicographically);
    return array;
  }
}

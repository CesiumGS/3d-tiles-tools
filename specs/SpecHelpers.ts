import fs from "fs";

import { Iterables } from "../src/base/Iterables";
import { Buffers } from "../src/base/Buffers";
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
   * Collect all content URIs that appear in the explicit tiles
   * of the specified tileset, in unspecified order
   *
   * @param tilesetFileName - The tileset file name
   * @returns A promise to all content URIs
   */
  static async collectExplicitContentUrisFromFile(tilesetFileName: string) {
    const tilesetJsonBuffer = fs.readFileSync(tilesetFileName);
    const tileset = JSON.parse(tilesetJsonBuffer.toString());
    const contentUris = await SpecHelpers.collectExplicitContentUris(
      tileset.root
    );
    return contentUris;
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
      const entryDifference = SpecHelpers.computeEntryDifference(
        keysA[i],
        nameA,
        valueA,
        nameB,
        valueB
      );
      if (entryDifference !== undefined) {
        return entryDifference;
      }
    }
  }

  /**
   * Computes the difference between two entries (with the same
   * key) in different packages.
   *
   * This usually compares the contents of the value buffers.
   * But for the case that the buffers contain (possibly zipped)
   * JSON data, it will check whether the JSON in both buffers
   * has the same structure, by parsing the JSON object and
   * serializing it again in the same way.
   *
   * @param key - The key
   * @param nameA - The name of the first package
   * @param valueA - The value for the key in the first package
   * @param nameB - The name of the second package
   * @param valueB - The value for the key in the second package
   * @returns A string describing the difference, or `undefined`
   * if there is no difference.
   */
  private static computeEntryDifference(
    key: string,
    nameA: string,
    valueA: Buffer | undefined,
    nameB: string,
    valueB: Buffer | undefined
  ): string | undefined {
    if (valueA && !valueB) {
      return `Value ${key} is present in ${nameA} but not in ${nameB}`;
    }
    if (!valueA && valueB) {
      return `Value ${key} is not present in ${nameA} but in ${nameB}`;
    }
    if (!valueA || !valueB) {
      return undefined;
    }

    // If the buffers contain zipped data, unzip it to get
    // rid of possible differences due to the time stamp
    // in the ZIP header
    let unzippedValueA = valueA;
    let unzippedValueB = valueB;
    const isZippedA = Buffers.isGzipped(valueA);
    const isZippedB = Buffers.isGzipped(valueB);
    if (isZippedA && isZippedB) {
      unzippedValueA = Buffers.gunzip(valueA);
      unzippedValueB = Buffers.gunzip(valueB);
    }

    // If both entries represent JSON, extract the (normalized) string
    // representation of that JSON data, and compare it.
    const isJsonA = Buffers.isProbablyJson(unzippedValueA);
    const isJsonB = Buffers.isProbablyJson(unzippedValueB);
    if (isJsonA && isJsonB) {
      const jsonStringA = SpecHelpers.createJsonString(unzippedValueA);
      const jsonStringB = SpecHelpers.createJsonString(unzippedValueB);
      if (jsonStringA !== jsonStringB) {
        return `Value ${key} has different JSON structures in ${nameA} and ${nameB}`;
      }
      return undefined;
    }

    // The entries are not JSON. Just compare the buffer data.
    if (unzippedValueA.length != unzippedValueB.length) {
      return `Value ${key} has ${unzippedValueA.length} bytes in ${nameA} and ${unzippedValueB.length} bytes in ${nameB}`;
    }
    const n = unzippedValueA.length;
    for (let j = 0; j < n; j++) {
      if (unzippedValueA[j] != unzippedValueB[j]) {
        return `Value ${key} has ${unzippedValueA[j]} at index ${j} in ${nameA} but ${unzippedValueB[j]} in ${nameB}`;
      }
    }

    return undefined;
  }

  /**
   * Create a JSON string from the given buffer, by parsing the
   * contents of the given buffer and serializing the parsed
   * result again.
   *
   * If the object cannot be parsed, then `undefined` is
   * returned.
   *
   * This is intended as a "normalization", to ignore details
   * like different indentations or line endings.
   *
   * @param buffer - The buffer
   * @returns The parsed and serialized object
   */
  static createJsonString(buffer: Buffer): string | undefined {
    try {
      const json = JSON.parse(buffer.toString());
      const jsonString = JSON.stringify(json, null, 2);
      return jsonString;
    } catch (e) {
      return undefined;
    }
  }

  /**
   * Compares two arrays of numbers lexicographically.
   *
   * When the arrays have different lengths, then the shorter
   * one will be "padded" with elements that are smaller than
   * all other elements in the other array.
   *
   * @param a - The first array
   * @param b - The second array
   * @returns The result of the comparison
   */
  private static compareNumbersLexicographically(a: number[], b: number[]) {
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
   * Sorts a 2D array of numbers lexicographically, in place.
   *
   * When two elements have different lengths, then the shorter
   * one will be "padded" with elements that are smaller than
   * all other elements in the other array.
   *
   * @param array - The array
   * @returns The array
   */
  static sortNumbersLexicographically(array: number[][]) {
    array.sort(SpecHelpers.compareNumbersLexicographically);
    return array;
  }

  /**
   * Compares two arrays of strings lexicographically.
   *
   * When the arrays have different lengths, then the shorter
   * one will be "padded" with elements that are smaller than
   * all other elements in the other array.
   *
   * @param a - The first array
   * @param b - The second array
   * @returns The result of the comparison
   */
  private static compareStringsLexicographically(a: string[], b: string[]) {
    const n = Math.min(a.length, b.length);
    for (let i = 0; i < n; i++) {
      const d = a[i].localeCompare(b[i]);
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
   * Sorts a 2D array of strings lexicographically, in place.
   *
   * When two elements have different lengths, then the shorter
   * one will be "padded" with elements that are smaller than
   * all other elements in the other array.
   *
   * @param array - The array
   * @returns The array
   */
  static sortStringsLexicographically(array: string[][]) {
    array.sort(SpecHelpers.compareStringsLexicographically);
    return array;
  }
}

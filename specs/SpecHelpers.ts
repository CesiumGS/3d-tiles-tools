import fs from "fs";

import { defaultValue } from "../src/base";
import { Iterables } from "../src/base";
import { Buffers } from "../src/base";
import { Paths } from "../src/base";
import { DeveloperError } from "../src/base";

import { Tile } from "../src/structure";
import { Tileset } from "../src/structure";

import { Tiles } from "../src/tilesets";
import { TilesetTraverser } from "../src/tilesets";
import { TilesetSource } from "../src/tilesets";
import { TilesetSources } from "../src/tilesets";
import { TilesetSourceResourceResolver } from "../src/tilesets";

/**
 * Utility methods for the specs
 */
export class SpecHelpers {
  /**
   * Returns the directory that was defined as the
   * `SPECS_DATA_BASE_DIRECTORY` environment variable
   * in the jasmine helpers (or `./specs/data` by
   * default)
   *
   * @returns The specs data base directory
   */
  static getSpecsDataBaseDirectory() {
    const directory = process.env.SPECS_DATA_BASE_DIRECTORY;
    if (directory === undefined) {
      return "./specs/data";
    }
    return directory;
  }

  /**
   * Reads a JSON file, parses it, and returns the result.
   * If the file cannot be read or parsed, then an error
   * message will be printed and `undefined` is returned.
   *
   * @param filePath - The path to the file
   * @returns The result or `undefined`
   */
  static readJsonUnchecked(filePath: string): any {
    try {
      const data = fs.readFileSync(filePath);
      try {
        const jsonString = data.toString();
        const result = JSON.parse(jsonString);
        return result;
      } catch (error) {
        console.error("Could parse JSON", error);
        return undefined;
      }
    } catch (error) {
      const resolved = Paths.resolve(filePath);
      console.error(
        `Could read JSON from ${filePath} resolved to ${resolved}`,
        error
      );
      return undefined;
    }
  }

  /**
   * Returns whether two numbers are equal, up to a certain epsilon
   *
   * @param left - The first value
   * @param right - The second value
   * @param relativeEpsilon - The maximum inclusive delta for the relative tolerance test.
   * @param absoluteEpsilon - The maximum inclusive delta for the absolute tolerance test.
   * @returns Whether the values are equal within the epsilon
   */
  static equalsEpsilon(
    left: number,
    right: number,
    relativeEpsilon: number,
    absoluteEpsilon?: number
  ) {
    relativeEpsilon = defaultValue(relativeEpsilon, 0.0);
    absoluteEpsilon = defaultValue(absoluteEpsilon, relativeEpsilon);
    const absDiff = Math.abs(left - right);
    return (
      absDiff <= absoluteEpsilon ||
      absDiff <= relativeEpsilon * Math.max(Math.abs(left), Math.abs(right))
    );
  }

  /**
   * A function for checking values for equality, taking into account the
   * possibility that the values are (potentially multi- dimensional)
   * arrays, and recursively comparing the elements in this case.
   * If the eventual elements are numbers, they are compared for
   * equality up to the given relative epsilon.
   *
   * This is ONLY used in the specs, to compare metadata values.
   *
   * @param a - The first element
   * @param b - The second element
   * @param epsilon - A relative epsilon
   * @returns Whether the objects are equal
   */
  static genericEquals(a: any, b: any, epsilon: number): boolean {
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) {
        return false;
      }

      for (let i = 0; i < a.length; ++i) {
        if (!SpecHelpers.genericEquals(a[i], b[i], epsilon)) {
          return false;
        }
      }
      return true;
    }
    if (typeof a === "number") {
      return SpecHelpers.equalsEpsilon(a, Number(b), epsilon);
    }
    return a === b;
  }

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

import path from "path";

import { Buffers, Iterables } from "../../base";

import { TilesetSource3tz } from "../packages/TilesetSource3tz";
import { TilesetSource3dtiles } from "../packages/TilesetSource3dtiles";

import { TilesetEntry } from "./TilesetEntry";
import { TilesetError } from "./TilesetError";
import { TilesetSource } from "./TilesetSource";
import { TilesetSourceFs } from "./TilesetSourceFs";

import { Loggers } from "../../base";
const logger = Loggers.get("tilesetData");

/**
 * Methods related to `TilesetSource` instances
 *
 * @internal
 */
export class TilesetSources {
  /**
   * Convenience method to create and open a tileset source for
   * the given name.
   *
   * This will call `TilesetSources.create` for the extension of
   * the given name, and immediately call `open(name)` on the
   * resulting source.
   *
   * @param name - The name
   * @returns The `TilesetSource`
   * @throws TilesetError If the input can not be opened
   */
  static async createAndOpen(name: string): Promise<TilesetSource> {
    let extension = path.extname(name).toLowerCase();
    if (extension === ".json") {
      extension = "";
      name = path.dirname(name);
    }
    const tilesetSource = TilesetSources.create(extension);
    if (!tilesetSource) {
      throw new TilesetError(
        `Could not create tileset source for name ${name} with extension "${extension}"`
      );
    }
    await tilesetSource.open(name);
    return tilesetSource;
  }

  /**
   * Create a tileset source from a given (full) name.
   *
   * The given name may have the extension `.3tz`, `.3dtiles`,
   * or `.json`, or no extension to indicate a directory.
   *
   * If the given name as the extension `.json`, then a source
   * for the directory that contains the given file is created.
   *
   * @param name - The name
   * @returns The `TilesetSource`
   * @throws TilesetError If the input can not be opened
   */
  static createFromName(name: string): TilesetSource {
    let extension = path.extname(name).toLowerCase();
    if (extension === ".json") {
      extension = "";
      name = path.dirname(name);
    }
    const tilesetSource = TilesetSources.create(extension);
    if (!tilesetSource) {
      throw new TilesetError(
        `Could not create tileset source for name ${name} with extension "${extension}"`
      );
    }
    return tilesetSource;
  }

  /**
   * Creates a TilesetSource, based on the given
   * file extension
   *
   * @param extension - The extension: '.3tz' or '.3dtiles'
   * or the empty string (for a directory)
   * @returns The TilesetSource, or `undefined` if the extension
   * is invalid
   */
  static create(extension: string): TilesetSource | undefined {
    if (extension === ".3tz") {
      return new TilesetSource3tz();
    }
    if (extension === ".3dtiles") {
      return new TilesetSource3dtiles();
    }
    if (extension === "") {
      return new TilesetSourceFs();
    }
    logger.error("Unknown tileset source type: " + extension);
    return undefined;
  }

  /**
   * Parses the JSON from the value with the given key (file name),
   * and returns the parsed result.
   *
   * This handles the case that the input data may be compressed
   * with GZIP, and will uncompress the data if necessary.
   *
   * @param tilesetSource - The `TilesetSource`
   * @param key - The key (file name)
   * @returns The parsed result
   * @throws TilesetError If the source is not opened, the specified
   * entry cannot be found, or the entry data could not be unzipped
   * (if it was zipped), or it could not be parsed as JSON.
   */
  static async parseSourceValue<T>(
    tilesetSource: TilesetSource,
    key: string
  ): Promise<T> {
    let value = await TilesetSources.getSourceValue(tilesetSource, key);
    if (Buffers.isGzipped(value)) {
      try {
        value = Buffers.gunzip(value);
      } catch (e) {
        const message = `Could not unzip ${key}: ${e}`;
        throw new TilesetError(message);
      }
    }
    try {
      const result = JSON.parse(value.toString()) as T;
      return result;
    } catch (e) {
      const message = `Could not parse ${key}: ${e}`;
      throw new TilesetError(message);
    }
  }

  /**
   * Obtains the value for the given key from the given tileset source,
   * throwing an error if the source is not opened, or when the
   * given key cannot be found.
   *
   * @param tilesetSource - The `TilesetSource`
   * @param key - The key (file name)
   * @returns The value (file contents)
   * @throws DeveloperError When the source is not opened
   * @throws TilesetError When the given key cannot be found
   */
  static async getSourceValue(
    tilesetSource: TilesetSource,
    key: string
  ): Promise<Buffer> {
    const buffer = await tilesetSource.getValue(key);
    if (!buffer) {
      const message = `No ${key} found in input`;
      throw new TilesetError(message);
    }
    return buffer;
  }

  /**
   * Returns an iterable iterator over the entries of the given
   * tileset source.
   *
   * @param tilesetSource - The `TilesetSource`
   * @returns The iterator over the entries
   */
  static async getEntries(
    tilesetSource: TilesetSource
  ): Promise<AsyncIterable<TilesetEntry>> {
    const keys = await tilesetSource.getKeys();
    const entries = Iterables.mapAsync(keys, async (k) => {
      const v = await tilesetSource.getValue(k);
      if (!v) {
        throw new TilesetError(`No value found for key ${k}`);
      }
      const e: TilesetEntry = {
        key: k,
        value: v,
      };
      return e;
    });
    return entries;
  }
}

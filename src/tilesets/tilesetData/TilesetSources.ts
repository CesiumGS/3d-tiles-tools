import path from "path";

import { Iterables } from "../../base";

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
   * Create and open a source for the given name.
   *
   * The given name may have the extension `.3tz` or `.3dtiles`,
   * or no extension to indicate a directory.
   *
   * If the given name as the extension `.json`, then a source
   * for the directory that contains the given file is created.
   *
   * @param name - The name
   * @returns The `TilesetSource`
   * @throws TilesetError If the input can not be opened
   */
  static createAndOpen(name: string): TilesetSource {
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
    tilesetSource.open(name);
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
   * Returns an iterable iterator over the entries of the given
   * tileset source.
   *
   * @param tilesetSource - The `TilesetSource`
   * @returns The iterator over the entries
   */
  static getEntries(tilesetSource: TilesetSource): Iterable<TilesetEntry> {
    const keys = tilesetSource.getKeys();
    const entries = Iterables.map(keys, (k) => {
      const v = tilesetSource.getValue(k);
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

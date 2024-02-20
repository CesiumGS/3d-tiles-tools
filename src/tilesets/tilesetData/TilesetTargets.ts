import path from "path";

import { TilesetTarget3tz } from "../packages/TilesetTarget3tz";
import { TilesetTarget3dtiles } from "../packages/TilesetTarget3dtiles";

import { TilesetTarget } from "./TilesetTarget";
import { TilesetError } from "./TilesetError";
import { TilesetTargetFs } from "./TilesetTargetFs";
import { TilesetEntry } from "./TilesetEntry";

import { Loggers } from "../../base";
const logger = Loggers.get("tilesetData");

/**
 * Methods related to `TilesetTarget` instances
 *
 * @internal
 */
export class TilesetTargets {
  /**
   * Create a tileset target for the given name, and prepare
   * it to accept entries.
   *
   * The given name may have the extension `.3tz` or `.3dtiles`,
   * or no extension to indicate a directory.
   *
   * If the given name as the extension `.json`, then a target
   * for the directory that contains the given file is created.
   *
   * @param name - The name
   * @param overwrite - Whether existing output files should be overwritten
   * @returns The `TilesetTarget`
   * @throws TilesetError If the output can not be opened
   */
  static createAndBegin(name: string, overwrite: boolean): TilesetTarget {
    let extension = path.extname(name).toLowerCase();
    if (extension === ".json") {
      extension = "";
      name = path.dirname(name);
    }
    const tilesetTarget = TilesetTargets.create(extension);
    if (!tilesetTarget) {
      throw new TilesetError(
        `Could not create tileset target for name ${name} with extension "${extension}"`
      );
    }
    tilesetTarget.begin(name, overwrite);
    return tilesetTarget;
  }

  /**
   * Creates a TilesetTarget, based on the given
   * file extension
   *
   * @param extension - The extension: '.3tz' or '.3dtiles'
   * or the empty string (for a directory)
   * @returns The TilesetTarget, or `undefined` if the
   * extension is invalid
   */
  static create(extension: string): TilesetTarget | undefined {
    if (extension === ".3tz") {
      return new TilesetTarget3tz();
    }
    if (extension === ".3dtiles") {
      return new TilesetTarget3dtiles();
    }
    if (extension === "") {
      return new TilesetTargetFs();
    }
    logger.error("Unknown target type: " + extension);
    return undefined;
  }

  /**
   * Put all the given entries into the given tileset target.
   *
   * @param tilesetTarget - The `TilesetTarget`
   * @param entries - The iterator over the entries
   */
  static putEntries(
    tilesetTarget: TilesetTarget,
    entries: Iterable<TilesetEntry>
  ) {
    for (const entry of entries) {
      tilesetTarget.addEntry(entry.key, entry.value);
    }
  }
}

import path from "path";

import { TilesetTarget3tz } from "../packages/TilesetTarget3tz";
import { TilesetTarget3dtiles } from "../packages/TilesetTarget3dtiles";

import { TilesetTarget } from "./TilesetTarget";
import { TilesetError } from "./TilesetError";
import { TilesetTargetFs } from "./TilesetTargetFs";

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
   * This will call `createFromName`, and immediately call `begin`
   * on the resulting target.
   *
   * @param name - The name
   * @param overwrite - Whether existing output files should be overwritten
   * @returns The `TilesetTarget`
   * @throws TilesetError If the output can not be opened
   */
  static async createAndBegin(
    name: string,
    overwrite: boolean
  ): Promise<TilesetTarget> {
    const tilesetTarget = TilesetTargets.createFromName(name);
    await tilesetTarget.begin(name, overwrite);
    return tilesetTarget;
  }

  /**
   * Create a tileset target for the given name.
   *
   * The given name may have the extension `.3tz` or `.3dtiles`,
   * or no extension to indicate a directory.
   *
   * If the given name as the extension `.json`, then a target
   * for the directory that contains the given file is created.
   *
   * @param name - The name
   * @returns The `TilesetTarget`
   * @throws TilesetError If the output can not be opened
   */
  static createFromName(name: string): TilesetTarget {
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
}

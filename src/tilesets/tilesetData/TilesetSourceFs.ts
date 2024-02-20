import fs from "fs";
import path from "path";

import { Paths } from "../../base";
import { Iterables } from "../../base";

import { TilesetSource } from "./TilesetSource";
import { TilesetError } from "./TilesetError";

/**
 * Implementation of a TilesetSource based on a directory
 * in a file system
 *
 * @internal
 */
export class TilesetSourceFs implements TilesetSource {
  /**
   * The full name of the directory that contains the tileset.json file
   */
  private fullInputName: string | undefined;

  /**
   * Default constructor
   */
  constructor() {
    this.fullInputName = undefined;
  }

  /** {@inheritDoc TilesetSource.open} */
  open(fullInputName: string) {
    if (this.fullInputName) {
      throw new TilesetError("Source already opened");
    }
    this.fullInputName = fullInputName;
  }

  /** {@inheritDoc TilesetSource.getKeys} */
  getKeys() {
    if (!this.fullInputName) {
      throw new TilesetError("Source is not opened. Call 'open' first.");
    }
    const files = Iterables.overFiles(this.fullInputName, true);

    const fullInputName = this.fullInputName;
    return Iterables.map(files, (file) =>
      Paths.relativize(fullInputName, file)
    );
  }

  /** {@inheritDoc TilesetSource.getValue} */
  getValue(key: string): Buffer | undefined {
    if (!this.fullInputName) {
      throw new TilesetError("Source is not opened. Call 'open' first.");
    }
    const fullFileName = path.join(this.fullInputName, key);
    if (!fs.existsSync(fullFileName)) {
      return undefined;
    }
    const data = fs.readFileSync(fullFileName);
    if (data === null) {
      return undefined;
    }
    return data;
  }

  /** {@inheritDoc TilesetSource.close} */
  close() {
    if (!this.fullInputName) {
      throw new TilesetError("Source is not opened. Call 'open' first.");
    }
    this.fullInputName = undefined;
  }
}

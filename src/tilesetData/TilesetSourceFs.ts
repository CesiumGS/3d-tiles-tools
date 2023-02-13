import fs from "fs";
import path from "path";

import { defined } from "../base/defined";
import { Paths } from "../base/Paths";
import { Iterables } from "../base/Iterables";

import { TilesetSource } from "./TilesetSource";
import { TilesetError } from "./TilesetError";

/**
 * Implementation of a TilesetSource based on a directory
 * in a file system
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

  open(fullInputName: string) {
    if (defined(this.fullInputName)) {
      throw new TilesetError("Source already opened");
    }
    this.fullInputName = fullInputName;
  }

  getKeys() {
    if (!defined(this.fullInputName)) {
      throw new TilesetError("Source is not opened. Call 'open' first.");
    }
    const files = Iterables.overFiles(this.fullInputName!, true);
    return Iterables.map(files, (file) =>
      Paths.relativize(this.fullInputName!, file)
    );
  }

  getValue(key: string) {
    if (!defined(this.fullInputName)) {
      throw new TilesetError("Source is not opened. Call 'open' first.");
    }
    const fullFileName = path.join(this.fullInputName!, key);
    if (!fs.existsSync(fullFileName)) {
      return undefined;
    }
    const data = fs.readFileSync(fullFileName);
    return data;
  }

  close() {
    if (!defined(this.fullInputName)) {
      throw new TilesetError("Source is not opened. Call 'open' first.");
    }
    this.fullInputName = undefined;
  }
}

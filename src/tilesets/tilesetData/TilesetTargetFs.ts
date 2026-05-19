import fs from "fs";
import path from "path";

import { Paths } from "../../base";
import { TilesetTarget } from "./TilesetTarget";
import { TilesetError } from "./TilesetError";

/**
 * Implementation of a TilesetTarget that writes into
 * a directory of a file system
 *
 * @internal
 */
export class TilesetTargetFs implements TilesetTarget {
  /**
   * The name of the output directory
   */
  private fullOutputName: string | undefined;

  /**
   * Whether output files should be overwritten if they
   * already exist.
   */
  private overwrite: boolean;

  /**
   * Default constructor
   */
  constructor() {
    this.fullOutputName = undefined;
    this.overwrite = false;
  }

  /** {@inheritDoc TilesetTarget.begin} */
  async begin(fullOutputName: string, overwrite: boolean) {
    if (this.fullOutputName) {
      throw new TilesetError("Target already opened");
    }
    const extension = path.extname(fullOutputName);
    if (extension === "") {
      this.fullOutputName = fullOutputName;
    } else {
      this.fullOutputName = path.dirname(fullOutputName);
    }
    this.overwrite = overwrite;
    if (!fs.existsSync(this.fullOutputName)) {
      fs.mkdirSync(this.fullOutputName, { recursive: true });
    }
  }

  /** {@inheritDoc TilesetTarget.addEntry} */
  async addEntry(key: string, content: Buffer) {
    if (!this.fullOutputName) {
      throw new TilesetError("Target is not opened. Call 'begin' first.");
    }
    const fullOutputFileName = path.join(this.fullOutputName, key);
    if (fs.existsSync(fullOutputFileName)) {
      if (!this.overwrite) {
        throw new TilesetError("File already exists: " + fullOutputFileName);
      }
    }
    Paths.ensureDirectoryExists(path.dirname(fullOutputFileName));
    fs.writeFileSync(fullOutputFileName, content);
  }

  /** {@inheritDoc TilesetTarget.end} */
  async end() {
    if (!this.fullOutputName) {
      throw new TilesetError("Target is not opened. Call 'begin' first.");
    }
    this.fullOutputName = undefined;
    this.overwrite = false;
  }
}

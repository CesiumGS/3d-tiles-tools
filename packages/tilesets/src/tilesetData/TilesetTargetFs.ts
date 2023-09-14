import fs from "fs";
import path from "path";

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
  begin(fullOutputName: string, overwrite: boolean) {
    if (this.fullOutputName) {
      throw new TilesetError("Target already opened");
    }
    this.fullOutputName = fullOutputName;
    this.overwrite = overwrite;
    if (!fs.existsSync(fullOutputName)) {
      fs.mkdirSync(fullOutputName, { recursive: true });
    }
  }

  /** {@inheritDoc TilesetTarget.addEntry} */
  addEntry(key: string, content: Buffer) {
    if (!this.fullOutputName) {
      throw new TilesetError("Target is not opened. Call 'begin' first.");
    }
    const fullOutputFileName = path.join(this.fullOutputName, key);
    if (fs.existsSync(fullOutputFileName)) {
      if (!this.overwrite) {
        throw new TilesetError("File already exists: " + fullOutputFileName);
      }
    }
    // TODO Need to unlink if file exists?
    fs.mkdirSync(path.dirname(fullOutputFileName), { recursive: true });
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

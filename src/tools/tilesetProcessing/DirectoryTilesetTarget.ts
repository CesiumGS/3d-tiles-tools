import fs from "fs";
import path from "path";

import { TilesetTarget } from "../../tilesets";

/**
 * A `TilesetTarget` that writes entries into a directory.
 *
 * Unlike the file system target of the 3D Tiles tools, this treats
 * the given name strictly as a directory, so directory names that
 * contain a dot (like `output/1.0`) work as expected.
 */
export class DirectoryTilesetTarget implements TilesetTarget {
  private directory: string | undefined;
  private overwrite = false;

  /**
   * Opens the target.
   *
   * @param directory - The output directory
   * @param overwrite - Whether existing files may be overwritten
   */
  async begin(directory: string, overwrite: boolean): Promise<void> {
    if (this.directory !== undefined) {
      throw new Error("Target already opened");
    }
    this.directory = directory;
    this.overwrite = overwrite;
    fs.mkdirSync(directory, { recursive: true });
  }

  async addEntry(key: string, content: Buffer): Promise<void> {
    if (this.directory === undefined) {
      throw new Error("Target is not opened. Call 'begin' first.");
    }
    const fileName = path.resolve(this.directory, key);
    const root = path.resolve(this.directory);
    if (fileName !== root && !fileName.startsWith(root + path.sep)) {
      throw new Error(
        `Entry key ${key} points outside of the output directory`
      );
    }
    if (!this.overwrite && fs.existsSync(fileName)) {
      throw new Error(`File already exists: ${fileName}`);
    }
    fs.mkdirSync(path.dirname(fileName), { recursive: true });
    fs.writeFileSync(fileName, content);
  }

  async end(): Promise<void> {
    if (this.directory === undefined) {
      throw new Error("Target is not opened. Call 'begin' first.");
    }
    this.directory = undefined;
    this.overwrite = false;
  }
}

import fs from "fs";
import path from "path";

import { Database } from "better-sqlite3";
import DatabaseConstructor from "better-sqlite3";

import { TilesetTarget } from "../tilesetData/TilesetTarget";
import { TilesetError } from "../tilesetData/TilesetError";

/**
 * Implementation of a TilesetTarget that creates a
 * 3DTILES (SQLITE3 database) file.
 *
 * @internal
 */
export class TilesetTarget3dtiles implements TilesetTarget {
  /**
   * The database
   */
  private db: Database | undefined;

  /**
   * Default constructor
   */
  constructor() {
    this.db = undefined;
  }

  /** {@inheritDoc TilesetTarget.begin} */
  begin(fullOutputName: string, overwrite: boolean): void {
    if (fs.existsSync(fullOutputName)) {
      if (overwrite) {
        fs.unlinkSync(fullOutputName);
      } else {
        throw new TilesetError("File already exists: " + fullOutputName);
      }
    } else {
      const directory = path.dirname(fullOutputName);
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }
    }

    if (this.db) {
      throw new TilesetError("Target already opened");
    }
    this.db = new DatabaseConstructor(fullOutputName);
    this.db.prepare("PRAGMA journal_mode=off;").run();
    this.db.prepare("BEGIN").run();
    this.db
      .prepare("CREATE TABLE media (key TEXT PRIMARY KEY, content BLOB)")
      .run();
  }

  /** {@inheritDoc TilesetTarget.addEntry} */
  addEntry(key: string, content: Buffer): void {
    if (!this.db) {
      throw new TilesetError("Target is not opened. Call 'begin' first.");
    }
    const insertion = this.db.prepare("INSERT INTO media VALUES (?, ?)");
    insertion.run(key, content);
  }

  /** {@inheritDoc TilesetTarget.end} */
  async end(): Promise<void> {
    if (!this.db) {
      throw new TilesetError("Target is not opened. Call 'begin' first.");
    }
    this.db.prepare("COMMIT").run();
    this.db.close();
    this.db = undefined;
  }
}

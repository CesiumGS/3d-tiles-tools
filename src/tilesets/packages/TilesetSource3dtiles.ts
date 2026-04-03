import { Database } from "better-sqlite3";
import DatabaseConstructor from "better-sqlite3";

import { Iterables } from "../../base";

import { TilesetSource } from "../tilesetData/TilesetSource";
import { TilesetError } from "../tilesetData/TilesetError";

import { TableStructure } from "./TableStructureValidator";
import { TableStructureValidator } from "./TableStructureValidator";

/**
 * Implementation of a TilesetSource based on a 3DTILES (SQLITE3 database)
 * file.
 *
 * @internal
 */
export class TilesetSource3dtiles implements TilesetSource {
  /**
   * The database, or undefined if the database is not opened
   */
  private db: Database | undefined;

  /**
   * Default constructor
   */
  constructor() {
    this.db = undefined;
  }

  /** {@inheritDoc TilesetSource.open} */
  async open(fullInputName: string): Promise<void> {
    if (this.db) {
      throw new TilesetError("Database already opened");
    }
    this.db = new DatabaseConstructor(fullInputName);

    const tableStructure: TableStructure = {
      name: "media",
      columns: [
        {
          name: "key",
          type: "TEXT",
        },
        {
          name: "content",
          type: "BLOB",
        },
      ],
    };
    const message = TableStructureValidator.validate(this.db, tableStructure);
    if (message) {
      await this.close();
      throw new TilesetError(message);
    }
  }

  /** {@inheritDoc TilesetSource.getKeys} */
  async getKeys(): Promise<AsyncIterable<string>> {
    if (!this.db) {
      throw new TilesetError("Source is not opened. Call 'open' first.");
    }
    const selection = this.db.prepare("SELECT * FROM media");
    const iterable = {
      [Symbol.iterator]: function (): Iterator<any> {
        return selection.iterate();
      },
    };
    return Iterables.makeAsync(Iterables.map(iterable, (row: any) => row.key));
  }

  /** {@inheritDoc TilesetSource.getValue} */
  async getValue(key: string): Promise<Buffer | undefined> {
    if (!this.db) {
      throw new Error("Source is not opened. Call 'open' first.");
    }
    const selection = this.db.prepare("SELECT * FROM media WHERE key = ?");
    const row = selection.get(key) as any;
    if (row) {
      return row.content;
    }
    return undefined;
  }

  /** {@inheritDoc TilesetSource.close} */
  async close(): Promise<void> {
    if (!this.db) {
      throw new Error("Source is not opened. Call 'open' first.");
    }
    this.db.close();
    this.db = undefined;
  }
}

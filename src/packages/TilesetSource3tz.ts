import fs from "fs";

import { defined } from "../base/defined";

import { TilesetSource } from "../tilesetData/TilesetSource";
import { TilesetError } from "../tilesetData/TilesetError";

import { IndexEntry } from "./IndexEntry";
import { ArchiveFunctions3tz } from "./ArchiveFunctions3tz";

/**
 * Implementation of a TilesetSource based on a 3TZ file.
 *
 * @internal
 */
export class TilesetSource3tz implements TilesetSource {
  /**
   * The file descriptor that was created from the input file
   */
  private fd: number | undefined;

  /**
   * The ZIP index.
   *
   * This is created from the `"@3dtilesIndex1@"` file of a 3TZ file.
   *
   * It is an array if `IndexEntry` objects, sorted by the MD5 hash,
   * in ascending order.
   */
  private zipIndex: IndexEntry[] | undefined;

  /**
   * Default constructor
   */
  constructor() {
    this.fd = undefined;
    this.zipIndex = undefined;
  }

  getZipIndex(): IndexEntry[] | undefined {
    return this.zipIndex;
  }

  /** {@inheritDoc TilesetSource.open} */
  open(fullInputName: string) {
    if (defined(this.fd)) {
      throw new TilesetError("Source already opened");
    }

    this.fd = fs.openSync(fullInputName, "r");
    this.zipIndex = ArchiveFunctions3tz.readZipIndex(this.fd);
  }

  /** {@inheritDoc TilesetSource.getKeys} */
  getKeys(): IterableIterator<string> {
    if (!defined(this.fd) || !this.zipIndex) {
      throw new TilesetError("Source is not opened. Call 'open' first.");
    }
    return TilesetSource3tz.createKeysIterator(this.fd, this.zipIndex);
  }

  private static createKeysIterator(fd: number, zipIndex: IndexEntry[]) {
    let index = 0;
    const iterator = {
      [Symbol.iterator]() {
        return this;
      },
      next(): IteratorResult<string, any> {
        if (index >= zipIndex.length) {
          return { value: undefined, done: true };
        }
        const entry = zipIndex[index];
        const offset = entry.offset;
        const fileName = ArchiveFunctions3tz.readFileName(fd, offset);
        const result = {
          value: fileName,
          done: false,
        };
        index++;
        return result;
      },
    };
    return iterator;
  }

  /** {@inheritDoc TilesetSource.getValue} */
  getValue(key: string): Buffer | undefined {
    if (!defined(this.fd) || !this.zipIndex) {
      throw new TilesetError("Source is not opened. Call 'open' first.");
    }
    const entryData = ArchiveFunctions3tz.readEntryData(
      this.fd,
      this.zipIndex,
      key
    );
    return entryData;
  }

  /** {@inheritDoc TilesetSource.close} */
  close() {
    if (!defined(this.fd) || !this.zipIndex) {
      throw new TilesetError("Source is not opened. Call 'open' first.");
    }
    fs.closeSync(this.fd);

    this.fd = undefined;
    this.zipIndex = undefined;
  }
}

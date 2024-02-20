import fs from "fs";
import zlib from "zlib";

import { defined } from "../../base";

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
   * It is an array of `IndexEntry` objects, sorted by the MD5 hash,
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
  getKeys(): Iterable<string> {
    if (!defined(this.fd) || !this.zipIndex) {
      throw new TilesetError("Source is not opened. Call 'open' first.");
    }
    return TilesetSource3tz.createKeysIterable(this.fd, this.zipIndex);
  }

  private static createKeysIterable(
    fd: number,
    zipIndex: IndexEntry[]
  ): Iterable<string> {
    const iterable = {
      [Symbol.iterator]: function* (): Iterator<string> {
        for (let index = 0; index < zipIndex.length; index++) {
          const entry = zipIndex[index];
          const offset = entry.offset;
          const fileName = ArchiveFunctions3tz.readFileName(fd, offset);
          yield fileName;
        }
      },
    };
    return iterable;
  }

  /** {@inheritDoc TilesetSource.getValue} */
  getValue(key: string): Buffer | undefined {
    if (!defined(this.fd) || !this.zipIndex) {
      throw new TilesetError("Source is not opened. Call 'open' first.");
    }
    const entry = ArchiveFunctions3tz.readEntry(this.fd, this.zipIndex, key);
    if (!entry) {
      return undefined;
    }
    if (entry.compression_method === 8) {
      // Indicating DEFLATE
      const inflatedData = zlib.inflateRawSync(entry.data);
      return inflatedData;
    }
    return entry.data;
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

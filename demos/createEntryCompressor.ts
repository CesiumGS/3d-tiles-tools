import zlib from "zlib";

import { shouldGzip } from "./shouldGzip";
import { TilesetEntry } from "../src/tilesetData/TilesetEntry";

/**
 * Creates a function that may apply compression to certain entries
 * for a 3D Tiles data set.
 *
 * The function will receive TilesetEntry objects, and return new
 * TilesetEntry objects, with the value (buffer) potentially
 * containing a compressed version of the original data.
 *
 * The exact criteria for compressing files are not specified.
 *
 * @returns The compression function
 */
export function createEntryCompressor(): {
  (e: TilesetEntry): TilesetEntry;
} {
  const entryCompressor = (entry: TilesetEntry): TilesetEntry => {
    const key = entry.key;
    let value = entry.value;
    if (shouldGzip(entry.key, entry.value)) {
      value = zlib.gzipSync(entry.value);
    }
    return {
      key: key,
      value: value,
    };
  };
  return entryCompressor;
}

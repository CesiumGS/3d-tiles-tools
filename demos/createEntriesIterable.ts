import fs from "fs";

import { Iterables } from "../src/base/Iterables";
import { Paths } from "../src/base/Paths";

import { TilesetEntry } from "../src/tilesetData/TilesetEntry";

/**
 * Creates a generator that allows iterating over files in a directory
 * and its subdirectories, and offers them in the form of 'TilesetEntry'
 * objects.
 *
 * @param directory The directory
 * @return The generator for TilesetEntry objects
 */
export function createEntriesIterable(
  directory: string
): IterableIterator<TilesetEntry> {
  const files = Iterables.overFiles(directory, true);

  const createEntry = (file: string): TilesetEntry => {
    const key = Paths.relativize(directory, file);
    const data = fs.readFileSync(file);
    const entry = {
      key: key,
      value: data,
    };
    return entry;
  };
  return Iterables.map(files, createEntry);
}

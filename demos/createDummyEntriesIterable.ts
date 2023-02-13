import seedrandom from "seedrandom";

import { defaultValue } from "../src/base/defaultValue";

import { TilesetEntry } from "../src/tilesetData/TilesetEntry";

/**
 * Creates a generator that allows iterating over "dummy" entries
 * for a 3D tiles data set, in the form of TilesetEntry objects.
 *
 * The sizes of the TilesetEntry#value buffers will be randomized
 * in the specified range, with the given random seed.
 *
 * @param numEntries The number of entries to generate
 * @param minSize The minimum size of an entry, inclusive
 * @param maxSize The maximum size of an entry, exclusive
 * @param seed The optional random seed
 * @return The generator for entry objects
 */
export function* createDummyEntriesIterable(
  numEntries: number,
  minSize: number,
  maxSize: number,
  seed: string
): IterableIterator<TilesetEntry> {
  const random = seedrandom(defaultValue(seed, "0"));
  const templateBuffer = Buffer.alloc(maxSize);
  let index = 0;
  while (index < numEntries) {
    const key = "example" + index + ".glb";
    const r = random();
    const size = Math.floor(minSize + r * (maxSize - minSize));
    const buffer = templateBuffer.subarray(0, size);
    const entry = {
      key: key,
      value: buffer,
    };
    index++;
    yield entry;
  }
}

import util from "util";
import seedrandom from "seedrandom";

import { BenchmarkConfig } from "./BenchmarkConfig";

import { TilesetEntry } from "3d-tiles-tools";

/**
 * Methods related to the 3D Tiles Package benchmarks.
 */
export class BenchmarkUtils {
  /**
   * Creates a buffer that contains the JSON data of an unspecified (but
   * complete and valid) tileset JSON file.
   *
   * @returns The Buffer containing dummy JSON data
   */
  static createDummyTilesetJsonBuffer(): Buffer {
    const dummyTilesetJsonString = `
  {
    "asset" : {
      "version" : "1.1"
    },
    "geometricError" : 2.0,
    "root" : {
      "boundingVolume" : {
        "box" : [ 0.5, 0.5, 0.5, 0.5, 0.0, 0.0, 0.0, 0.5, 0.0, 0.0, 0.0, 0.5 ]
      },
      "geometricError" : 1.0
    }
  }
  `;
    const dummyTilesetJsonBuffer = Buffer.from(dummyTilesetJsonString, "utf-8");
    return dummyTilesetJsonBuffer;
  }

  /**
   * Returns a list of benchmark configurations.
   *
   * @returns The list
   */
  static createBenchmarkConfigs(): BenchmarkConfig[] {
    const configs: BenchmarkConfig[] = [];

    //configs.push({ numEntries: 10, minSize: 10000, maxSize: 100000 });
    //*/
    configs.push({ numEntries: 100, minSize: 1000, maxSize: 1000 });
    configs.push({ numEntries: 1000, minSize: 1000, maxSize: 1000 });
    configs.push({ numEntries: 10000, minSize: 1000, maxSize: 1000 });
    configs.push({ numEntries: 100000, minSize: 1000, maxSize: 1000 });

    configs.push({ numEntries: 10, minSize: 10000, maxSize: 100000 });
    configs.push({ numEntries: 100, minSize: 10000, maxSize: 100000 });
    configs.push({ numEntries: 1000, minSize: 10000, maxSize: 100000 });

    configs.push({ numEntries: 10, minSize: 10000, maxSize: 10000000 });
    configs.push({ numEntries: 100, minSize: 10000, maxSize: 10000000 });
    configs.push({ numEntries: 1000, minSize: 10000, maxSize: 10000000 });
    //*/

    return configs;
  }

  /**
   * Creates an unspecified string containing information about the
   * given configuration, that may be used as part of a file name
   * or log message.
   *
   * @param config The configuration
   * @returns The string
   */
  static createConfigString(config: BenchmarkConfig): string {
    const numEntries = config.numEntries;
    const minSize = config.minSize;
    const maxSize = config.maxSize;
    const configString = util.format(
      "numEntries %d - minSize %d - maxSize %d",
      numEntries,
      minSize,
      maxSize
    );
    return configString;
  }

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
   * @param seed The random seed. An arbitrary string.
   * @returns The generator for entry objects
   */
  static createDummyEntriesIterable(
    config: BenchmarkConfig
  ): Iterable<TilesetEntry> {
    return BenchmarkUtils.createDummyEntriesIterableInternal(
      config.numEntries,
      config.minSize,
      config.maxSize,
      "0"
    );
  }

  /**
   * Creates a generator that allows iterating over "dummy" entries
   * for a 3D tiles data set, in the form of TilesetEntry objects.
   *
   * The sizes of the TilesetEntry#value buffers will be randomized
   * in the specified range, with the given random seed.
   *
   * The buffers will contain all-zero data, and can therefore not
   * sensibly be used for any test or benchmark that involves GZIP
   * compression.
   *
   * @param numEntries The number of entries to generate
   * @param minSize The minimum size of an entry, inclusive
   * @param maxSize The maximum size of an entry, exclusive
   * @param seed The random seed. An arbitrary string.
   * @return The generator for entry objects
   */
  static createDummyEntriesIterableInternal(
    numEntries: number,
    minSize: number,
    maxSize: number,
    seed: string
  ): Iterable<TilesetEntry> {
    const iterable = {
      [Symbol.iterator]: function* () {
        const random = seedrandom(seed);
        const templateBuffer = Buffer.alloc(maxSize);
        for (let index = 0; index < numEntries; index++) {
          const key = "example" + index + ".glb";
          const r = random();
          const size = Math.floor(minSize + r * (maxSize - minSize));
          const buffer = templateBuffer.subarray(0, size);
          const entry = {
            key: key,
            value: buffer,
          };
          yield entry;
        }
      },
    };
    return iterable;
  }
}

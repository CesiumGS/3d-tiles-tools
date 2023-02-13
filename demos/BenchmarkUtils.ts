import util from "util";

import { BenchmarkConfig } from "./BenchmarkConfig";

/**
 * Methods to create benchmark configurations
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
    const configs: any[] = [];

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
}

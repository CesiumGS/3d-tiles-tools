import fs from "fs";
import util from "util";
import { performance } from "perf_hooks";

import { TilesetSource } from "3d-tiles-tools";
import { TilesetSource3tz } from "3d-tiles-tools";
import { TilesetSource3dtiles } from "3d-tiles-tools";

import { BenchmarkUtils } from "./BenchmarkUtils";
import { Arrays } from "./Arrays";

/**
 * Reads all entries from the given source, repeatedly and in random
 * order, printing timing information.
 *
 * @param tilesetSource The tileset source
 * @param fullInputFileName The full input file name
 * @param configString A string describing the configuration
 * of the benchmark, only used for logging
 */
function readTilesetSource(
  tilesetSource: TilesetSource,
  fullInputFileName: string,
  configString: string
) {
  let beforeMs = 0;
  tilesetSource.open(fullInputFileName);

  const keys = [...tilesetSource.getKeys()];

  let totalBytes = 0;
  const passes = 5;
  for (let i = 0; i < passes + 1; i++) {
    // Don't measure the first pass (as a 'warmup')
    if (i === 1) {
      beforeMs = performance.now();
      totalBytes = 0;
    }
    for (const key of keys) {
      const content = tilesetSource.getValue(key);
      if (content) {
        totalBytes += content.length;
      }
    }
    Arrays.shuffle(keys, "0");
  }
  tilesetSource.close();
  const afterMs = performance.now();
  const durationMs = afterMs - beforeMs;
  const message = util.format(
    "Reading %s DONE (%f passes, %f bytes total), duration %f ms",
    configString,
    passes,
    totalBytes,
    durationMs
  );
  console.log(message);
}

async function run() {
  console.log("Running test");

  const configs = BenchmarkUtils.createBenchmarkConfigs();

  const inputDirectory = "./data/";
  if (!fs.existsSync(inputDirectory)) {
    throw new Error("Input directory not found");
  }

  for (const config of configs) {
    const configString = BenchmarkUtils.createConfigString(config);
    const inputFilePrefix = inputDirectory + configString;

    const tilesetSource3tz = new TilesetSource3tz();
    readTilesetSource(
      tilesetSource3tz,
      inputFilePrefix + ".3tz",
      "3TZ     " + configString
    );

    const tilesetSource3dtiles = new TilesetSource3dtiles();
    readTilesetSource(
      tilesetSource3dtiles,
      inputFilePrefix + ".3dtiles",
      "3DTILES " + configString
    );
  }

  console.log("Running test DONE");
}

run();

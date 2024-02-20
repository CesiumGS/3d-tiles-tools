import fs from "fs";
import util from "util";
import { performance } from "perf_hooks";

import { TilesetTarget } from "3d-tiles-tools";
import { TilesetEntry } from "3d-tiles-tools";
import { TilesetTarget3dtiles } from "3d-tiles-tools";
import { TilesetTarget3tz } from "3d-tiles-tools";

import { BenchmarkUtils } from "./BenchmarkUtils";

/**
 * Adds the given entries to the given tileset target,
 * printing timing information.
 *
 * @param tilesetTarget The `TilesetTarget`
 * @param fullOutputFileName The full output file name
 * @param entries The iterable for the entries
 * @param configString A string summarizing the benchmark
 * configuration (only used for logging)
 */
async function fillTilesetTarget(
  tilesetTarget: TilesetTarget,
  fullOutputFileName: string,
  entries: Iterable<TilesetEntry>,
  configString: string
) {
  const beforeMs = performance.now();
  tilesetTarget.begin(fullOutputFileName, true);
  tilesetTarget.addEntry(
    "tileset.json",
    BenchmarkUtils.createDummyTilesetJsonBuffer()
  );
  for (const entry of entries) {
    const key = entry.key;
    const content = entry.value;
    tilesetTarget.addEntry(key, content);
  }
  await tilesetTarget.end();
  const afterMs = performance.now();
  const durationMs = afterMs - beforeMs;
  const message = util.format(
    "Creating %s DONE, duration %f ms",
    configString,
    durationMs
  );
  console.log(message);
}

async function run() {
  console.log("Running test");

  const configs = BenchmarkUtils.createBenchmarkConfigs();

  const outputDirectory = "./data/";
  if (!fs.existsSync(outputDirectory)) {
    fs.mkdirSync(outputDirectory, { recursive: true });
  }

  for (const config of configs) {
    const configString = BenchmarkUtils.createConfigString(config);
    const outputFilePrefix = outputDirectory + configString;

    const tilesetTarget3tz = new TilesetTarget3tz();
    await fillTilesetTarget(
      tilesetTarget3tz,
      outputFilePrefix + ".3tz",
      BenchmarkUtils.createDummyEntriesIterable(config),
      "3TZ            " + configString
    );

    const tilesetTarget3dtiles = new TilesetTarget3dtiles();
    await fillTilesetTarget(
      tilesetTarget3dtiles,
      outputFilePrefix + ".3dtiles",
      BenchmarkUtils.createDummyEntriesIterable(config),
      "3DTILES        " + configString
    );
  }

  console.log("Running test DONE");
}

run();

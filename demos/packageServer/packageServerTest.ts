import path from "path";

import { Paths } from "3d-tiles-tools";

import { PackageServer } from "./PackageServer";
import { PackageServerOptions } from "./PackageServerOptions";
import { PackageServerTestClient } from "./PackageServerTestClient";

import { Loggers } from "3d-tiles-tools";
const logger = Loggers.get("packageServerTest");

/**
 * Run a single package server test
 *
 * @param sourceName The name of the source tileset JSON file
 * @returns Whether the test passed
 */
async function run(sourceName: string): Promise<boolean> {
  logger.info(`Running test: ${sourceName}`);

  let baseDirectory = sourceName;
  if (!Paths.isDirectory(sourceName)) {
    baseDirectory = path.dirname(sourceName);
  }

  const packageServer = new PackageServer(baseDirectory);
  const serverOptions: PackageServerOptions = {
    hostName: "127.0.0.1",
    port: 8003,
    sourceName: sourceName,
  };
  await packageServer.start(serverOptions);

  const baseUrl = new URL("http://localhost:8003");
  const packageServerTestClient = new PackageServerTestClient(
    packageServer,
    baseUrl
  );
  await packageServerTestClient.process("tileset.json");
  await packageServer.stop();

  const resolvedPathnames = packageServerTestClient.getResolvedPathnames();
  logger.debug(`Resolved pathnames ${resolvedPathnames.size}:`);
  for (const p of resolvedPathnames) {
    logger.debug(` ${p}`);
  }

  const unresolvedPathnames = packageServerTestClient.getUnresolvedPathnames();
  if (unresolvedPathnames.size !== 0) {
    logger.warn(`Unresolved pathnames ${unresolvedPathnames.size}:`);
    for (const p of unresolvedPathnames) {
      logger.warn(` ${p}`);
    }
  } else {
    logger.debug(`Unresolved pathnames ${unresolvedPathnames.size}:`);
    for (const p of unresolvedPathnames) {
      logger.debug(` ${p}`);
    }
  }

  const passed = unresolvedPathnames.size === 0;

  logger.info(`Running test: ${sourceName} DONE, result: ${passed}`);
  return passed;
}

/**
 * Run a set of (all) package server tests
 */
async function runAll() {
  const sourceNames = [
    "./demos/data/packageServer/3tzTests/3tz_basic/tileset.json",
    "./demos/data/packageServer/3tzTests/3tz_chained/tileset.json",
    "./demos/data/packageServer/3tzTests/3tz_chained_deep/tileset.json",
    "./demos/data/packageServer/3tzTests/3tz_chained_subdirs/tileset.json",
    "./demos/data/packageServer/3tzTests/3tz_chained_subdirs_direct/tileset.json",
    "./demos/data/packageServer/3tzTests/3tz_direct/tileset.json",
    "./demos/data/packageServer/3tzTests/3tz_inner_subdirs/tileset.json",
  ];
  const results = Array<boolean>(sourceNames.length);
  for (let i = 0; i < sourceNames.length; i++) {
    const sourceName = sourceNames[i];
    const passed = await run(sourceName);
    results[i] = passed;
  }

  logger.info("Test results:");
  for (let i = 0; i < sourceNames.length; i++) {
    if (results[i]) {
      logger.info(`  Passed: ${sourceNames[i]}`);
    } else {
      logger.warn(`  FAILED: ${sourceNames[i]}`);
    }
  }

  // Wait for the summary to be printed
  logger.flush();
  await new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, 1000);
  });
}

void runAll();

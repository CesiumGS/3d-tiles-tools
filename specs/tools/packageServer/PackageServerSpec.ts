import path from "path";

import { Paths } from "../../../src/base";

import { PackageServer } from "../../../src/tools";
import { PackageServerOptions } from "../../../src/tools";

import { SpecHelpers } from "../../SpecHelpers";
import { PackageServerTestClient } from "./PackageServerTestClient";

const SPECS_DATA_BASE_DIRECTORY = SpecHelpers.getSpecsDataBaseDirectory();
const BASE_DIR = SPECS_DATA_BASE_DIRECTORY + "/packageServer/3tzTests/";

/**
 * Computes the paths that can NOT be resolved from the given source.
 *
 * This will start the package server on localhost, and run the
 * PackageServerTestClient to traverse the explicit tile hierarchy
 * of the tileset that is found at the given source. It will return
 * all paths for data that could NOT be resolved. This result should
 * be an empty array for a passing test.
 *
 * @param sourceName - The source name
 * @returns The unresolved paths
 */
async function computeUnresolved(sourceName: string): Promise<string[]> {
  let baseDirectory = sourceName;
  if (!Paths.isDirectory(sourceName)) {
    baseDirectory = path.dirname(sourceName);
  }
  const cors = true;
  const developmentMode = false;
  const packageServer = new PackageServer(baseDirectory, cors, developmentMode);
  const packageServerOptions: PackageServerOptions = {
    host: "127.0.0.1",
    port: 8003,
    sourceName: sourceName,
  };
  await packageServer.start(packageServerOptions);

  const baseUrl = new URL("http://127.0.0.1:8003");
  const packageServerTestClient = new PackageServerTestClient(
    packageServer,
    baseUrl
  );
  await packageServerTestClient.process("tileset.json");
  await packageServer.stop();

  const unresolvedPathnames = packageServerTestClient.getUnresolvedPathnames();
  return [...unresolvedPathnames];
}

fdescribe("PackageServer", function () {
  //==========================================================================
  // PNTS

  it("resolves all data from 3tz_basic/tileset.json", async function () {
    const sourceName = BASE_DIR + "3tz_basic/tileset.json";
    const unresolved = await computeUnresolved(sourceName);
    expect(unresolved).toEqual([]);
  });

  it("resolves all data from 3tz_chained/tileset.json", async function () {
    const sourceName = BASE_DIR + "3tz_chained/tileset.json";
    const unresolved = await computeUnresolved(sourceName);
    expect(unresolved).toEqual([]);
  });

  it("resolves all data from 3tz_chained_uppercase/tileset.json", async function () {
    const sourceName = BASE_DIR + "3tz_chained_uppercase/tileset.json";
    const unresolved = await computeUnresolved(sourceName);
    expect(unresolved).toEqual([]);
  });

  it("resolves all data from 3tz_chained_deep/tileset.json", async function () {
    const sourceName = BASE_DIR + "3tz_chained_deep/tileset.json";
    const unresolved = await computeUnresolved(sourceName);
    expect(unresolved).toEqual([]);
  });

  it("resolves all data from 3tz_chained_subdirs/tileset.json", async function () {
    const sourceName = BASE_DIR + "3tz_chained_subdirs/tileset.json";
    const unresolved = await computeUnresolved(sourceName);
    expect(unresolved).toEqual([]);
  });

  it("resolves all data from 3tz_chained_subdirs_direct/tileset.json", async function () {
    const sourceName = BASE_DIR + "3tz_chained_subdirs_direct/tileset.json";
    const unresolved = await computeUnresolved(sourceName);
    expect(unresolved).toEqual([]);
  });

  it("resolves all data from 3tz_direct/tileset.json", async function () {
    const sourceName = BASE_DIR + "3tz_direct/tileset.json";
    const unresolved = await computeUnresolved(sourceName);
    expect(unresolved).toEqual([]);
  });

  it("resolves all data from 3tz_flat/tileset.3tz", async function () {
    const sourceName = BASE_DIR + "3tz_flat/tileset.3tz";
    const unresolved = await computeUnresolved(sourceName);
    expect(unresolved).toEqual([]);
  });

  it("resolves all data from 3tz_inner_subdirs/tileset.json", async function () {
    const sourceName = BASE_DIR + "3tz_inner_subdirs/tileset.json";
    const unresolved = await computeUnresolved(sourceName);
    expect(unresolved).toEqual([]);
  });
});

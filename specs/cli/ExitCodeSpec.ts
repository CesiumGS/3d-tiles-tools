import { spawnSync } from "child_process";

import { SpecHelpers } from "../SpecHelpers";

const outputBase = "./specs/data/output/exitCode/";

// Re-use the execArgv so that the child process gets the same
// TypeScript loader that the specs are running with
function runCli(args: string[]) {
  return spawnSync(
    process.execPath,
    [...process.execArgv, "./src/cli/main.ts", ...args, "--logLevel", "silent"],
    { encoding: "utf-8" }
  );
}

describe("The command line exit code", function () {
  afterEach(function () {
    SpecHelpers.forceDeleteDirectory(outputBase);
  });

  it("is 0 when the command succeeds", function () {
    const result = runCli([
      "convert",
      "-i",
      "./specs/data/packageServer/3tzTests/3tz_flat/tileset.3tz",
      "-o",
      outputBase + "converted",
      "-f",
    ]);
    expect(result.status).toBe(0);
  }, 30000);

  it("is 1 when the command fails", function () {
    const result = runCli([
      "convert",
      "-i",
      "./specs/data/doesNotExist.3tz",
      "-o",
      outputBase + "converted",
      "-f",
    ]);
    expect(result.status).toBe(1);
  }, 30000);
});

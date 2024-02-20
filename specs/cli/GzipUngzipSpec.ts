import path from "path";

import { ToolsMain } from "../../src/cli/ToolsMain";

import { SpecHelpers } from "../SpecHelpers";

const simpleTileset = "./specs/data/gzipUngzip/simpleTileset";
const simpleTilesetGzip = "./specs/data/gzipUngzip/simpleTileset-gzip";
const simpleTilesetGzipTilesOnly =
  "./specs/data/gzipUngzip/simpleTileset-gzip-tilesOnly";

const outputBase = "./specs/data/output/gzipUngzip/";

const overwrite = true;

/**
 * Tests for the the 'gzip' and 'ungzip' command line operations.
 *
 * NOTE: This calls the functions from the `ToolsMain` class,
 * which represent the command line functionality. The actual
 * operations ('gzip' and 'ungzip') are internally already
 * mapped to specific 'pipelines'. The pipeline implementation
 * in general, and right approach and level of granularity for
 * testing pipelines are not yet finalized. Right now, these
 * tests serve as "integration level"/"black box" tests that
 * just perform the operations on input directories, and
 * compare the resulting output to the expected directory
 * contents.
 */
describe("The gzip and ungzip command line operations", function () {
  afterEach(function () {
    SpecHelpers.forceDeleteDirectory(outputBase);
  });

  it("generates the 'simpleTileset-gzip' when running 'gzip' on the 'simpleTileset'", async function () {
    const tilesOnly = false;
    const outputSimpleTilesetGzip = path.join(outputBase, "simpleTileset-gzip");
    await ToolsMain.gzip(
      simpleTileset,
      outputSimpleTilesetGzip,
      overwrite,
      tilesOnly
    );
    const difference = SpecHelpers.computePackageDifference(
      simpleTilesetGzip,
      outputSimpleTilesetGzip
    );
    expect(difference).toBeUndefined();
  });
  it("generates the 'simpleTileset-gzip-tilesOnly' when running 'gzip' on the 'simpleTileset' with 'tilesOnly' being 'true'", async function () {
    const tilesOnly = true;
    const outputSimpleTilesetGzipTilesOnly = path.join(
      outputBase,
      "simpleTileset-gzip-tilesOnly"
    );
    await ToolsMain.gzip(
      simpleTileset,
      outputSimpleTilesetGzipTilesOnly,
      overwrite,
      tilesOnly
    );
    const difference = SpecHelpers.computePackageDifference(
      simpleTilesetGzipTilesOnly,
      outputSimpleTilesetGzipTilesOnly
    );
    expect(difference).toBeUndefined();
  });

  it("generates the 'simpleTileset' when running 'ungzip' on the 'simpleTileset-gzip'", async function () {
    const outputSimpleTilesetFromGzip = path.join(
      outputBase,
      "simpleTileset-from-gzip"
    );
    await ToolsMain.ungzip(
      simpleTilesetGzip,
      outputSimpleTilesetFromGzip,
      overwrite
    );
    const difference = SpecHelpers.computePackageDifference(
      simpleTileset,
      outputSimpleTilesetFromGzip
    );
    expect(difference).toBeUndefined();
  });

  it("generates the 'simpleTileset' when running 'ungzip' on the 'simpleTileset-gzip-tilesOnly'", async function () {
    const outputSimpleTilesetFromGzipTilesOnly = path.join(
      outputBase,
      "simpleTileset-from-gzip-tilesOnly"
    );
    await ToolsMain.ungzip(
      simpleTilesetGzipTilesOnly,
      outputSimpleTilesetFromGzipTilesOnly,
      overwrite
    );
    const difference = SpecHelpers.computePackageDifference(
      simpleTileset,
      outputSimpleTilesetFromGzipTilesOnly
    );
    expect(difference).toBeUndefined();
  });
});

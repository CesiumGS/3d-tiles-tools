import { TilesetConverter } from "../../src/tilesetProcessing/TilesetConverter";

import { SpecHelpers } from "../SpecHelpers";

const inputBaseDir = "./specs/data/convert/";
const outputBaseDir = "./specs/data/output/convert/";
const overwrite = true;

describe("TilesetConverter", function () {
  afterEach(function () {
    SpecHelpers.forceDeleteDirectory("./specs/data/output/convert");
  });

  it("converts basic directory to 3TZ", async function () {
    const input = inputBaseDir + "basic/";
    const output = outputBaseDir + "basic.3tz";
    await TilesetConverter.convert(input, output, overwrite);
  });

  it("converts basic file to 3TZ", async function () {
    const input = inputBaseDir + "basic/tileset.json";
    const output = outputBaseDir + "basic.3tz";
    await TilesetConverter.convert(input, output, overwrite);
  });

  it("converts basic file to other file", async function () {
    const input = inputBaseDir + "basic/tilesetA.json";
    const output = outputBaseDir + "basic/resultTilesetA.json";
    await TilesetConverter.convert(input, output, overwrite);
  });

  it("fails for basic file to 3TZ when input tileset JSON file causes duplicate", async function () {
    const input = inputBaseDir + "basic/tilesetA.json";
    const output = outputBaseDir + "basic.3tz";
    await expectAsync(
      (async function () {
        await TilesetConverter.convert(input, output, overwrite);
      })()
      //  ^ This () is important to really CALL the anonymous function
      // and return a promise.
    ).toBeRejectedWithError();
  });

  it("converts basic ZIP to directory", async function () {
    const input = inputBaseDir + "basic.zip";
    const output = outputBaseDir + "basic/";
    await TilesetConverter.convert(input, output, overwrite);
  });

  it("fails for basic ZIP to file when output tileset JSON file was not found in input", async function () {
    const input = inputBaseDir + "basic.zip";
    const output = outputBaseDir + "basic/customTileset.json";
    await expectAsync(
      (async function () {
        await TilesetConverter.convert(input, output, overwrite);
      })()
      //  ^ This () is important to really CALL the anonymous function
      // and return a promise.
    ).toBeRejectedWithError();
  });

  it("fails for ambiguous directory to 3TZ", async function () {
    const input = inputBaseDir + "ambiguous/";
    const output = outputBaseDir + "ambiguous.3tz";
    await expectAsync(
      (async function () {
        await TilesetConverter.convert(input, output, overwrite);
      })()
      //  ^ This () is important to really CALL the anonymous function
      // and return a promise.
    ).toBeRejectedWithError();
  });

  it("converts ambiguous directory to 3TZ when input tileset JSON file was given explicitly", async function () {
    const input = inputBaseDir + "ambiguous/tilesetA.json";
    const output = outputBaseDir + "ambiguous.3tz";
    await TilesetConverter.convert(input, output, overwrite);
  });

  it("converts ambiguous ZIP to directory", async function () {
    const input = inputBaseDir + "ambiguous.zip";
    const output = outputBaseDir + "ambiguous/";
    await TilesetConverter.convert(input, output, overwrite);
  });

  it("fails for ambiguous ZIP to file", async function () {
    const input = inputBaseDir + "ambiguous.zip";
    const output = outputBaseDir + "ambiguous/tileset.json";
    await expectAsync(
      (async function () {
        await TilesetConverter.convert(input, output, overwrite);
      })()
      //  ^ This () is important to really CALL the anonymous function
      // and return a promise.
    ).toBeRejectedWithError();
  });

  it("fails for ambiguous ZIP to 3TZ", async function () {
    const input = inputBaseDir + "ambiguous.zip";
    const output = outputBaseDir + "ambiguous.3tz";
    await expectAsync(
      (async function () {
        await TilesetConverter.convert(input, output, overwrite);
      })()
      //  ^ This () is important to really CALL the anonymous function
      // and return a promise.
    ).toBeRejectedWithError();
  });
});

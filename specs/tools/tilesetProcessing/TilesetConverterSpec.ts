import { TilesetConverter } from "../../../src/tools";

import { SpecHelpers } from "../../SpecHelpers";

const SPECS_DATA_BASE_DIRECTORY = SpecHelpers.getSpecsDataBaseDirectory();

const inputBaseDir = SPECS_DATA_BASE_DIRECTORY + "/convert/";
const outputBaseDir = SPECS_DATA_BASE_DIRECTORY + "/output/convert/";
const overwrite = true;

describe("TilesetConverter", function () {
  afterEach(function () {
    SpecHelpers.forceDeleteDirectory(
      SPECS_DATA_BASE_DIRECTORY + "/output/convert"
    );
  });

  it("converts basic directory to 3TZ", async function () {
    const input = inputBaseDir + "basic/";
    const output = outputBaseDir + "basic.3tz";
    const inputTilesetJsonFileName = undefined;
    await TilesetConverter.convert(
      input,
      inputTilesetJsonFileName,
      output,
      overwrite
    );
  });

  it("converts basic file to 3TZ", async function () {
    const input = inputBaseDir + "basic/tileset.json";
    const output = outputBaseDir + "basic.3tz";
    const inputTilesetJsonFileName = undefined;
    await TilesetConverter.convert(
      input,
      inputTilesetJsonFileName,
      output,
      overwrite
    );
  });

  it("converts basic file to other file", async function () {
    const input = inputBaseDir + "basic/tilesetA.json";
    const output = outputBaseDir + "basic/resultTilesetA.json";
    const inputTilesetJsonFileName = undefined;
    await TilesetConverter.convert(
      input,
      inputTilesetJsonFileName,
      output,
      overwrite
    );
  });

  it("fails for basic file to 3TZ when input tileset JSON file causes duplicate", async function () {
    const input = inputBaseDir + "basic/tilesetA.json";
    const output = outputBaseDir + "basic.3tz";
    const inputTilesetJsonFileName = undefined;
    await expectAsync(
      (async function () {
        await TilesetConverter.convert(
          input,
          inputTilesetJsonFileName,
          output,
          overwrite
        );
      })()
      //  ^ This () is important to really CALL the anonymous function
      // and return a promise.
    ).toBeRejectedWithError();
  });

  it("converts basic ZIP to directory", async function () {
    const input = inputBaseDir + "basic.zip";
    const output = outputBaseDir + "basic/";
    const inputTilesetJsonFileName = undefined;
    await TilesetConverter.convert(
      input,
      inputTilesetJsonFileName,
      output,
      overwrite
    );
  });

  it("converts basic ZIP to file when output tileset JSON file was given", async function () {
    const input = inputBaseDir + "basic.zip";
    const output = outputBaseDir + "basic/outputFromDefaultInput.json";
    const inputTilesetJsonFileName = undefined;
    await TilesetConverter.convert(
      input,
      inputTilesetJsonFileName,
      output,
      overwrite
    );
  });

  it("converts basic ZIP to directory when input and output tileset JSON file have been given", async function () {
    const input = inputBaseDir + "basic.zip";
    const output = outputBaseDir + "basic/outputFromGivenInput.json";
    const inputTilesetJsonFileName = "tileset.json";
    await TilesetConverter.convert(
      input,
      inputTilesetJsonFileName,
      output,
      overwrite
    );
  });

  it("fails for basic ZIP to file when input tileset JSON file was not found", async function () {
    const input = inputBaseDir + "basic.zip";
    const output = outputBaseDir + "basic/tileset.json";
    const inputTilesetJsonFileName = "nonExistentTileset.json";
    await expectAsync(
      (async function () {
        await TilesetConverter.convert(
          input,
          inputTilesetJsonFileName,
          output,
          overwrite
        );
      })()
      //  ^ This () is important to really CALL the anonymous function
      // and return a promise.
    ).toBeRejectedWithError();
  });

  it("fails for ambiguous directory to 3TZ", async function () {
    const input = inputBaseDir + "ambiguous/";
    const output = outputBaseDir + "ambiguous.3tz";
    const inputTilesetJsonFileName = undefined;
    await expectAsync(
      (async function () {
        await TilesetConverter.convert(
          input,
          inputTilesetJsonFileName,
          output,
          overwrite
        );
      })()
      //  ^ This () is important to really CALL the anonymous function
      // and return a promise.
    ).toBeRejectedWithError();
  });

  it("converts ambiguous directory to 3TZ when input was the full tileset JSON file", async function () {
    const input = inputBaseDir + "ambiguous/tilesetA.json";
    const output = outputBaseDir + "ambiguous.3tz";
    const inputTilesetJsonFileName = undefined;
    await TilesetConverter.convert(
      input,
      inputTilesetJsonFileName,
      output,
      overwrite
    );
  });

  it("converts ambiguous directory to 3TZ when input tileset JSON file was given explicitly", async function () {
    const input = inputBaseDir + "ambiguous/";
    const output = outputBaseDir + "ambiguous.3tz";
    const inputTilesetJsonFileName = "tilesetA.json";
    await TilesetConverter.convert(
      input,
      inputTilesetJsonFileName,
      output,
      overwrite
    );
  });

  it("fails for ambiguous ZIP to directory", async function () {
    const input = inputBaseDir + "ambiguous.zip";
    const output = outputBaseDir + "ambiguous/";
    const inputTilesetJsonFileName = undefined;
    await expectAsync(
      (async function () {
        await TilesetConverter.convert(
          input,
          inputTilesetJsonFileName,
          output,
          overwrite
        );
      })()
      //  ^ This () is important to really CALL the anonymous function
      // and return a promise.
    ).toBeRejectedWithError();
  });

  it("fails for ambiguous ZIP to file", async function () {
    const input = inputBaseDir + "ambiguous.zip";
    const output = outputBaseDir + "ambiguous/tileset.json";
    const inputTilesetJsonFileName = undefined;
    await expectAsync(
      (async function () {
        await TilesetConverter.convert(
          input,
          inputTilesetJsonFileName,
          output,
          overwrite
        );
      })()
      //  ^ This () is important to really CALL the anonymous function
      // and return a promise.
    ).toBeRejectedWithError();
  });

  it("converts ambiguous ZIP to file when input tileset JSON file was given explicitly", async function () {
    const input = inputBaseDir + "ambiguous.zip";
    const output = outputBaseDir + "ambiguous/tileset.json";
    const inputTilesetJsonFileName = "tilesetA.json";
    await TilesetConverter.convert(
      input,
      inputTilesetJsonFileName,
      output,
      overwrite
    );
  });

  it("fails for ambiguous ZIP to 3TZ", async function () {
    const input = inputBaseDir + "ambiguous.zip";
    const output = outputBaseDir + "ambiguous.3tz";
    const inputTilesetJsonFileName = undefined;
    await expectAsync(
      (async function () {
        await TilesetConverter.convert(
          input,
          inputTilesetJsonFileName,
          output,
          overwrite
        );
      })()
      //  ^ This () is important to really CALL the anonymous function
      // and return a promise.
    ).toBeRejectedWithError();
  });

  it("converts ambiguous ZIP to 3TZ when input tileset JSON file was given explicitly", async function () {
    const input = inputBaseDir + "ambiguous.zip";
    const output = outputBaseDir + "ambiguous.3tz";
    const inputTilesetJsonFileName = "tilesetA.json";
    await TilesetConverter.convert(
      input,
      inputTilesetJsonFileName,
      output,
      overwrite
    );
  });
});

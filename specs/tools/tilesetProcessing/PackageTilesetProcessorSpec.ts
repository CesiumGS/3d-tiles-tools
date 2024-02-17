import { BasicTilesetProcessor } from "../../../src/tools";

import { SpecHelpers } from "../../SpecHelpers";

const SPECS_DATA_BASE_DIRECTORY = SpecHelpers.getSpecsDataBaseDirectory();

const inputRoot = SPECS_DATA_BASE_DIRECTORY + "/tilesetProcessing/";

const basicInput = inputRoot + "basicProcessing";
const basicInput3tz = inputRoot + "basicProcessing.3tz";
const basicInput3dtiles = inputRoot + "basicProcessing.3dtiles";

const implicitInput = inputRoot + "implicitProcessing";
const implicitInput3tz = inputRoot + "implicitProcessing.3tz";
const implicitInput3dtiles = inputRoot + "implicitProcessing.3dtiles";

const outputRoot = SPECS_DATA_BASE_DIRECTORY + "/output/tilesetProcessing/";

const basicOutput = outputRoot + "basicProcessing";
const basicOutput3tz = outputRoot + "basicProcessing.3tz";
const basicOutput3dtiles = outputRoot + "basicProcessing.3dtiles";

const implicitOutput = outputRoot + "implicitProcessing";
const implicitOutput3tz = outputRoot + "implicitProcessing.3tz";
const implicitOutput3dtiles = outputRoot + "implicitProcessing.3dtiles";

const overwrite = true;

/**
 * Tests that verify that the BasicTilesetProcessor operates properly
 * when using packages as input or output
 */
describe("BasicTilesetProcessor on packages", function () {
  afterEach(function () {
    SpecHelpers.forceDeleteDirectory(outputRoot);
  });

  it("writes basic from directories to 3TZ", async function () {
    const tilesetProcessor = new BasicTilesetProcessor();
    await tilesetProcessor.begin(basicInput, basicOutput3tz, overwrite);
    await tilesetProcessor.end();

    const difference = SpecHelpers.computePackageDifference(
      basicInput3tz,
      basicOutput3tz
    );
    expect(difference).toBeUndefined();
  });

  it("writes basic from 3TZ to directories", async function () {
    const tilesetProcessor = new BasicTilesetProcessor();
    await tilesetProcessor.begin(basicInput3tz, basicOutput, overwrite);
    await tilesetProcessor.end();

    const difference = SpecHelpers.computePackageDifference(
      basicInput,
      basicOutput
    );
    expect(difference).toBeUndefined();
  });

  it("writes basic from directories to 3DTILES", async function () {
    const tilesetProcessor = new BasicTilesetProcessor();
    await tilesetProcessor.begin(basicInput, basicOutput3dtiles, overwrite);
    await tilesetProcessor.end();

    const difference = SpecHelpers.computePackageDifference(
      basicInput3dtiles,
      basicOutput3dtiles
    );
    expect(difference).toBeUndefined();
  });

  it("writes basic from 3DTILES to directories", async function () {
    const tilesetProcessor = new BasicTilesetProcessor();
    await tilesetProcessor.begin(basicInput3dtiles, basicOutput, overwrite);
    await tilesetProcessor.end();

    const difference = SpecHelpers.computePackageDifference(
      basicInput,
      basicOutput
    );
    expect(difference).toBeUndefined();
  });

  it("writes implicit from directories to 3TZ", async function () {
    const tilesetProcessor = new BasicTilesetProcessor();
    await tilesetProcessor.begin(implicitInput, implicitOutput3tz, overwrite);
    await tilesetProcessor.end();

    const difference = SpecHelpers.computePackageDifference(
      implicitInput3tz,
      implicitOutput3tz
    );
    expect(difference).toBeUndefined();
  });

  it("writes implicit from 3TZ to directories", async function () {
    const tilesetProcessor = new BasicTilesetProcessor();
    await tilesetProcessor.begin(implicitInput3tz, implicitOutput, overwrite);
    await tilesetProcessor.end();

    const difference = SpecHelpers.computePackageDifference(
      implicitInput,
      implicitOutput
    );
    expect(difference).toBeUndefined();
  });

  it("writes implicit from directories to 3DTILES", async function () {
    const tilesetProcessor = new BasicTilesetProcessor();
    await tilesetProcessor.begin(
      implicitInput,
      implicitOutput3dtiles,
      overwrite
    );
    await tilesetProcessor.end();

    const difference = SpecHelpers.computePackageDifference(
      implicitInput3dtiles,
      implicitOutput3dtiles
    );
    expect(difference).toBeUndefined();
  });

  it("writes implicit from 3DTILES to directories", async function () {
    const tilesetProcessor = new BasicTilesetProcessor();
    await tilesetProcessor.begin(
      implicitInput3dtiles,
      implicitOutput,
      overwrite
    );
    await tilesetProcessor.end();

    const difference = SpecHelpers.computePackageDifference(
      implicitInput,
      implicitOutput
    );
    expect(difference).toBeUndefined();
  });
});

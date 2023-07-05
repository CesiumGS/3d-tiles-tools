import { SpecHelpers } from "./SpecHelpers";

import { BasicTilesetProcessor } from "../src/tilesetProcessing/BasicTilesetProcessor";

const basicInput = "./specs/data/tilesetProcessing/basicProcessing";
const basicInput3tz = "./specs/data/tilesetProcessing/basicProcessing.3tz";
const basicInput3dtiles =
  "./specs/data/tilesetProcessing/basicProcessing.3dtiles";

const implicitInput = "./specs/data/tilesetProcessing/implicitProcessing";
const implicitInput3tz =
  "./specs/data/tilesetProcessing/implicitProcessing.3tz";
const implicitInput3dtiles =
  "./specs/data/tilesetProcessing/implicitProcessing.3dtiles";

const basicOutput = "./specs/data/output/tilesetProcessing/basicProcessing";
const basicOutput3tz =
  "./specs/data/output/tilesetProcessing/basicProcessing.3tz";
const basicOutput3dtiles =
  "./specs/data/output/tilesetProcessing/basicProcessing.3dtiles";

const implicitOutput =
  "./specs/data/output/tilesetProcessing/implicitProcessing";
const implicitOutput3tz =
  "./specs/data/output/tilesetProcessing/implicitProcessing.3tz";
const implicitOutput3dtiles =
  "./specs/data/output/tilesetProcessing/implicitProcessing.3dtiles";

const quiet = true;
const overwrite = true;

/**
 * Tests that verify that the BasicTilesetProcessor operates properly
 * when using packages as input or output
 */
describe("BasicTilesetProcessor on packages", function () {
  afterEach(function () {
    SpecHelpers.forceDeleteDirectory("./specs/data/output/tilesetProcessing");
  });

  it("writes basic from directories to 3TZ", async function () {
    const tilesetProcessor = new BasicTilesetProcessor(quiet);
    await tilesetProcessor.begin(basicInput, basicOutput3tz, overwrite);
    await tilesetProcessor.end();

    const difference = SpecHelpers.computePackageDifference(
      basicInput3tz,
      basicOutput3tz
    );
    expect(difference).toBeUndefined();
  });

  it("writes basic from 3TZ to directories", async function () {
    const tilesetProcessor = new BasicTilesetProcessor(quiet);
    await tilesetProcessor.begin(basicInput3tz, basicOutput, overwrite);
    await tilesetProcessor.end();

    const difference = SpecHelpers.computePackageDifference(
      basicInput,
      basicOutput
    );
    expect(difference).toBeUndefined();
  });

  it("writes basic from directories to 3DTILES", async function () {
    const tilesetProcessor = new BasicTilesetProcessor(quiet);
    await tilesetProcessor.begin(basicInput, basicOutput3dtiles, overwrite);
    await tilesetProcessor.end();

    const difference = SpecHelpers.computePackageDifference(
      basicInput3dtiles,
      basicOutput3dtiles
    );
    expect(difference).toBeUndefined();
  });

  it("writes basic from 3DTILES to directories", async function () {
    const tilesetProcessor = new BasicTilesetProcessor(quiet);
    await tilesetProcessor.begin(basicInput3dtiles, basicOutput, overwrite);
    await tilesetProcessor.end();

    const difference = SpecHelpers.computePackageDifference(
      basicInput,
      basicOutput
    );
    expect(difference).toBeUndefined();
  });

  it("writes implicit from directories to 3TZ", async function () {
    const tilesetProcessor = new BasicTilesetProcessor(quiet);
    await tilesetProcessor.begin(implicitInput, implicitOutput3tz, overwrite);
    await tilesetProcessor.end();

    const difference = SpecHelpers.computePackageDifference(
      implicitInput3tz,
      implicitOutput3tz
    );
    expect(difference).toBeUndefined();
  });

  it("writes implicit from 3TZ to directories", async function () {
    const tilesetProcessor = new BasicTilesetProcessor(quiet);
    await tilesetProcessor.begin(implicitInput3tz, implicitOutput, overwrite);
    await tilesetProcessor.end();

    const difference = SpecHelpers.computePackageDifference(
      implicitInput,
      implicitOutput
    );
    expect(difference).toBeUndefined();
  });

  it("writes implicit from directories to 3DTILES", async function () {
    const tilesetProcessor = new BasicTilesetProcessor(quiet);
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
    const tilesetProcessor = new BasicTilesetProcessor(quiet);
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

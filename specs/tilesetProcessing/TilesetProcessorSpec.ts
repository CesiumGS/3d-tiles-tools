import { TilesetDataProcessor } from "../../src/tilesetProcessing/TilesetDataProcessor";

import { SpecHelpers } from "../SpecHelpers";

const basicInput = "./specs/data/tilesetProcessing/basicProcessing";
const basicOutput = "./specs/data/output/tilesetProcessing/basicProcessing";

const overwrite = true;

/**
 * Tests for the base functionality of the (abstract) TilesetProcessor
 * base class, using one concrete implementation, namely the
 * TilesetDataProcessor
 */
describe("TilesetProcessor", function () {
  afterEach(function () {
    SpecHelpers.forceDeleteDirectory("./specs/data/output/tilesetProcessing");
  });

  it("throws when trying to call 'begin' with invalid path", async function () {
    const tilesetProcessor = new TilesetDataProcessor();
    await expectAsync(
      (async function () {
        await tilesetProcessor.begin(
          basicInput + "_INVALID",
          basicOutput,
          overwrite
        );
      })()
      //^ This () is important to really CALL the anonymous function
      // and return a promise.
    ).toBeRejectedWithError();
  });

  it("throws when trying to call 'begin' twice", async function () {
    const tilesetProcessor = new TilesetDataProcessor();
    await tilesetProcessor.begin(basicInput, basicOutput, overwrite);
    await expectAsync(
      (async function () {
        await tilesetProcessor.begin(basicInput, basicOutput, overwrite);
      })()
      //^ This () is important to really CALL the anonymous function
      // and return a promise.
    ).toBeRejectedWithError();
  });

  it("throws when trying to call 'end' without 'begin'", async function () {
    const tilesetProcessor = new TilesetDataProcessor();
    await expectAsync(
      (async function () {
        await tilesetProcessor.end();
      })()
      //^ This () is important to really CALL the anonymous function
      // and return a promise.
    ).toBeRejectedWithError();
  });

  it("throws when trying to call 'end' twice", async function () {
    const tilesetProcessor = new TilesetDataProcessor();
    await tilesetProcessor.begin(basicInput, basicOutput, overwrite);
    await tilesetProcessor.end();
    await expectAsync(
      (async function () {
        await tilesetProcessor.end();
      })()
      //^ This () is important to really CALL the anonymous function
      // and return a promise.
    ).toBeRejectedWithError();
  });

  it("performs a 'no-op' of just copying the data when when no other functions are called", async function () {
    const tilesetProcessor = new TilesetDataProcessor();
    await tilesetProcessor.begin(basicInput, basicOutput, overwrite);
    await tilesetProcessor.end();

    // Ensure that the output directory contains exactly the
    // input files
    const relativeInputFiles = SpecHelpers.collectRelativeFileNames(basicInput);
    relativeInputFiles.sort();
    const relativeOutputFiles =
      SpecHelpers.collectRelativeFileNames(basicOutput);
    relativeOutputFiles.sort();
    expect(relativeOutputFiles).toEqual(relativeInputFiles);
  });
});

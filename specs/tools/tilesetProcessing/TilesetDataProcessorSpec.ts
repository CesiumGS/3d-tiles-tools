import { TilesetDataProcessor } from "../../../src/tools";

import { SpecEntryProcessor } from "./SpecEntryProcessor";

import { SpecHelpers } from "../../SpecHelpers";

const SPECS_DATA_BASE_DIRECTORY = SpecHelpers.getSpecsDataBaseDirectory();

const outputRoot = SPECS_DATA_BASE_DIRECTORY + "/output/tilesetProcessing/";

const basicInput =
  SPECS_DATA_BASE_DIRECTORY + "/tilesetProcessing/basicProcessing";
const basicOutput = outputRoot + "basicProcessing";

const implicitInput =
  SPECS_DATA_BASE_DIRECTORY + "/tilesetProcessing/implicitProcessing";
const implicitOutput = outputRoot + "implicitProcessing";

const overwrite = true;

describe("TilesetDataProcessor", function () {
  afterEach(function () {
    SpecHelpers.forceDeleteDirectory(outputRoot);
  });

  it("processAllEntries processes all entries exactly once for explicit tilesets", async function () {
    const tilesetProcessor = new TilesetDataProcessor();
    await tilesetProcessor.begin(basicInput, basicOutput, overwrite);
    const specEntryProcessor = new SpecEntryProcessor();
    await tilesetProcessor.processAllEntries(specEntryProcessor.processEntry);
    await tilesetProcessor.end();

    // Expect ALL files to have been processed
    const expectedProcessedKeys = [
      "README.md",
      "sub/tileB.b3dm",
      "tileA.b3dm",
      "tileB.b3dm",
      "tileC.b3dm",
      "tileset.json",
    ];
    const actualProcessedKeys = specEntryProcessor.processedKeys;
    actualProcessedKeys.sort();
    expectedProcessedKeys.sort();
    expect(actualProcessedKeys).toEqual(expectedProcessedKeys);

    // Expect the names of ALL files to have been modified
    const expectedOutputFiles = [
      "PROCESSED_README.md",
      "sub/PROCESSED_tileB.b3dm",
      "PROCESSED_tileA.b3dm",
      "PROCESSED_tileB.b3dm",
      "PROCESSED_tileC.b3dm",
      "PROCESSED_tileset.json",
    ];
    const actualOutputFiles = SpecHelpers.collectRelativeFileNames(basicOutput);
    actualOutputFiles.sort();
    expectedOutputFiles.sort();
    expect(actualOutputFiles).toEqual(expectedOutputFiles);
  });

  it("processAllEntries processes all entries exactly once for implicit tilesets", async function () {
    const tilesetProcessor = new TilesetDataProcessor();
    await tilesetProcessor.begin(implicitInput, implicitOutput, overwrite);
    const specEntryProcessor = new SpecEntryProcessor();
    await tilesetProcessor.processAllEntries(specEntryProcessor.processEntry);
    await tilesetProcessor.end();

    const actualProcessedKeys = specEntryProcessor.processedKeys;
    const actualOutputFiles =
      SpecHelpers.collectRelativeFileNames(implicitOutput);

    // Just check the number of processed entries: It should be the same
    // as the number of output files
    expect(actualProcessedKeys.length).toEqual(actualOutputFiles.length);
  });
});

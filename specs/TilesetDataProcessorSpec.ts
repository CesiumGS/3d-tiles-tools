import { TilesetDataProcessor } from "../src/tilesetProcessing/TilesetDataProcessor";

import { SpecEntryProcessor } from "./SpecEntryProcessor";
import { SpecHelpers } from "./SpecHelpers";

const basicInput = "./specs/data/tilesetProcessing/basicProcessing";
const basicOutput = "./specs/data/output/tilesetProcessing/basicProcessing";

const implicitInput = "./specs/data/tilesetProcessing/implicitProcessing";
const implicitOutput =
  "./specs/data/output/tilesetProcessing/implicitProcessing";

const quiet = true;
const overwrite = true;

describe("TilesetDataProcessor", function () {
  afterEach(function () {
    SpecHelpers.forceDeleteDirectory(basicOutput);
    SpecHelpers.forceDeleteDirectory(implicitOutput);
  });

  it("processAllEntries processes all entries exactly once for explicit tilesets", async function () {
    const tilesetProcessor = new TilesetDataProcessor(quiet);
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
      "PROCESSED_sub/tileB.b3dm",
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
    const tilesetProcessor = new TilesetDataProcessor(quiet);
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

/* eslint-disable @typescript-eslint/no-unused-vars */
import fs from "fs";

import { SpecHelpers } from "./SpecHelpers";
import { SpecProcessor } from "./SpecEntryProcessor";

import { Paths } from "../src/base/Paths";

import { BasicTilesetProcessor } from "../src/tilesetProcessing/BasicTilesetProcessor";

import { Tiles } from "../src/tilesets/Tiles";

import { Tile } from "../src/structure/Tile";

import { TraversedTile } from "../src/traversal/TraversedTile";

const basicInput = "./specs/data/tilesetProcessing/basicProcessing";
const basicOutput = "./specs/data/output/tilesetProcessing/basicProcessing";
const quiet = true;
const overwrite = true;

/**
 * Tests that verify that the `forEach...` and `process...` methods
 * of the BasicTilesetProcessor visit and process the correct
 * elements on explicit tilesets
 */
describe("BasicTilesetProcessor on explicit input", function () {
  afterEach(function () {
    SpecHelpers.forceDeleteDirectory(basicOutput);
  });

  it("forEachExplicitTile covers all explicit tiles", async function () {
    const tilesetProcessor = new BasicTilesetProcessor(quiet);
    await tilesetProcessor.begin(basicInput, basicOutput, overwrite);

    const actualContentUris: string[][] = [];
    await tilesetProcessor.forEachExplicitTile(async (tile: Tile) => {
      const contentUris = Tiles.getContentUris(tile);
      actualContentUris.push(contentUris);
    });
    await tilesetProcessor.end();

    // NOTE: The order is actually not specified.
    // This should be sorted lexographically for
    // the comparison...
    const expectedContentUris = [
      ["tileA.b3dm"],
      ["tileB.b3dm", "sub/tileB.b3dm"],
      ["tileC.b3dm"],
      ["tileA.b3dm"],
    ];
    expect(actualContentUris).toEqual(expectedContentUris);
  });

  it("forEachTile covers all tiles", async function () {
    const tilesetProcessor = new BasicTilesetProcessor(quiet);
    await tilesetProcessor.begin(basicInput, basicOutput, overwrite);

    const actualContentUris: string[][] = [];
    await tilesetProcessor.forEachTile(async (traversedTile: TraversedTile) => {
      const contentUris = traversedTile.getFinalContents().map((c) => c.uri);
      actualContentUris.push(contentUris);
    });
    await tilesetProcessor.end();

    // NOTE: The order is actually not specified.
    // This should be sorted lexographically for
    // the comparison...
    const expectedContentUris = [
      ["tileA.b3dm"],
      ["tileB.b3dm", "sub/tileB.b3dm"],
      ["tileC.b3dm"],
      ["tileA.b3dm"],
    ];
    expect(actualContentUris).toEqual(expectedContentUris);
  });

  it("processAllEntries processes all entries exactly once", async function () {
    const tilesetProcessor = new BasicTilesetProcessor(quiet);
    await tilesetProcessor.begin(basicInput, basicOutput, overwrite);
    const specProcessor = new SpecProcessor();
    await tilesetProcessor.processAllEntries(specProcessor.processEntry);
    await tilesetProcessor.end();

    // Expect ALL files to have been processed
    // (except for 'tileset.json')
    const expectedProcessedKeys = [
      "README.md",
      "sub/tileB.b3dm",
      "tileA.b3dm",
      "tileB.b3dm",
      "tileC.b3dm",
    ];
    const actualProcessedKeys = specProcessor.processedKeys;
    actualProcessedKeys.sort();
    expect(actualProcessedKeys).toEqual(expectedProcessedKeys);

    // Expect the names of ALL files to have been modified
    // (except for 'tileset.json')
    const expectedOutputFiles = [
      "PROCESSED_README.md",
      "PROCESSED_sub/tileB.b3dm",
      "PROCESSED_tileA.b3dm",
      "PROCESSED_tileB.b3dm",
      "PROCESSED_tileC.b3dm",
      "tileset.json",
    ];
    const actualOutputFiles = SpecHelpers.collectRelativeFileNames(basicOutput);
    actualOutputFiles.sort();
    expect(actualOutputFiles).toEqual(expectedOutputFiles);
  });

  it("processTileContentEntries processes the tile content entries", async function () {
    const tilesetProcessor = new BasicTilesetProcessor(quiet);
    await tilesetProcessor.begin(basicInput, basicOutput, overwrite);
    const specProcessor = new SpecProcessor();
    await tilesetProcessor.processTileContentEntries(
      specProcessor.processUri,
      specProcessor.processEntry
    );
    await tilesetProcessor.end();

    // Expect the content files to have been processed
    const expectedProcessedKeys = [
      "sub/tileB.b3dm",
      "tileA.b3dm",
      "tileB.b3dm",
      "tileC.b3dm",
    ];
    const actualProcessedKeys = specProcessor.processedKeys;
    actualProcessedKeys.sort();
    expect(actualProcessedKeys).toEqual(expectedProcessedKeys);

    // Expect the names of content files to have been modified
    const expectedOutputFiles = [
      "PROCESSED_sub/tileB.b3dm",
      "PROCESSED_tileA.b3dm",
      "PROCESSED_tileB.b3dm",
      "PROCESSED_tileC.b3dm",
      "README.md",
      "tileset.json",
    ];
    const actualOutputFiles = SpecHelpers.collectRelativeFileNames(basicOutput);
    actualOutputFiles.sort();
    expect(actualOutputFiles).toEqual(expectedOutputFiles);
  });

  it("processTileContentEntries updates the content URIs", async function () {
    const tilesetProcessor = new BasicTilesetProcessor(quiet);
    await tilesetProcessor.begin(basicInput, basicOutput, overwrite);
    const specProcessor = new SpecProcessor();
    await tilesetProcessor.processTileContentEntries(
      specProcessor.processUri,
      specProcessor.processEntry
    );
    await tilesetProcessor.end();

    // Ensure that the 'tileset.json' contains the
    // proper content URIs for the processed output
    const tilesetJsonBuffer = fs.readFileSync(
      Paths.join(basicOutput, "tileset.json")
    );
    const tileset = JSON.parse(tilesetJsonBuffer.toString());
    const actualContentUris = await SpecHelpers.collectExplicitContentUris(
      tileset.root
    );
    actualContentUris.sort();

    const expectedContentUris = [
      "PROCESSED_sub/tileB.b3dm",
      "PROCESSED_tileA.b3dm",
      "PROCESSED_tileA.b3dm",
      "PROCESSED_tileB.b3dm",
      "PROCESSED_tileC.b3dm",
    ];
    expect(actualContentUris).toEqual(expectedContentUris);
  });

  it("processAllEntries only processes unprocessed entries", async function () {
    const tilesetProcessor = new BasicTilesetProcessor(quiet);
    await tilesetProcessor.begin(basicInput, basicOutput, overwrite);

    // First, process all content entries
    const contentsSpecProcessor = new SpecProcessor();
    await tilesetProcessor.processTileContentEntries(
      contentsSpecProcessor.processUri,
      contentsSpecProcessor.processEntry
    );

    // Now, process all remaining entries
    const specProcessor = new SpecProcessor();
    await tilesetProcessor.processAllEntries(specProcessor.processEntry);
    await tilesetProcessor.end();

    // Expect only the non-content entries to have been processed
    // in processAllEntries
    const expectedProcessedKeys = ["README.md"];
    const actualProcessedKeys = specProcessor.processedKeys;
    actualProcessedKeys.sort();
    expect(actualProcessedKeys).toEqual(expectedProcessedKeys);
  });
});

import fs from "fs";

import { Paths } from "../../../src/base";

import { Tile } from "../../../src/structure";

import { Tiles } from "../../../src/tilesets";
import { TraversedTile } from "../../../src/tilesets";
import { TilesetEntry } from "../../../src/tilesets";

import { BasicTilesetProcessor } from "../../../src/tools";

import { SpecEntryProcessor } from "./SpecEntryProcessor";

import { SpecHelpers } from "../../SpecHelpers";

const SPECS_DATA_BASE_DIRECTORY = SpecHelpers.getSpecsDataBaseDirectory();

const basicInput =
  SPECS_DATA_BASE_DIRECTORY + "/tilesetProcessing/basicProcessing";
const basicOutput =
  SPECS_DATA_BASE_DIRECTORY + "/output/tilesetProcessing/basicProcessing";

const externalInput =
  SPECS_DATA_BASE_DIRECTORY + "/tilesetProcessing/externalProcessing";
const externalOutput =
  SPECS_DATA_BASE_DIRECTORY + "/output/tilesetProcessing/externalProcessing";

const overwrite = true;

/**
 * Tests that verify that the `forEach...` and `process...` methods
 * of the BasicTilesetProcessor visit and process the correct
 * elements on explicit tilesets
 */
describe("BasicTilesetProcessor on explicit input", function () {
  afterEach(function () {
    SpecHelpers.forceDeleteDirectory(
      SPECS_DATA_BASE_DIRECTORY + "/output/tilesetProcessing"
    );
  });

  it("forEachExplicitTile covers all explicit tiles", async function () {
    const tilesetProcessor = new BasicTilesetProcessor();
    await tilesetProcessor.begin(basicInput, basicOutput, overwrite);

    const actualContentUris: string[][] = [];
    await tilesetProcessor.forEachExplicitTile(async (tile: Tile) => {
      const contentUris = Tiles.getContentUris(tile);
      actualContentUris.push(contentUris);
    });
    await tilesetProcessor.end();

    const expectedContentUris = [
      ["tileA.b3dm"],
      ["tileB.b3dm", "sub/tileB.b3dm"],
      ["tileC.b3dm"],
      ["tileA.b3dm"],
    ];
    SpecHelpers.sortStringsLexicographically(actualContentUris);
    SpecHelpers.sortStringsLexicographically(expectedContentUris);
    expect(actualContentUris).toEqual(expectedContentUris);
  });

  it("forEachTile covers all tiles", async function () {
    const tilesetProcessor = new BasicTilesetProcessor();
    await tilesetProcessor.begin(basicInput, basicOutput, overwrite);

    const actualContentUris: string[][] = [];
    await tilesetProcessor.forEachTile(async (traversedTile: TraversedTile) => {
      const contentUris = traversedTile.getFinalContents().map((c) => c.uri);
      actualContentUris.push(contentUris);
      return true;
    });
    await tilesetProcessor.end();

    const expectedContentUris = [
      ["tileA.b3dm"],
      ["tileB.b3dm", "sub/tileB.b3dm"],
      ["tileC.b3dm"],
      ["tileA.b3dm"],
    ];
    SpecHelpers.sortStringsLexicographically(actualContentUris);
    SpecHelpers.sortStringsLexicographically(expectedContentUris);
    expect(actualContentUris).toEqual(expectedContentUris);
  });

  it("processTileContentEntries processes the tile content entries", async function () {
    const tilesetProcessor = new BasicTilesetProcessor();
    await tilesetProcessor.begin(basicInput, basicOutput, overwrite);
    const specEntryProcessor = new SpecEntryProcessor();
    await tilesetProcessor.processTileContentEntries(
      specEntryProcessor.processUri,
      specEntryProcessor.processEntry
    );
    await tilesetProcessor.end();

    // Expect the content files to have been processed
    const expectedProcessedKeys = [
      "sub/tileB.b3dm",
      "tileA.b3dm",
      "tileB.b3dm",
      "tileC.b3dm",
    ];
    const actualProcessedKeys = specEntryProcessor.processedKeys;
    actualProcessedKeys.sort();
    expectedProcessedKeys.sort();
    expect(actualProcessedKeys).toEqual(expectedProcessedKeys);

    // Expect the names of content files to have been modified
    const expectedOutputFiles = [
      "sub/PROCESSED_tileB.b3dm",
      "PROCESSED_tileA.b3dm",
      "PROCESSED_tileB.b3dm",
      "PROCESSED_tileC.b3dm",
      "README.md",
      "tileset.json",
    ];
    const actualOutputFiles = SpecHelpers.collectRelativeFileNames(basicOutput);
    actualOutputFiles.sort();
    expectedOutputFiles.sort();
    expect(actualOutputFiles).toEqual(expectedOutputFiles);
  });

  it("processTileContentEntries processes the tile content entries for external tilesets", async function () {
    const tilesetProcessor = new BasicTilesetProcessor();
    await tilesetProcessor.begin(externalInput, externalOutput, overwrite);
    const specEntryProcessor = new SpecEntryProcessor();
    await tilesetProcessor.processTileContentEntries(
      specEntryProcessor.processUri,
      specEntryProcessor.processEntry
    );
    await tilesetProcessor.end();

    // Expect the content files to have been processed
    const expectedProcessedKeys = [
      "tile.b3dm",
      "tileA.b3dm",
      "externalA.json",
      "ExternalB/externalB.json",
      "ExternalB/tileB.b3dm",
      "ExternalC/externalC.json",
      "ExternalC/tileC.b3dm",
      "tileX.b3dm",
    ];
    const actualProcessedKeys = specEntryProcessor.processedKeys;
    actualProcessedKeys.sort();
    expectedProcessedKeys.sort();
    expect(actualProcessedKeys).toEqual(expectedProcessedKeys);

    // Expect the names of content files to have been modified
    const expectedOutputFiles = [
      "PROCESSED_tile.b3dm",
      "PROCESSED_tileA.b3dm",
      "ExternalB/PROCESSED_tileB.b3dm",
      "ExternalC/PROCESSED_tileC.b3dm",
      "PROCESSED_tileX.b3dm",
      "README.md",
      "tileset.json",
      "PROCESSED_externalA.json",
      "ExternalB/PROCESSED_externalB.json",
      "ExternalC/PROCESSED_externalC.json",
    ];
    const actualOutputFiles =
      SpecHelpers.collectRelativeFileNames(externalOutput);
    actualOutputFiles.sort();
    expectedOutputFiles.sort();
    expect(actualOutputFiles).toEqual(expectedOutputFiles);

    // Expect that the content URIs in the "tileset.json" have been modified
    const expectedContentUris = [
      "PROCESSED_tile.b3dm",
      "PROCESSED_externalA.json",
    ];
    const actualContentUris =
      await SpecHelpers.collectExplicitContentUrisFromFile(
        Paths.join(externalOutput, "tileset.json")
      );
    expectedContentUris.sort();
    actualContentUris.sort();
    expect(actualContentUris).toEqual(expectedContentUris);

    // Expect that the content URIs in the "externalA.json" have been modified
    const expectedContentUrisA = [
      "PROCESSED_tileA.b3dm",
      "ExternalB/PROCESSED_externalB.json",
    ];
    const actualContentUrisA =
      await SpecHelpers.collectExplicitContentUrisFromFile(
        Paths.join(externalOutput, "PROCESSED_externalA.json")
      );
    expectedContentUrisA.sort();
    actualContentUrisA.sort();
    expect(actualContentUrisA).toEqual(expectedContentUrisA);

    // Expect that the content URIs in the "externalB.json" have been modified
    const expectedContentUrisB = [
      "PROCESSED_tileB.b3dm",
      "../PROCESSED_tileX.b3dm",
      "../ExternalC/PROCESSED_externalC.json",
    ];
    const actualContentUrisB =
      await SpecHelpers.collectExplicitContentUrisFromFile(
        Paths.join(externalOutput, "ExternalB/PROCESSED_externalB.json")
      );
    expectedContentUrisB.sort();
    actualContentUrisB.sort();
    expect(actualContentUrisB).toEqual(expectedContentUrisB);

    // Expect that the content URIs in the "externalC.json" have been modified
    const expectedContentUrisC = [
      "PROCESSED_tileC.b3dm",
      "../PROCESSED_tileX.b3dm",
    ];
    const actualContentUrisC =
      await SpecHelpers.collectExplicitContentUrisFromFile(
        Paths.join(externalOutput, "ExternalC/PROCESSED_externalC.json")
      );
    expectedContentUrisC.sort();
    actualContentUrisC.sort();
    expect(actualContentUrisC).toEqual(expectedContentUrisC);
  });

  it("processTileContentEntries updates the content URIs", async function () {
    const tilesetProcessor = new BasicTilesetProcessor();
    await tilesetProcessor.begin(basicInput, basicOutput, overwrite);
    const specEntryProcessor = new SpecEntryProcessor();
    await tilesetProcessor.processTileContentEntries(
      specEntryProcessor.processUri,
      specEntryProcessor.processEntry
    );
    await tilesetProcessor.end();

    // Ensure that the 'tileset.json' contains the
    // proper content URIs for the processed output
    const actualContentUris =
      await SpecHelpers.collectExplicitContentUrisFromFile(
        Paths.join(basicOutput, "tileset.json")
      );

    const expectedContentUris = [
      "sub/PROCESSED_tileB.b3dm",
      "PROCESSED_tileA.b3dm",
      "PROCESSED_tileA.b3dm",
      "PROCESSED_tileB.b3dm",
      "PROCESSED_tileC.b3dm",
    ];
    actualContentUris.sort();
    expectedContentUris.sort();
    expect(actualContentUris).toEqual(expectedContentUris);
  });

  it("processTileContentEntries updates the tile contents", async function () {
    const tilesetProcessor = new BasicTilesetProcessor();
    await tilesetProcessor.begin(basicInput, basicOutput, overwrite);

    const inputTilesetJsonBuffer = fs.readFileSync(
      Paths.join(basicInput, "tileset.json")
    );
    const inputTileset = JSON.parse(inputTilesetJsonBuffer.toString());

    // Initially, child 0 contains multiple contents
    // (namely, "tileB.b3dm" and "sub/tileB.b3dm")
    expect(inputTileset.root.children[0].content).toBeUndefined();
    expect(inputTileset.root.children[0].contents).toBeDefined();

    // Initially, child 1 contains a single content
    // (namely, "tileC.b3dm")
    expect(inputTileset.root.children[1].content).toBeDefined();
    expect(inputTileset.root.children[1].contents).toBeUndefined();

    // Define an entry processor that removes
    // - one of the multiple contents of child 0
    // - the only content of child 1
    const entryProcessor = async (
      sourceEntry: TilesetEntry,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      type: string | undefined
    ) => {
      if (sourceEntry.key.startsWith("sub/")) {
        return undefined;
      }
      if (sourceEntry.key.startsWith("tileC")) {
        return undefined;
      }
      return {
        key: sourceEntry.key,
        value: sourceEntry.value,
      };
    };
    await tilesetProcessor.processTileContentEntries(
      (uri: string) => uri,
      entryProcessor
    );
    await tilesetProcessor.end();

    const outputTilesetJsonBuffer = fs.readFileSync(
      Paths.join(basicOutput, "tileset.json")
    );
    const outputTileset = JSON.parse(outputTilesetJsonBuffer.toString());

    // After processing, child 0 only contains a single content
    expect(outputTileset.root.children[0].content).toBeDefined();
    expect(outputTileset.root.children[0].contents).toBeUndefined();

    // After processing, child 1 contains no content or contents
    expect(outputTileset.root.children[1].content).toBeUndefined();
    expect(outputTileset.root.children[1].contents).toBeUndefined();
  });

  it("updateTileContent updates the tile contents", async function () {
    const tile: Tile = {
      content: {
        uri: "SPEC_URI",
      },
      boundingVolume: {
        box: [0.5, 0.5, 0.5, 0.5, 0.0, 0.0, 0.0, 0.5, 0.0, 0.0, 0.0, 0.5],
      },
      geometricError: 1.0,
    };

    // Using an empty `contentUris` array causes `content` and
    // `contents` to become undefined
    const contentUris0: string[] = [];
    BasicTilesetProcessor.updateTileContent(tile, contentUris0);
    expect(tile.content).toBeUndefined();
    expect(tile.contents).toBeUndefined();

    // Using a single-element `contentUris` array causes `content`
    // to be defined, but `contents` to be undefined
    const contentUris1 = ["SPEC_URI"];
    BasicTilesetProcessor.updateTileContent(tile, contentUris1);
    expect(tile.content).toBeDefined();
    expect(tile.contents).toBeUndefined();

    // Using a multi-element `contentUris` array causes `content`
    // to be undefined, but `contents` to be defined
    const contentUris2 = ["SPEC_URI_0", "SPEC_URI_1"];
    BasicTilesetProcessor.updateTileContent(tile, contentUris2);
    expect(tile.content).toBeUndefined();
    expect(tile.contents).toBeDefined();
  });
});

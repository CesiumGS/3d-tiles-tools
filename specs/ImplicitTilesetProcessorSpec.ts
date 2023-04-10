/* eslint-disable @typescript-eslint/no-unused-vars */
import fs from "fs";

import { SpecHelpers } from "./SpecHelpers";
import { SpecProcessor } from "./SpecEntryProcessor";

import { BasicTilesetProcessor } from "../src/tilesetProcessing/BasicTilesetProcessor";

import { Tiles } from "../src/tilesets/Tiles";

import { Tile } from "../src/structure/Tile";

import { TraversedTile } from "../src/traversal/TraversedTile";

import { TilesetSources } from "../src/tilesetData/TilesetSources";

const implicitInput = "./specs/data/tilesetProcessing/implicitProcessing";
const implicitOutput =
  "./specs/data/output/tilesetProcessing/implicitProcessing";
const quiet = true;
const overwrite = true;

/**
 * Tests that verify that the `forEach...` and `process...` methods
 * of the BasicTilesetProcessor visit and process the correct
 * elements on implicit tilesets
 */
describe("BasicTilesetProcessor on implicit input", function () {
  afterEach(function () {
    SpecHelpers.forceDeleteDirectory(implicitOutput);
  });

  it("forEachExplicitTile covers all explicit tiles", async function () {
    const tilesetProcessor = new BasicTilesetProcessor(quiet);
    await tilesetProcessor.begin(implicitInput, implicitOutput, overwrite);

    // There is only one explicit tile in the 'implicitProcessing' data
    const actualContentUris: string[][] = [];
    await tilesetProcessor.forEachExplicitTile(async (tile: Tile) => {
      const contentUris = Tiles.getContentUris(tile);
      actualContentUris.push(contentUris);
    });
    await tilesetProcessor.end();

    // NOTE: The order is actually not specified.
    // This should be sorted lexographically for
    // the comparison...
    const expectedContentUris = [["content/content_{level}__{x}_{y}.glb"]];
    expect(actualContentUris).toEqual(expectedContentUris);
  });

  it("forEachTile covers all tiles", async function () {
    const tilesetProcessor = new BasicTilesetProcessor(quiet);
    await tilesetProcessor.begin(implicitInput, implicitOutput, overwrite);

    const actualContentUris: string[][] = [];
    await tilesetProcessor.forEachTile(async (traversedTile: TraversedTile) => {
      const contentUris = traversedTile.getFinalContents().map((c) => c.uri);
      actualContentUris.push(contentUris);
    });
    await tilesetProcessor.end();

    // Just check the number of content URIs from visited tiles:
    // - 1 for the implicit tiling root (with template URI as content URI)
    // - 1 for the root
    // - 4 for the tiles at level 1
    // - 4 for the tiles at level 2
    // - 12 for the tiles at level 3
    expect(actualContentUris.length).toEqual(22);
  });

  it("processAllEntries processes all entries exactly once", async function () {
    const tilesetProcessor = new BasicTilesetProcessor(quiet);
    await tilesetProcessor.begin(implicitInput, implicitOutput, overwrite);
    const specProcessor = new SpecProcessor();
    await tilesetProcessor.processAllEntries(specProcessor.processEntry);
    await tilesetProcessor.end();

    const actualProcessedKeys = specProcessor.processedKeys;
    const actualOutputFiles =
      SpecHelpers.collectRelativeFileNames(implicitOutput);

    // Just check the number of processed entries: It should be the same
    // as the number of output files, minus 1 for the 'tileset.json'
    expect(actualProcessedKeys.length).toEqual(actualOutputFiles.length - 1);
  });

  it("processTileContentEntries processes the tile content entries", async function () {
    const tilesetProcessor = new BasicTilesetProcessor(quiet);
    await tilesetProcessor.begin(implicitInput, implicitOutput, overwrite);
    const specProcessor = new SpecProcessor();
    await tilesetProcessor.processTileContentEntries(
      specProcessor.processUri,
      specProcessor.processEntry
    );
    await tilesetProcessor.end();

    const actualProcessedKeys = specProcessor.processedKeys;

    // Just check the number of processed entries: It should be the same
    // as the number of tiles in the input
    // - 1 for the root
    // - 4 for the tiles at level 1
    // - 4 for the tiles at level 2
    // - 12 for the tiles at level 3
    expect(actualProcessedKeys.length).toEqual(21);
  });

  it("processTileContentEntries updates the content URIs", async function () {
    const tilesetProcessor = new BasicTilesetProcessor(quiet);
    await tilesetProcessor.begin(implicitInput, implicitOutput, overwrite);
    const specProcessor = new SpecProcessor();
    await tilesetProcessor.processTileContentEntries(
      specProcessor.processUri,
      specProcessor.processEntry
    );
    await tilesetProcessor.end();

    // Collect all content URIs from the output tileset
    const outputTilesetSource = TilesetSources.createAndOpen(implicitOutput);
    const outputTileset = SpecHelpers.parseTileset(outputTilesetSource);
    const actualContentUris = await SpecHelpers.collectContentUris(
      outputTileset,
      outputTilesetSource
    );
    outputTilesetSource.close();

    // Ensure that all content URIs have been updated
    for (const contentUri of actualContentUris) {
      expect(contentUri.startsWith("PROCESSED")).toBeTrue();
    }

    // Ensure that the template URI was updated
    const templateUri = outputTileset.root.content?.uri;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(templateUri!.startsWith("PROCESSED")).toBeTrue();
  });
});

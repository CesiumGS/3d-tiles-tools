import path from "path";

import { Tile } from "../../../src/structure";

import { Tiles } from "../../../src/tilesets";
import { TraversedTile } from "../../../src/tilesets";
import { TilesetSources } from "../../../src/tilesets";

import { BasicTilesetProcessor } from "../../../src/tools";

import { SpecEntryProcessor } from "./SpecEntryProcessor";

import { SpecHelpers } from "../../SpecHelpers";

const SPECS_DATA_BASE_DIRECTORY = SpecHelpers.getSpecsDataBaseDirectory();

const implicitInput =
  SPECS_DATA_BASE_DIRECTORY + "/tilesetProcessing/implicitProcessing";
const implicitOutput =
  SPECS_DATA_BASE_DIRECTORY + "/output/tilesetProcessing/implicitProcessing";
const overwrite = true;

/**
 * Tests that verify that the `forEach...` and `process...` methods
 * of the BasicTilesetProcessor visit and process the correct
 * elements on implicit tilesets
 */
describe("BasicTilesetProcessor on implicit input", function () {
  afterEach(function () {
    SpecHelpers.forceDeleteDirectory(
      SPECS_DATA_BASE_DIRECTORY + "/output/tilesetProcessing"
    );
  });

  it("forEachExplicitTile covers all explicit tiles", async function () {
    const tilesetProcessor = new BasicTilesetProcessor();
    await tilesetProcessor.begin(implicitInput, implicitOutput, overwrite);

    // There is only one explicit tile in the 'implicitProcessing' data
    const actualContentUris: string[][] = [];
    await tilesetProcessor.forEachExplicitTile(async (tile: Tile) => {
      const contentUris = Tiles.getContentUris(tile);
      actualContentUris.push(contentUris);
    });
    await tilesetProcessor.end();

    const expectedContentUris = [["content/content_{level}__{x}_{y}.glb"]];
    expect(actualContentUris).toEqual(expectedContentUris);
  });

  it("forEachTile covers all tiles", async function () {
    const tilesetProcessor = new BasicTilesetProcessor();
    await tilesetProcessor.begin(implicitInput, implicitOutput, overwrite);

    const actualContentUris: string[][] = [];
    await tilesetProcessor.forEachTile(async (traversedTile: TraversedTile) => {
      const contentUris = traversedTile.getFinalContents().map((c) => c.uri);
      actualContentUris.push(contentUris);
      return true;
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

  it("processTileContentEntries processes the tile content entries", async function () {
    const tilesetProcessor = new BasicTilesetProcessor();
    await tilesetProcessor.begin(implicitInput, implicitOutput, overwrite);
    const specEntryProcessor = new SpecEntryProcessor();
    await tilesetProcessor.processTileContentEntries(
      specEntryProcessor.processUri,
      specEntryProcessor.processEntry
    );
    await tilesetProcessor.end();

    const actualProcessedKeys = specEntryProcessor.processedKeys;

    // Just check the number of processed entries: It should be the same
    // as the number of tiles in the input
    // - 1 for the root
    // - 4 for the tiles at level 1
    // - 4 for the tiles at level 2
    // - 12 for the tiles at level 3
    expect(actualProcessedKeys.length).toEqual(21);
  });

  it("processTileContentEntries updates the content URIs", async function () {
    const tilesetProcessor = new BasicTilesetProcessor();
    await tilesetProcessor.begin(implicitInput, implicitOutput, overwrite);
    const specEntryProcessor = new SpecEntryProcessor();
    await tilesetProcessor.processTileContentEntries(
      specEntryProcessor.processUri,
      specEntryProcessor.processEntry
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
      expect(path.basename(contentUri).startsWith("PROCESSED")).toBeTrue();
    }

    // Ensure that the template URI was updated
    const templateUri = outputTileset.root.content?.uri;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(path.basename(templateUri!).startsWith("PROCESSED")).toBeTrue();
  });
});

/* eslint-disable @typescript-eslint/no-unused-vars */
import { TilesetEntry } from "3d-tiles-tools";

import { TilesetDataProcessor } from "3d-tiles-tools";

const SPECS_DATA_BASE_DIRECTORY = "./specs/data";

async function example() {
  const tilesetSourceName =
    SPECS_DATA_BASE_DIRECTORY +
    "/tilesetProcessing/implicitProcessing/tileset.json";
  const tilesetTargetName = "./output/tilesetProcessing-result/tileset.json";
  const overwrite = true;

  const tilesetProcessor = new TilesetDataProcessor();
  await tilesetProcessor.begin(tilesetSourceName, tilesetTargetName, overwrite);

  // Process a single entry
  await tilesetProcessor.processEntry(
    "tileset.json",
    async (
      sourceEntry: TilesetEntry,
      type: string | undefined
    ): Promise<TilesetEntry> => {
      console.log("In processEntry, processing " + sourceEntry.key);
      return sourceEntry;
    }
  );

  // Process all entries that have not been processed yet
  await tilesetProcessor.processAllEntries(
    async (
      sourceEntry: TilesetEntry,
      type: string | undefined
    ): Promise<TilesetEntry> => {
      console.log("In processAllEntries, processing " + sourceEntry.key);
      return sourceEntry;
    }
  );

  await tilesetProcessor.end();
}

example();

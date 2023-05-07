import { TilesetEntry } from "../tilesetData/TilesetEntry";

import { BasicTilesetProcessor } from "./BasicTilesetProcessor";
import { TileContentProcessor } from "./TileContentProcessor";

export class TileContentProcessing {
  static async process(
    tilesetSourceName: string,
    tilesetTargetName: string,
    overwrite: boolean,
    tileContentProcessor: TileContentProcessor
  ) {
    const quiet = false;
    const tilesetProcessor = new BasicTilesetProcessor(quiet);
    await tilesetProcessor.begin(
      tilesetSourceName,
      tilesetTargetName,
      overwrite
    );

    const entryProcessor = async (
      sourceEntry: TilesetEntry,
      type: string | undefined
    ) => {
      const targetValue = await tileContentProcessor(type, sourceEntry.value);
      const targetEntry = {
        key: sourceEntry.key,
        value: targetValue,
      };
      return targetEntry;
    };
    await tilesetProcessor.processTileContentEntries(
      (uri: string) => uri,
      entryProcessor
    );
    await tilesetProcessor.end();
  }
}

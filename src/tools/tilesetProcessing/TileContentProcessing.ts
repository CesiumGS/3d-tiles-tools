import { TilesetEntry } from "../../tilesets";

import { BasicTilesetProcessor } from "./BasicTilesetProcessor";
import { TileContentProcessor } from "./TileContentProcessor";

/**
 * Methods for processing the tile content of tilesets.
 *
 * @internal
 */
export class TileContentProcessing {
  /**
   * Process each tile content from the given tileset source,
   * using the given processor, and write it to the given
   * target.
   *
   * This will traverse the tileset in the tileset JSON of
   * the given source. Each entry that appears as one tile
   * content (i.e. as one `content.uri`) is passed to the
   * given `TileContentProcessor`, together with its type
   * information. The `TileContentProcessor` returns the
   * content that is supposed to be written into the target.
   *
   * @param tilesetSourceName - The name of the `TilesetSource`
   * @param tilesetTargetName - The name of the `TilesetTarget`
   * @param overwrite - Whether existing output may be overwritten
   * @param tileContentProcessor - The `TileContentProcessor`
   * @returns A promise that resolves when the process is finished
   */
  static async process(
    tilesetSourceName: string,
    tilesetTargetName: string,
    overwrite: boolean,
    tileContentProcessor: TileContentProcessor
  ): Promise<void> {
    const tilesetProcessor = new BasicTilesetProcessor();
    await tilesetProcessor.begin(
      tilesetSourceName,
      tilesetTargetName,
      overwrite
    );

    const entryProcessor = async (
      sourceEntry: TilesetEntry,
      type: string | undefined
    ) => {
      const targetValue = await tileContentProcessor(sourceEntry.value, type);
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

import { TilesetEntryProcessor } from "./TilesetEntryProcessor";
import { TilesetProcessor } from "./TilesetProcessor";

/**
 * A class that can process tileset data.
 *
 * This extends the `TilesetProcessor` with a function that
 * allows processing all entries ("files") of the source
 * tileset, and writing processed entries into the target.
 *
 * The common usage pattern is
 * ```
 * const tilesetProcessor = new TilesetDataProcessor();
 * await tilesetProcessor.begin(source, target, overwrite);
 * // Optionally process specific entries:
 * await tilesetProcessor.processEntry("example.txt", exampleEntryProcessor);
 * // Process all remaining (unprocessed) entries:
 * await tilesetProcessor.processAllEntries(entryProcessor);
 * await tilesetProcessor.end();
 * ```
 * where the entry processors are `TilesetEntryProcessor` instances
 * that will receive the `TilesetEntry` from the source, and return
 * a `TilesetEntry` that should be put into the target.
 *
 * @internal
 */
export class TilesetDataProcessor extends TilesetProcessor {
  /**
   * Applies the given entry processor to each `TilesetEntry` that
   * has not yet been processed
   *
   * @param entryProcessor - The entry processor
   * @returns A promise that resolves when the process is finished
   * @throws DeveloperError If `begin` was not called yet
   * @throws TilesetError When the input could not be processed
   */
  async processAllEntries(entryProcessor: TilesetEntryProcessor) {
    await this.processAllEntriesInternal(entryProcessor);
  }
}

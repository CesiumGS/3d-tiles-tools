import { DeveloperError } from "../../base";
import { ContentDataTypeRegistry } from "../../base";

import { TilesetError } from "../../tilesets";
import { TilesetEntry } from "../../tilesets";

import { TilesetEntryProcessor } from "./TilesetEntryProcessor";
import { TilesetProcessorContext } from "./TilesetProcessorContext";
import { TilesetProcessorContexts } from "./TilesetProcessorContexts";

import { Loggers } from "../../base";
const logger = Loggers.get("tilesetProcessing");

/**
 * A base class for classes that can process tilesets.
 *
 * This class offers the infrastructure for opening a `TilesetSource`
 * and a `TilesetTarget`, and performing operations on the
 * `TilesetEntry` objects.
 *
 * Subclasses can access the `TilesetProcessorContext`, which
 * contains the parsed tileset and its schema, and can offer
 * predefined sets of more specialized operations.
 *
 * @internal
 */
export abstract class TilesetProcessor {
  /**
   * The context that was created in `begin`
   */
  private context: TilesetProcessorContext | undefined;

  /**
   * Returns the `TilesetProcessorContext` that contains all
   * elements that are required for processing the tileset
   *
   * @returns The `TilesetProcessorContext`
   * @throws DeveloperError If `begin` was not called yet
   */
  protected getContext(): TilesetProcessorContext {
    if (!this.context) {
      throw new DeveloperError(
        "The processor was not initialized. Call 'begin' first."
      );
    }
    return this.context;
  }

  /**
   * Prepare processing the given tileset source and writing
   * the results into the given tileset target.
   *
   * @param tilesetSourceName - The tileset source name
   * @param tilesetTargetName - The tileset target name
   * @param overwrite - Whether the target should be overwritten if
   * it already exists
   * @returns A promise that resolves when this processor has been
   * initialized
   * @throws TilesetError When the input could not be opened,
   * or when the output already exists and `overwrite` was `false`.
   */
  async begin(
    tilesetSourceName: string,
    tilesetTargetName: string,
    overwrite: boolean
  ): Promise<void> {
    if (this.context) {
      throw new TilesetError("Processing has already begun");
    }
    this.context = await TilesetProcessorContexts.create(
      tilesetSourceName,
      tilesetTargetName,
      overwrite
    );
  }

  /**
   * Finish processing the source tileset and write all entries
   * that have not been processed yet into the target.
   *
   * @returns A promise that resolves when the operation finished
   * @throws TilesetError When there was an error while processing
   * or storing the entries.
   */
  async end() {
    const context = this.getContext();

    let pendingError: any = undefined;
    try {
      // Perform a no-op on all entries that have not yet
      // been marked as processed
      await this.processAllEntriesInternal(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        async (sourceEntry: TilesetEntry, type: string | undefined) => {
          return sourceEntry;
        }
      );
    } catch (error) {
      pendingError = error;
    }
    // Always clean up by deleting the context
    delete this.context;

    // Try to close the context
    try {
      await TilesetProcessorContexts.close(context);
    } catch (e) {
      if (!pendingError) {
        pendingError = e;
      }
    }
    if (pendingError) {
      throw pendingError;
    }
  }

  /**
   * Applies the given entry processor to each `TilesetEntry` that
   * has not yet been processed
   *
   * @param entryProcessor - The entry processor
   * @returns A promise that resolves when the process is finished
   * @throws DeveloperError If `begin` was not called yet
   * @throws TilesetError When the input could not be processed
   */
  protected async processAllEntriesInternal(
    entryProcessor: TilesetEntryProcessor
  ) {
    const context = this.getContext();
    const tilesetSource = context.tilesetSource;
    const sourceKeys = tilesetSource.getKeys();
    for (const sourceKey of sourceKeys) {
      await this.processEntry(sourceKey, entryProcessor);
    }
  }

  /**
   * Process the specified entry.
   *
   * If the entry with the specified key was already processed,
   * then this method does nothing.
   *
   * Otherwise, the specified entry will be looked up in the tileset
   * source, and passed to the given entry processor, together with
   * its type information.
   *
   * The resulting target entry (if any) will be stored in the
   * tileset target, and both the source and the target will
   * be marked as 'processed'
   *
   * @param sourceKey - The key (file name) of the entry
   * @param entryProcessor - The `TilesetEntryProcessor` that will
   * be called to process the actual entry.
   * @returns A promise that resolves when the process is finished
   * @throws DeveloperError When the source or target is not opened
   * @throws TilesetError When the input could not be processed
   */
  async processEntry(
    sourceKey: string,
    entryProcessor: TilesetEntryProcessor
  ): Promise<void> {
    if (this.isProcessed(sourceKey)) {
      return;
    }
    const sourceEntry = await this.fetchSourceEntry(sourceKey);
    if (!sourceEntry) {
      this.markAsProcessed(sourceKey);
      const message = `No ${sourceKey} found in input`;
      //throw new TilesetError(message);
      logger.warn(message);
      return;
    }
    const targetEntry = await this.processEntryInternal(
      sourceEntry,
      entryProcessor
    );

    this.markAsProcessed(sourceEntry.key);
    if (targetEntry) {
      this.putTargetKey(sourceEntry.key, targetEntry.key);
      this.markAsProcessed(targetEntry.key);
      this.storeTargetEntries(targetEntry);
    }
  }

  /**
   * Process the given source entry, and return the processed result.
   *
   * This will determine the content type of the given entry, and pass
   * it together with its type information to the `entryProcessor`.
   *
   * This will *not* store the returned target entry in the tileset
   * target. To do so, `storeTargetEntries` has to be called with
   * the result.
   *
   * @param sourceEntry - The source entry
   * @param entryProcessor - The `TilesetEntryProcessor`
   * @returns The target entry
   */
  private async processEntryInternal(
    sourceEntry: TilesetEntry,
    entryProcessor: TilesetEntryProcessor
  ): Promise<TilesetEntry | undefined> {
    const type = await ContentDataTypeRegistry.findType(
      sourceEntry.key,
      sourceEntry.value
    );

    logger.debug(`Processing source: ${sourceEntry.key} with type ${type}`);

    const targetEntry = await entryProcessor(sourceEntry, type);

    logger.debug(`        to target: ${targetEntry?.key}`);

    return targetEntry;
  }

  /**
   * Fetch the entry for the specified key from the current tileset
   * source. If there is no entry for the given key, then `undefined`
   * is returned.
   *
   * @param key - The key (file name)
   * @returns The object containing the entry and its type
   */
  async fetchSourceEntry(key: string): Promise<TilesetEntry | undefined> {
    const context = this.getContext();
    const tilesetSource = context.tilesetSource;

    const sourceKey = key;
    const sourceValue = tilesetSource.getValue(sourceKey);
    if (!sourceValue) {
      logger.warn(`No input found for ${sourceKey}`);
      return undefined;
    }
    const sourceEntry: TilesetEntry = {
      key: sourceKey,
      value: sourceValue,
    };
    return sourceEntry;
  }

  /**
   * Store the given entries in the current target
   *
   * @param targetEntries - The target entries
   */
  storeTargetEntries(...targetEntries: TilesetEntry[]) {
    const context = this.getContext();
    const tilesetTarget = context.tilesetTarget;
    for (const targetEntry of targetEntries) {
      tilesetTarget.addEntry(targetEntry.key, targetEntry.value);
    }
  }

  /**
   * Mark a certain entry (file) as already having been processed,
   * and no longer be considered in subsequent steps.
   *
   * @param key - The key (file name)
   */
  markAsProcessed(key: string) {
    const context = this.getContext();
    context.processedKeys[key] = true;
  }

  /**
   * Returns whether the entry with the given key (file name) was
   * already processed.
   *
   * @param key - The key (file name)
   * @returns Whether the entry was already processed
   */
  isProcessed(key: string): boolean {
    const context = this.getContext();
    return context.processedKeys[key] === true;
  }

  /**
   * Stores the new key (file name) that the the entry with the
   * given key received during processing.
   *
   * @param sourceKey - The key (file name)
   * @returns The target key, or `undefined`
   */
  protected putTargetKey(sourceKey: string, targetKey: string) {
    const context = this.getContext();
    context.targetKeys[sourceKey] = targetKey;
  }

  /**
   * Returns the new key (file name) that the the entry with the
   * given key received during processing.
   *
   * When this is `undefined`, then this may either mean that
   * the entry was removed during processing, or that it has
   * not been procesed yet. The latter can be checked with
   * `isProcessed`.
   *
   * @param sourceKey - The key (file name)
   * @returns The target key, or `undefined`
   */
  protected getTargetKey(sourceKey: string): string | undefined {
    const context = this.getContext();
    return context.targetKeys[sourceKey];
  }
}

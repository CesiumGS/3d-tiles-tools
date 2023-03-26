import { Buffers } from "../base/Buffers";
import { DeveloperError } from "../base/DeveloperError";

import { BufferedContentData } from "../contentTypes/BufferedContentData";
import { ContentDataTypeRegistry } from "../contentTypes/ContentDataTypeRegistry";

import { Tileset } from "../structure/Tileset";
import { Schema } from "../structure/Metadata/Schema";

import { TilesetError } from "../tilesetData/TilesetError";
import { TilesetSource } from "../tilesetData/TilesetSource";
import { TilesetTarget } from "../tilesetData/TilesetTarget";
import { TilesetTargets } from "../tilesetData/TilesetTargets";
import { TilesetSources } from "../tilesetData/TilesetSources";
import { TilesetEntry } from "../tilesetData/TilesetEntry";

import { Tilesets } from "../tilesets/Tilesets";

import { TilesetEntryProcessor } from "./TilesetEntryProcessor";

/**
 * A base class for classes that can process tilesets.
 *
 * This class offers a `process` method that receives a name
 * of a `TilesetSource` and a `TilesetTarget`. It will open
 * the source and the target, process all entries of the
 * source, and put the results into the target.
 *
 * The abstract `processEntry` method is the main configuration
 * point: It may be overridden by subclasses to process each
 * entry as necessary.
 */
export abstract class TilesetProcessor {
  /**
   * A function that will receive log messages
   */
  private readonly logCallback: (message: any) => void;

  /**
   * The tileset source for the input
   */
  private tilesetSource: TilesetSource | undefined;

  /**
   * The tileset target for the output.
   */
  private tilesetTarget: TilesetTarget | undefined;

  /**
   * The set of keys (file names) that have already been processed.
   * This includes the original keys, as well as new keys that
   * have been assigned to entries while they have been processed.
   */
  private processedKeys: { [key: string]: boolean } = {};

  /**
   * Creates a new instance
   *
   * @param quiet - Whether log messages should be omitted
   */
  constructor(quiet?: boolean) {
    if (quiet !== true) {
      this.logCallback = (message: any) => console.log(message);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
      this.logCallback = (message: any) => {};
    }
  }

  /**
   * Returns the tileset source, or undefined when no source
   * has been opened.
   *
   * @returns - The `TilesetSource`
   */
  protected getTilesetSource(): TilesetSource | undefined {
    return this.tilesetSource;
  }

  /**
   * Internal method to just call the log callback
   *
   * @param message - The message
   */
  protected log(message: any): void {
    this.logCallback(message);
  }

  /**
   * Process the specified source tileset, and write it to the given
   * target.
   *
   * @param tilesetSourceName - The tileset source name
   * @param tilesetTargetName - The tileset target name
   * @param overwrite Whether the target should be overwritten if
   * it already exists
   * @returns A promise that resolves when the process is finished
   * @throws TilesetError When the input could not be processed,
   * or when the output already exists and `overwrite` was `false`.
   */
  async process(
    tilesetSourceName: string,
    tilesetTargetName: string,
    overwrite: boolean
  ): Promise<void> {
    // TODO Somehow ensure that the source is closed
    // if the target throws up (try-with-resources FTW)
    const tilesetSource = TilesetSources.createAndOpen(tilesetSourceName);
    const tilesetTarget = TilesetTargets.createAndBegin(
      tilesetTargetName,
      overwrite
    );

    this.tilesetSource = tilesetSource;
    this.tilesetTarget = tilesetTarget;

    const tilesetSourceJsonFileName =
      Tilesets.determineTilesetJsonFileName(tilesetSourceName);

    const tilesetTargetJsonFileName =
      Tilesets.determineTilesetJsonFileName(tilesetTargetName);

    await this.processInternal(
      tilesetSourceJsonFileName,
      tilesetTargetJsonFileName
    );

    tilesetSource.close();
    await tilesetTarget.end();

    this.tilesetSource = undefined;
    this.tilesetTarget = undefined;
    Object.keys(this.processedKeys).forEach(
      (key) => delete this.processedKeys[key]
    );
  }

  /**
   * Internal (top-level) method for the processing.
   *
   * It reads the tileset JSON from the specified source, passes
   * it to `processTileset`, and writes the tileset JSON to the
   * specified target.
   *
   * Any operations that affect files other than the tileset JSON
   * file are part of `processTileset`
   *
   * @param tilesetSourceName - The tileset source name
   * @param tilesetTargetName - The tileset target name
   * @returns A promise that resolves when the process is finished
   * @throws DeveloperError When the source or target is not opened
   * @throws TilesetError When the input could not be processed
   */
  private async processInternal(
    tilesetSourceJsonFileName: string,
    tilesetTargetJsonFileName: string
  ): Promise<void> {
    if (!this.tilesetSource || !this.tilesetTarget) {
      throw new DeveloperError("The source and target must be defined");
    }

    // Obtain the tileset object from the tileset JSON file
    const parsedTileset = this.parseSourceValue<Tileset>(
      tilesetSourceJsonFileName
    );

    // Resolve the schema, either from the `tileset.schema`
    // or the `tileset.schemaUri`
    const schema = this.resolveSchema(parsedTileset.result);

    // Process the actual tileset
    await this.processTilesetInternal(parsedTileset.result, schema);

    // Store the resulting tileset as JSON
    this.storeTargetValue(
      tilesetTargetJsonFileName,
      parsedTileset.wasZipped,
      parsedTileset.result
    );
  }

  /**
   * Process the given tileset.
   *
   * This will just call `processEntries` and `processTileset`,
   * where the latter serves as a point where implementors may
   * perform modifications to the tileset JSON.
   *
   * @param tileset - The tileset
   * @param schema - The optional metadata schema for the tileset
   * @returns A promise that resolves when the process is finished
   * @throws TilesetError When the input could not be processed
   */
  protected async processTilesetInternal(
    tileset: Tileset,
    schema: Schema | undefined
  ): Promise<void> {
    await this.processEntries();
    await this.processTilesetJson(tileset, schema);
  }

  /**
   * Process the given tileset.
   *
   * Implementors may modify the given `Tileset`. The result
   * will be written into the target, after all entries have
   * been processed.
   *
   * @param tileset - The tileset
   * @param schema - The optional metadata schema for the tileset
   * @returns A promise that resolves when the process is finished
   * @throws TilesetError When the input could not be processed
   */
  protected async processTilesetJson(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    tileset: Tileset,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    schema: Schema | undefined
  ): Promise<void> {
    // No-op
  }

  /**
   * Process all entries that are contained in the current
   * tileset source.
   *
   * @returns A promise that resolves when the process is finished
   * @throws DeveloperError When the source or target is not opened
   * @throws TilesetError When the input could not be processed
   */
  protected async processEntries(): Promise<void> {
    if (!this.tilesetSource || !this.tilesetTarget) {
      throw new DeveloperError("The source and target must be defined");
    }
    const entries = TilesetSources.getEntries(this.tilesetSource);
    for (const entry of entries) {
      const key = entry.key;
      await this.processEntryInternal(key, this.processEntry);
    }
  }

  /**
   * Process the specified entry.
   *
   * If the entry with the specified key was already processed,
   * then this method does nothing.
   *
   * Otherwise, the specified entry will be looked up in the tileset
   * source. Its content type will be determined. The source entry
   * will be passed to `processEntry`, which returns the target
   * entries that will be inserted into the tileset target.
   *
   * @param key - The key (file name) of the entry
   * @param entryProcessor - The `TilesetEntryProcessor` that will
   * be called to process the actual entry.
   * @returns A promise that resolves when the process is finished,
   * containing either the resulting entries
   * @throws DeveloperError When the source or target is not opened
   * @throws TilesetError When the input could not be processed
   */
  protected async processEntryInternal(
    key: string,
    entryProcessor: TilesetEntryProcessor
  ): Promise<TilesetEntry[]> {
    if (!this.tilesetSource || !this.tilesetTarget) {
      throw new DeveloperError("The source and target must be defined");
    }

    const sourceKey = key;
    if (this.isProcessed(sourceKey)) {
      return [];
    }
    this.markAsProcessed(sourceKey);

    const sourceValue = this.tilesetSource.getValue(sourceKey);
    if (!sourceValue) {
      const message = `No ${sourceKey} found in input`;
      throw new TilesetError(message);
    }
    const sourceEntry: TilesetEntry = {
      key: sourceKey,
      value: sourceValue,
    };
    const type = await this.determineContentDataType(sourceKey, sourceValue);

    this.log(`Processing source : ${sourceKey} with type ${type}`);

    const targetEntries = await entryProcessor(sourceEntry, type);

    this.log(`        to targets: ${targetEntries?.map((t) => t.key)}`);

    if (targetEntries) {
      for (const targetEntry of targetEntries) {
        this.tilesetTarget.addEntry(targetEntry.key, targetEntry.value);
        this.markAsProcessed(targetEntry.key);
      }
    }
    return targetEntries;
  }

  /**
   * Process a single entry.
   *
   * This is the main configuration point for this class: Implementors
   * may override this method, perform arbitrary operations on the
   * given entry, and return the result.
   *
   * (A no-op implementation of this method would be to just return an
   * array that contains the given source entry as its only element)
   *
   * @param sourceEntry - The source entry
   * @param type The content data type (see `ContentDataTypes`)
   * @returns The target entries
   */
  protected abstract processEntry(
    sourceEntry: TilesetEntry,
    type: string | undefined
  ): Promise<TilesetEntry[]>;

  /**
   * A method that can be called by implementations, to mark a certain
   * file as already having been processed, and no longer be considered
   * in subsequent steps.
   *
   * @param key - The key (file name)
   */
  protected markAsProcessed(key: string) {
    this.processedKeys[key] = true;
  }

  /**
   * Returns whether the entry with the given key (file name) was
   * already processed.
   *
   * @param key - The key (file name)
   * @returns Whether the entry was already processed
   */
  protected isProcessed(key: string) {
    return this.processedKeys[key] === true;
  }

  /**
   * Determine the type of the given content data.
   *
   * The string will either be one of the `ContentDataTypes` strings,
   * or `undefined` if the type cannot be determined.
   *
   * @param key - The key (file name)
   * @param value - The value (file contents)
   * @returns A promise with the content data type string
   */
  private async determineContentDataType(
    key: string,
    value: Buffer
  ): Promise<string | undefined> {
    const contentData = new BufferedContentData(key, value);
    const type = await ContentDataTypeRegistry.findContentDataType(contentData);
    return type;
  }

  /**
   * Parses the JSON from the value with the given key (file name),
   * and returns the parsed result, AND information of whether the
   * input was zipped.
   *
   * This is mainly a convenience function to emulate the behavior of the
   * "legacy" tools in terms of handling the tileset JSON: When writing
   * the tileset JSON data to the target, then it should zip that JSON
   * data if and only if it was zipped in the input.
   *
   * See `storeTargetValue` for the counterpart of this method.
   *
   * In the future, there might be mechanisms for a more fine-grained
   * control over whether certain files should be zipped or not...
   *
   * @param key - The key (file name)
   * @returns A structure containing the `wasZipped` information, and
   * the parsed result
   * @throws TilesetError If the source is not opened, the specified
   * entry cannot be found, or the entry data could not be unzipped,
   * or its contents could not be parsed as JSON.
   */
  private parseSourceValue<T>(key: string): { wasZipped: boolean; result: T } {
    let value = this.getSourceValue(key);
    let wasZipped = false;
    if (Buffers.isGzipped(value)) {
      wasZipped = true;
      try {
        value = Buffers.gunzip(value);
      } catch (e) {
        const message = `Could not unzip ${key}: ${e}`;
        throw new TilesetError(message);
      }
    }
    try {
      const result = JSON.parse(value.toString()) as T;
      return {
        wasZipped: wasZipped,
        result: result,
      };
    } catch (e) {
      const message = `Could not parse ${key}: ${e}`;
      throw new TilesetError(message);
    }
  }

  /**
   * Convert the given object into a JSON string, put it into a buffer,
   * zip it (based on the `doZip` flag), and put the result into the
   * tileset target.
   *
   * This is only intended for the "legacy" handling of the tileset
   * JSON data, and is the counterpart of `parseSourceValue`. See
   * `parseSourceValue` for details.
   *
   * @param key - The key (file name)
   * @param doZip - Whether the output should be zipped
   * @param object - The object for which the JSON should be stored
   * @throws DeveloperError When the target is not opened
   */
  private storeTargetValue(key: string, doZip: boolean, object: object) {
    if (!this.tilesetTarget) {
      throw new DeveloperError("The target must be defined");
    }
    const jsonString = JSON.stringify(object, null, 2);
    let jsonBuffer = Buffer.from(jsonString);
    if (doZip) {
      jsonBuffer = Buffers.gzip(jsonBuffer);
    }
    this.tilesetTarget.addEntry(key, jsonBuffer);
  }

  /**
   * Obtains the value for the given key from the current tileset source,
   * throwing an error if the source is not opened, or when the
   * given key cannot be found.
   *
   * @param key - The key (file name)
   * @returns The value (file contents)
   * @throws DeveloperError When the source is not opened
   * @throws TilesetError When the given key cannot be found
   */
  private getSourceValue(key: string): Buffer {
    if (!this.tilesetSource) {
      throw new DeveloperError("The source must be defined");
    }
    const buffer = this.tilesetSource.getValue(key);
    if (!buffer) {
      const message = `No ${key} found in input`;
      throw new TilesetError(message);
    }
    return buffer;
  }

  /**
   * Resolve the `Schema` for the given tileset.
   *
   * This is either the `tileset.schema`, or the schema that is
   * obtained from the `tileset.schemaUri`, or `undefined` if
   * neither of them are present.
   *
   * @param tileset - The tileset
   * @returns The `Schema`, or `undefined` if there is none
   * @throws DeveloperError If the source is not opened
   * @throws TilesetError If the schema from the `schemaUri`
   * could not be resolved or parsed.
   */
  private resolveSchema(tileset: Tileset): Schema | undefined {
    if (!this.tilesetSource) {
      throw new DeveloperError("The source must be defined");
    }
    if (tileset.schema) {
      return tileset.schema;
    }
    if (tileset.schemaUri) {
      const parsedSchema = this.parseSourceValue<Schema>(tileset.schemaUri);
      return parsedSchema.result;
    }
    return undefined;
  }
}

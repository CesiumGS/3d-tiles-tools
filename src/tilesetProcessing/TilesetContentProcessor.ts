import { Buffers } from "../base/Buffers";
import { DeveloperError } from "../base/DeveloperError";

import { TilesetSourceResourceResolver } from "../io/TilesetSourceResourceResolver";

import { BufferedContentData } from "../contentTypes/BufferedContentData";
import { ContentDataTypeRegistry } from "../contentTypes/ContentDataTypeRegistry";

import { Tile } from "../structure/Tile";
import { Tileset } from "../structure/Tileset";
import { Content } from "../structure/Content";
import { Schema } from "../structure/Metadata/Schema";

import { TilesetError } from "../tilesetData/TilesetError";
import { TilesetSource } from "../tilesetData/TilesetSource";
import { TilesetTarget } from "../tilesetData/TilesetTarget";
import { TilesetTargets } from "../tilesetData/TilesetTargets";
import { TilesetSources } from "../tilesetData/TilesetSources";
import { TilesetEntry } from "../tilesetData/TilesetEntry";

import { TilesetTraverser } from "../traversal/TilesetTraverser";

import { Tiles } from "../tilesets/Tiles";
import { Tilesets } from "../tilesets/Tilesets";

/**
 * TODO Adjust this comment for the process* methods:
 *
 * A function that can process one entry of a tileset dataset.
 *
 * This will be called ONCE for each entry of the tileset source,
 * and return an entry that is supposed to be put into the tileset
 * target.
 *
 * It receives the source entry, which may represent a content
 * of an (explicit) tile, a content of an implicit tile, or just
 * one entry of the tileset source (i.e. a "file" that is not
 * a tile content).
 *
 * It returns the "processed" entry that is supposed to put into
 * the tileset target. If the returned entry is `undefined`, then
 * this means that the entry should be omitted in the target.
 *
 * Otherwise, the returned entry may have a different `key`
 * (file name), and/or a modified `value` (file data). This
 * entry will be put into the tileset target.
 *
 * Note that a modification of the `key` have different implications:
 *
 * - For explicit tile content, changes in the `key` will automatically
 *   be taken into account, by updating the `content.uri` accordingly
 * - For implicit tile content, changes in the `key` have to be taken
 *   into account by updating template URIs.
 * - For files, changes in the `key` have to be taken into account by
 *   domain-specific knowledge about what these files actually are.
 *
 * @param sourceEntry - The source entry
 * @param type - The type of the entry data (see `ContentDataTypes`),
 * or `undefined` if the type could not be determined.
 * @returns A promise that resolves when the process is finished,
 * containing either the new entry, or `undefined` when the entry
 * was supposed to be removed (i.e. omitted in the target).
 * @throws TilesetError When the input could not be processed
 *
 */
type ProcessEntryCallback = (
  sourceEntry: TilesetEntry,
  type: string | undefined
) => Promise<TilesetEntry | undefined>;

/**
 */
export class TilesetContentProcessor {
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
   * Internal method to just call the log callback
   *
   * @param message - The message
   */
  private log(message: any): void {
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
    await this.processTileset(parsedTileset.result, schema);

    // Store the resulting tileset as JSON
    this.storeTargetValue(
      tilesetTargetJsonFileName,
      parsedTileset.wasZipped,
      parsedTileset.result
    );
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

  /**
   * Process the given tileset.
   *
   * This will process...
   * - all explicit tile content entries
   * - all tile content entries (including implicit ones)
   * - all entries (including all of the above)
   * if they haven't been processed yet.
   *
   * @param tileset - The tileset
   * @param schema - The optional metadata schema for the tileset
   * @returns A promise that resolves when the process is finished
   * @throws TilesetError When the input could not be processed
   */
  private async processTileset(
    tileset: Tileset,
    schema: Schema | undefined
  ): Promise<void> {
    this.log(`Processing explicit tiles`);
    await this.processExplicitTilesContentEntries(tileset);

    this.log(`Processing all tiles`);
    await this.processAllTilesContentEntries(tileset, schema);

    this.log(`Processing all entries`);
    await this.processAllEntries();

    this.log(`Processing all implicit tileset roots`);
    await this.processImplicitTilesetRoots(tileset);
  }

  /**
   * Process all entries that are tile content of explicit tiles.
   *
   * @param tileset - The tileset
   * @returns A promise that resolves when the process is finished
   * @throws TilesetError When the input could not be processed
   */
  private async processExplicitTilesContentEntries(
    tileset: Tileset
  ): Promise<void> {
    const root = tileset.root;
    await Tiles.traverseExplicit(root, async (tilePath: Tile[]) => {
      const tile = tilePath[tilePath.length - 1];
      await this.processExplicitTileContentEntries(tile);
      return true;
    });
  }

  /**
   * Process all entries that are content of the given tile.
   *
   * @param tile - The tile
   * @returns A promise that resolves when the process is finished
   * @throws TilesetError When the input could not be processed
   */
  private async processExplicitTileContentEntries(tile: Tile): Promise<void> {
    // For roots of implicit tilesets, the content URI
    // is a template URI (i.e. they are not explicit,
    // and therefore not considered here)
    if (tile.implicitTiling) {
      return;
    }
    if (tile.content) {
      const content = tile.content;
      const targetEntry = await this.processEntry(
        content.uri,
        this.processExplicitTileContentEntry
      );
      if (targetEntry) {
        content.uri = targetEntry.key;
      } else {
        tile.content = undefined;
      }
    } else if (tile.contents) {
      const newContents: Content[] = [];
      for (const content of tile.contents) {
        const targetEntry = await this.processEntry(
          content.uri,
          this.processExplicitTileContentEntry
        );
        if (targetEntry) {
          content.uri = targetEntry.key;
          newContents.push(content);
        }
      }
      if (newContents.length > 0) {
        tile.contents = newContents;
      } else {
        tile.contents = undefined;
      }
    }
  }

  /**
   * Process all tiles that are roots of implicit tilesets.
   *
   * @param tileset - The tileset
   * @returns A promise that resolves when the process is finished
   * @throws TilesetError When the input could not be processed
   */
  private async processImplicitTilesetRoots(tileset: Tileset): Promise<void> {
    const root = tileset.root;
    await Tiles.traverseExplicit(root, async (tilePath: Tile[]) => {
      const tile = tilePath[tilePath.length - 1];
      if (tile.implicitTiling) {
        await this.processImplicitTilesetRoot(tile);
      }
      return true;
    });
  }

  /**
   * Process the given tile, which is a root of an implicit tileset.
   *
   * @param tile - The tile
   * @returns A promise that resolves when the process is finished
   * @throws TilesetError When the input could not be processed
   */
  private async processImplicitTilesetRoot(tile: Tile): Promise<void> {
    if (tile.content) {
      const content = tile.content;
      const newContent = await this.processImplicitTilesetRootContent(content);
      tile.content = newContent;
    } else if (tile.contents) {
      for (let i = 0; i < tile.contents.length; i++) {
        const content = tile.contents[i];
        const newContent = await this.processImplicitTilesetRootContent(
          content
        );
        tile.contents[i] = newContent;
      }
    }
  }

  /**
   * Process all entries that are tile content (both of explicit
   * and implicit tiles).
   *
   * @param tileset - The tileset
   * @param schema - The optional metadata schema for the tileset
   * @returns A promise that resolves when the process is finished
   * @throws DeveloperError When the source is not opened
   * @throws TilesetError When the input could not be processed
   */
  private async processAllTilesContentEntries(
    tileset: Tileset,
    schema: Schema | undefined
  ): Promise<void> {
    if (!this.tilesetSource) {
      throw new DeveloperError("The source must be defined");
    }

    // Create the resource resolver that will be used for
    // resolving ".subtree" files of implicit tilesets
    // during the traversal
    const resourceResolver = new TilesetSourceResourceResolver(
      ".",
      this.tilesetSource
    );
    const depthFirst = false;
    const traverseExternalTilesets = false;
    await TilesetTraverser.traverse(
      tileset,
      schema,
      resourceResolver,
      async (traversedTile) => {
        if (!traversedTile.isImplicitTilesetRoot()) {
          const contentUris = traversedTile
            .getFinalContents()
            .map((c) => c.uri);
          for (const contentUri of contentUris) {
            await this.processEntry(contentUri, this.processTileContentEntry);
          }
        }
        return true;
      },
      depthFirst,
      traverseExternalTilesets
    );
  }

  /**
   * Process all entries that are contained in the current
   * tileset source.
   *
   * @param tileset - The tileset
   * @returns A promise that resolves when the process is finished
   * @throws DeveloperError When the source or target is not opened
   * @throws TilesetError When the input could not be processed
   */
  private async processAllEntries(): Promise<void> {
    if (!this.tilesetSource || !this.tilesetTarget) {
      throw new DeveloperError("The source and target must be defined");
    }
    const entries = TilesetSources.getEntries(this.tilesetSource);
    for (const entry of entries) {
      const key = entry.key;
      await this.processEntry(key, this.processGenericEntry);
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
   * will be passed to `processEntryCallback`, which returns a target
   * entry. If the target entry is defined, then it is inserted
   * into the tileset target.
   *
   * This is the "staging" method for `processEntryCallback`
   * (see this field for further details)
   *
   * @param tileset - The tileset
   * @returns A promise that resolves when the process is finished,
   * containing either the new entry that was put into the tileset
   * target, or `undefined` when the entry was supposed to be
   * omitted in the target.
   * @throws DeveloperError When the source or target is not opened
   * @throws TilesetError When the input could not be processed
   */
  private async processEntry(
    key: string,
    callback: ProcessEntryCallback
  ): Promise<TilesetEntry | undefined> {
    if (!this.tilesetSource || !this.tilesetTarget) {
      throw new DeveloperError("The source and target must be defined");
    }

    const sourceKey = key;
    if (this.processedKeys[sourceKey] === true) {
      return;
    }
    this.processedKeys[sourceKey] = true;

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

    this.log(`Processing source: ${sourceKey} with type ${type}`);

    const targetEntry = await callback(sourceEntry, type);

    this.log(`        to target: ${targetEntry?.key}`);

    if (targetEntry) {
      this.tilesetTarget.addEntry(targetEntry.key, targetEntry.value);
      this.processedKeys[targetEntry.key] = true;
    }
    return targetEntry;
  }

  async processExplicitTileContentEntry(
    sourceEntry: TilesetEntry,
    type: string | undefined
  ): Promise<TilesetEntry | undefined> {
    return sourceEntry;
  }
  async processTileContentEntry(
    sourceEntry: TilesetEntry,
    type: string | undefined
  ): Promise<TilesetEntry | undefined> {
    return sourceEntry;
  }
  async processGenericEntry(
    sourceEntry: TilesetEntry,
    type: string | undefined
  ): Promise<TilesetEntry | undefined> {
    return sourceEntry;
  }
  async processImplicitTilesetRootContent(content: Content): Promise<Content> {
    return content;
  }

  /**
   * TODO Consider something like this, for example, for "inlining"
   * references to external PNGs into a GLB, and then say
   * markAsProcessed("./images/referredToByGlb.png");
   * to omit it in the output...
   *
   * A method that can be called by implementations, to mark a certain
   * file as already having been processed, and no longer be considered
   * in subsequent steps.
   *
   * @param key - The key (file name)
   */
  markAsProcessed(key: string) {
    this.processedKeys[key] = true;
  }

  /**
   * Process an entry, doing nothing, for the case
   * that no `processEntryCallback` is defined.
   */
  private async processEntryNoOp(
    sourceEntry: TilesetEntry,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type: string | undefined
  ): Promise<TilesetEntry | undefined> {
    this.log(`Performing no-op on ${sourceEntry.key}`);

    const sourceKey = sourceEntry.key;
    const sourceValue = sourceEntry.value;

    const targetKey = sourceKey;
    const targetValue = sourceValue;

    const targetEntry = {
      key: targetKey,
      value: targetValue,
    };
    return targetEntry;
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
}

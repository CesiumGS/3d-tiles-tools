import GltfPipeline from "gltf-pipeline";

import { Paths } from "../base/Paths";
import { Buffers } from "../base/Buffers";

import { ContentDataTypes } from "../contentTypes/ContentDataTypes";

import { TilesetEntry } from "../tilesetData/TilesetEntry";

import { ContentStage } from "./ContentStage";
import { PipelineError } from "./PipelineError";

import { BasicTilesetProcessor } from "../tilesetProcessing/BasicTilesetProcessor";

import { GltfUtilities } from "../contentProcessing/GtlfUtilities";
import { ContentOps } from "../contentProcessing/ContentOps";

import { Tile } from "../structure/Tile";

import { TraversedTile } from "../traversal/TraversedTile";
import { Tiles } from "../tilesets/Tiles";

/**
 * Methods to execute `ContentStage` objects.
 */
export class ContentStageExecutor {
  /**
   * Execute the given `ContentStage`.
   *
   * @param contentStage - The `ContentStage` object
   * @param tilesetProcessor The `BasicTilesetProcessor`
   * @returns A promise that resolves when the process is finished
   * @throws PipelineError If one of the processing steps causes
   * an error.
   */
  static async executeContentStage(
    contentStage: ContentStage,
    tilesetProcessor: BasicTilesetProcessor
  ) {
    try {
      await ContentStageExecutor.executeContentStageInternal(
        contentStage,
        tilesetProcessor
      );
    } catch (e) {
      throw new PipelineError(`${e}`);
    }
  }

  /**
   * Execute the given `ContentStage`.
   *
   * @param contentStage - The `ContentStage` object
   * @param tilesetProcessor The `BasicTilesetProcessor`
   * @returns A promise that resolves when the process is finished
   * @throws Error If one of the processing steps causes
   * an error.
   */
  private static async executeContentStageInternal(
    contentStage: ContentStage,
    tilesetProcessor: BasicTilesetProcessor
  ) {
    if (contentStage.name === "gzip") {
      await ContentStageExecutor.executeGzip(
        tilesetProcessor,
        contentStage.condition
      );
    } else if (contentStage.name === "ungzip") {
      await ContentStageExecutor.executeGunzip(tilesetProcessor);
    } else if (contentStage.name === "b3dmToGlb") {
      await ContentStageExecutor.executeB3dmToGlb(tilesetProcessor);
    } else if (contentStage.name === "optimizeGlb") {
      const options = contentStage.options;
      await ContentStageExecutor.executeOptimizeGlb(tilesetProcessor, options);
    } else if (contentStage.name === "separateGltf") {
      await ContentStageExecutor.executeSeparateGltf(tilesetProcessor);
    } else {
      const message = `    Unknown contentStage name: ${contentStage.name}`;
      console.log(message);
    }
  }

  /**
   * Performs the 'gzip' content stage with the given processor.
   *
   * This will process all entries of the source tileset. The
   * data of entries that match the given condition will be
   * compressed with gzip. Other entries remain unaffected.
   *
   * @param tilesetProcessor - The `BasicTilesetProcessor`
   * @param condition The condition from the `ContentStage`
   * @returns A promise that resolves when the process is finished
   * @throws Error If one of the processing steps causes
   * an error.
   */
  private static async executeGzip(
    tilesetProcessor: BasicTilesetProcessor,
    condition: ((e: TilesetEntry) => Promise<boolean>) | undefined
  ): Promise<void> {
    await tilesetProcessor.forEachEntry(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      async (sourceEntry: TilesetEntry, type: string | undefined) => {
        let targetValue = sourceEntry.value;
        if (condition) {
          const shouldZip = await condition(sourceEntry);
          if (shouldZip) {
            targetValue = Buffers.gzip(sourceEntry.value);
          }
        }
        const targetEntry = {
          key: sourceEntry.key,
          value: targetValue,
        };
        return targetEntry;
      }
    );
  }

  /**
   * Performs the 'gunzip' content stage with the given processor.
   *
   * This will process all entries of the source tileset. The
   * data of entries that is compressed with gzip will be
   * uncompressed. Other entries remain unaffected.
   *
   * @param tilesetProcessor - The `BasicTilesetProcessor`
   * @returns A promise that resolves when the process is finished
   * @throws Error If one of the processing steps causes
   * an error.
   */
  private static async executeGunzip(
    tilesetProcessor: BasicTilesetProcessor
  ): Promise<void> {
    await tilesetProcessor.forEachEntry(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      async (sourceEntry: TilesetEntry, type: string | undefined) => {
        const targetEntry = {
          key: sourceEntry.key,
          value: Buffers.gunzip(sourceEntry.value),
        };
        return targetEntry;
      }
    );
  }

  /**
   * Performs the 'b3dmToGlb' content stage with the given processor.
   *
   * This will process all tile contents entries of the source tileset
   * that have the `CONTENT_TYPE_B3DM`. These entries will be replaced
   * by entries that contain the GLB data from the B3DM.
   *
   * If the entries have names that end in `.b3dm`, then these
   * extensions will be changed to `.glb`.
   *
   * @param tilesetProcessor - The `BasicTilesetProcessor`
   * @returns A promise that resolves when the process is finished
   * @throws Error If one of the processing steps causes
   * an error.
   */
  private static async executeB3dmToGlb(
    tilesetProcessor: BasicTilesetProcessor
  ): Promise<void> {
    // Define the rule for updating the key (file name) of
    // the entries, as well as possible template URIs of
    // implicit tileset roots.
    const updateUri = (uri: string) => {
      if (Paths.hasExtension(uri, ".b3dm")) {
        return Paths.replaceExtension(uri, ".glb");
      }
      return uri;
    };

    // Define the `TilesetEntryProcessor` that generates an
    // entry with GLB data from an entry with B3DM data.
    const entryProcessor = async (
      sourceEntry: TilesetEntry,
      type: string | undefined
    ) => {
      if (type !== ContentDataTypes.CONTENT_TYPE_B3DM) {
        return sourceEntry;
      }
      const targetEntry = {
        key: updateUri(sourceEntry.key),
        value: ContentOps.b3dmToGlbBuffer(sourceEntry.value),
      };
      return targetEntry;
    };

    // Traverse the (explicit) tiles of the input tileset
    await tilesetProcessor.forEachExplicitTile(
      async (tile: Tile): Promise<void> => {
        // When the tile is not an implicit tiling root,
        // then just update the entries that correspond
        // to the tile contents.
        if (!tile.implicitTiling) {
          tilesetProcessor.processTileContentEntries(tile, entryProcessor);
        } else {
          // For implicit tiling roots, traverse the implicit tile hierarchy
          // that starts at this tile, and process each entry that corresponds
          // to the content of one of the implicit tiles.
          await tilesetProcessor.forEachTileAt(
            tile,
            async (traversedTile: TraversedTile) => {
              await tilesetProcessor.processTraversedTileContentEntries(
                traversedTile,
                entryProcessor
              );
            }
          );

          // After the traversal, update the content URIs of the
          // implicit tiling root (which are template URIs)
          const contents = Tiles.getContents(tile);
          for (const content of contents) {
            content.uri = updateUri(content.uri);
          }
        }
      }
    );
  }

  /**
   * Performs the 'optimizeGlb' content stage with the given processor.
   *
   * This will process all tile contents entries of the source tileset
   * that have the `CONTENT_TYPE_GLB`, and apply the `gltf-pipeline`
   * optimization with the given options to them.
   *
   * @param tilesetProcessor - The `BasicTilesetProcessor`
   * @param options - The options for `gltf-pipeline`
   * @returns A promise that resolves when the process is finished
   * @throws Error If one of the processing steps causes
   * an error.
   */
  private static async executeOptimizeGlb(
    tilesetProcessor: BasicTilesetProcessor,
    options: any
  ): Promise<void> {
    const entryProcessor = async (
      sourceEntry: TilesetEntry,
      type: string | undefined
    ) => {
      if (type !== ContentDataTypes.CONTENT_TYPE_GLB) {
        return sourceEntry;
      }
      const targetValue = await GltfUtilities.optimizeGlb(
        sourceEntry.value,
        options
      );
      const targetEntry = {
        key: sourceEntry.key,
        value: targetValue,
      };
      return targetEntry;
    };
    await tilesetProcessor.forEachTile(async (traversedTile: TraversedTile) => {
      await tilesetProcessor.processTraversedTileContentEntries(
        traversedTile,
        entryProcessor
      );
    });
  }

  /**
   * Internal experiments.
   *
   * @param tilesetProcessor - The `BasicTilesetProcessor`
   * @returns A promise that resolves when the process is finished
   * @throws PipelineError If one of the processing steps causes
   * an error.
   */
  private static async executeSeparateGltf(
    tilesetProcessor: BasicTilesetProcessor
  ): Promise<void> {
    const updateUri = (uri: string) => {
      if (Paths.hasExtension(uri, ".glb")) {
        return Paths.replaceExtension(uri, ".gltf");
      }
      return uri;
    };

    const entryProcessor = async (
      sourceEntry: TilesetEntry,
      type: string | undefined
    ) => {
      if (type !== ContentDataTypes.CONTENT_TYPE_GLB) {
        return sourceEntry;
      }
      const options = {
        separate: true,
        name: Paths.replaceExtension(sourceEntry.key, ""),
      };
      const gltfPipelineResults = await GltfPipeline.glbToGltf(
        sourceEntry.value,
        options
      );
      const targetValue = Buffer.from(JSON.stringify(gltfPipelineResults.gltf));
      const targetEntry = {
        key: updateUri(sourceEntry.key),
        value: targetValue,
      };

      const separateResources = gltfPipelineResults.separateResources;
      const resourceKeys = Object.keys(separateResources);
      for (const resourceKey of resourceKeys) {
        const resourceValue = separateResources[resourceKey];
        const resourceTargetEntry = {
          key: resourceKey,
          value: resourceValue,
        };
        tilesetProcessor.storeTargetEntries(resourceTargetEntry);
        tilesetProcessor.markAsProcessed(resourceKey);
      }
      return targetEntry;
    };

    await tilesetProcessor.forEachExplicitTile(
      async (tile: Tile): Promise<void> => {
        if (!tile.implicitTiling) {
          await tilesetProcessor.processTileContentEntries(
            tile,
            entryProcessor
          );
        } else {
          await tilesetProcessor.forEachTileAt(
            tile,
            async (traversedTile: TraversedTile) => {
              await tilesetProcessor.processTraversedTileContentEntries(
                traversedTile,
                entryProcessor
              );
            }
          );
          const contents = Tiles.getContents(tile);
          for (const content of contents) {
            content.uri = updateUri(content.uri);
          }
        }
      }
    );
  }
}

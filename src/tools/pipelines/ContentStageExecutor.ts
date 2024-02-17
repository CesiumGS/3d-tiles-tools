import path from "path";
import GltfPipeline from "gltf-pipeline";

import { Paths } from "../../base";
import { ContentDataTypes } from "../../base";

import { TilesetEntry } from "../../tilesets";

import { ContentStage } from "./ContentStage";
import { ContentStages } from "./ContentStages";
import { PipelineError } from "./PipelineError";

import { BasicTilesetProcessor } from "../tilesetProcessing/BasicTilesetProcessor";

import { GltfUtilities } from "../contentProcessing/GltfUtilities";
import { ContentOps } from "../contentProcessing/ContentOps";
import { TileFormatsMigration } from "../migration/TileFormatsMigration";

import { Loggers } from "../../base";
const logger = Loggers.get("pipeline");

/**
 * Methods to execute `ContentStage` objects.
 *
 * @internal
 */
export class ContentStageExecutor {
  /**
   * Execute the given `ContentStage`.
   *
   * @param contentStage - The `ContentStage` object
   * @param tilesetProcessor - The `BasicTilesetProcessor`
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
   * @param tilesetProcessor - The `BasicTilesetProcessor`
   * @returns A promise that resolves when the process is finished
   * @throws Error If one of the processing steps causes
   * an error.
   */
  private static async executeContentStageInternal(
    contentStage: ContentStage,
    tilesetProcessor: BasicTilesetProcessor
  ) {
    if (contentStage.name === ContentStages.CONTENT_STAGE_GLB_TO_B3DM) {
      await ContentStageExecutor.executeGlbToB3dm(tilesetProcessor);
    } else if (contentStage.name === ContentStages.CONTENT_STAGE_GLB_TO_I3DM) {
      await ContentStageExecutor.executeGlbToI3dm(tilesetProcessor);
    } else if (contentStage.name === ContentStages.CONTENT_STAGE_B3DM_TO_GLB) {
      await ContentStageExecutor.executeB3dmToGlb(tilesetProcessor);
    } else if (
      contentStage.name === ContentStages.CONTENT_STAGE_CONVERT_B3DM_TO_GLB
    ) {
      await ContentStageExecutor.executeConvertB3dmToGlb(tilesetProcessor);
    } else if (
      contentStage.name === ContentStages.CONTENT_STAGE_CONVERT_PNTS_TO_GLB
    ) {
      await ContentStageExecutor.executeConvertPntsToGlb(tilesetProcessor);
    } else if (contentStage.name === ContentStages.CONTENT_STAGE_I3DM_TO_GLB) {
      await ContentStageExecutor.executeI3dmToGlb(tilesetProcessor);
    } else if (
      contentStage.name === ContentStages.CONTENT_STAGE_OPTIMIZE_B3DM
    ) {
      const options = contentStage.options;
      await ContentStageExecutor.executeOptimizeB3dm(tilesetProcessor, options);
    } else if (
      contentStage.name === ContentStages.CONTENT_STAGE_OPTIMIZE_I3DM
    ) {
      const options = contentStage.options;
      await ContentStageExecutor.executeOptimizeI3dm(tilesetProcessor, options);
    } else if (contentStage.name === ContentStages.CONTENT_STAGE_OPTIMIZE_GLB) {
      const options = contentStage.options;
      await ContentStageExecutor.executeOptimizeGlb(tilesetProcessor, options);
    } else if (
      contentStage.name === ContentStages.CONTENT_STAGE_SEPARATE_GLTF
    ) {
      await ContentStageExecutor.executeSeparateGltf(tilesetProcessor);
    } else {
      const message = `    Unknown contentStage name: ${contentStage.name}`;
      logger.debug(message);
    }
  }

  /**
   * Performs the 'glbToB3dm' content stage with the given processor.
   *
   * This will process all tile contents entries of the source tileset
   * that have the `CONTENT_TYPE_GLB`. These entries will be replaced
   * by entries that contain the B3DM data that was created from the GLB.
   *
   * If the entries have names that end in `.glb`, then these
   * extensions will be changed to `.b3dm`.
   *
   * @param tilesetProcessor - The `BasicTilesetProcessor`
   * @returns A promise that resolves when the process is finished
   * @throws Error If one of the processing steps causes
   * an error.
   */
  private static async executeGlbToB3dm(
    tilesetProcessor: BasicTilesetProcessor
  ): Promise<void> {
    // Define the rule for updating the key (file name) of
    // the entries, as well as possible template URIs of
    // implicit tileset roots.
    const uriProcessor = (uri: string) => {
      if (Paths.hasExtension(uri, ".glb")) {
        return Paths.replaceExtension(uri, ".b3dm");
      }
      return uri;
    };

    // Define the `TilesetEntryProcessor` that generates an
    // entry with B3DM data from an entry with GLB data.
    const entryProcessor = async (
      sourceEntry: TilesetEntry,
      type: string | undefined
    ) => {
      if (type !== ContentDataTypes.CONTENT_TYPE_GLB) {
        return sourceEntry;
      }
      const targetEntry = {
        key: uriProcessor(sourceEntry.key),
        value: ContentOps.glbToB3dmBuffer(sourceEntry.value),
      };
      return targetEntry;
    };
    await tilesetProcessor.processTileContentEntries(
      uriProcessor,
      entryProcessor
    );
  }

  /**
   * Performs the 'glbToI3dm' content stage with the given processor.
   *
   * This will process all tile contents entries of the source tileset
   * that have the `CONTENT_TYPE_GLB`. These entries will be replaced
   * by entries that contain the I3DM data that was created from the GLB.
   *
   * If the entries have names that end in `.glb`, then these
   * extensions will be changed to `.i3dm`.
   *
   * @param tilesetProcessor - The `BasicTilesetProcessor`
   * @returns A promise that resolves when the process is finished
   * @throws Error If one of the processing steps causes
   * an error.
   */
  private static async executeGlbToI3dm(
    tilesetProcessor: BasicTilesetProcessor
  ): Promise<void> {
    // Define the rule for updating the key (file name) of
    // the entries, as well as possible template URIs of
    // implicit tileset roots.
    const uriProcessor = (uri: string) => {
      if (Paths.hasExtension(uri, ".glb")) {
        return Paths.replaceExtension(uri, ".i3dm");
      }
      return uri;
    };

    // Define the `TilesetEntryProcessor` that generates an
    // entry with I3DM data from an entry with GLB data.
    const entryProcessor = async (
      sourceEntry: TilesetEntry,
      type: string | undefined
    ) => {
      if (type !== ContentDataTypes.CONTENT_TYPE_GLB) {
        return sourceEntry;
      }
      const targetEntry = {
        key: uriProcessor(sourceEntry.key),
        value: ContentOps.glbToI3dmBuffer(sourceEntry.value),
      };
      return targetEntry;
    };
    await tilesetProcessor.processTileContentEntries(
      uriProcessor,
      entryProcessor
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
    const uriProcessor = (uri: string) => {
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
        key: uriProcessor(sourceEntry.key),
        value: ContentOps.b3dmToGlbBuffer(sourceEntry.value),
      };
      return targetEntry;
    };
    await tilesetProcessor.processTileContentEntries(
      uriProcessor,
      entryProcessor
    );
  }

  /**
   * Performs the 'i3dmToGlb' content stage with the given processor.
   *
   * This will process all tile contents entries of the source tileset
   * that have the `CONTENT_TYPE_I3DM`. These entries will be replaced
   * by entries that contain the GLB data from the I3DM.
   *
   * If the entries have names that end in `.i3dm`, then these
   * extensions will be changed to `.glb`.
   *
   * @param tilesetProcessor - The `BasicTilesetProcessor`
   * @returns A promise that resolves when the process is finished
   * @throws Error If one of the processing steps causes
   * an error.
   */
  private static async executeI3dmToGlb(
    tilesetProcessor: BasicTilesetProcessor
  ): Promise<void> {
    // Define the rule for updating the key (file name) of
    // the entries, as well as possible template URIs of
    // implicit tileset roots.
    const uriProcessor = (uri: string) => {
      if (Paths.hasExtension(uri, ".i3dm")) {
        return Paths.replaceExtension(uri, ".glb");
      }
      return uri;
    };

    // Define the `TilesetEntryProcessor` that generates an
    // entry with GLB data from an entry with I3DM data.
    const entryProcessor = async (
      sourceEntry: TilesetEntry,
      type: string | undefined
    ) => {
      if (type !== ContentDataTypes.CONTENT_TYPE_I3DM) {
        return sourceEntry;
      }
      const targetEntry = {
        key: uriProcessor(sourceEntry.key),
        value: ContentOps.i3dmToGlbBuffer(sourceEntry.value),
      };
      return targetEntry;
    };
    await tilesetProcessor.processTileContentEntries(
      uriProcessor,
      entryProcessor
    );
  }

  /**
   * Performs the 'convertB3dmToGlb' content stage with the given processor.
   *
   * This will process all tile contents entries of the source tileset
   * that have the `CONTENT_TYPE_B3DM`. These entries will be replaced
   * by entries that contain GLB data that was created from the B3DM.
   *
   * If the entries have names that end in `.b3dm`, then these
   * extensions will be changed to `.glb`.
   *
   * @param tilesetProcessor - The `BasicTilesetProcessor`
   * @returns A promise that resolves when the process is finished
   * @throws Error If one of the processing steps causes
   * an error.
   */
  private static async executeConvertB3dmToGlb(
    tilesetProcessor: BasicTilesetProcessor
  ): Promise<void> {
    // Define the rule for updating the key (file name) of
    // the entries, as well as possible template URIs of
    // implicit tileset roots.
    const uriProcessor = (uri: string) => {
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
      const targetValue = await TileFormatsMigration.convertB3dmToGlb(
        sourceEntry.value
      );
      const targetEntry = {
        key: uriProcessor(sourceEntry.key),
        value: targetValue,
      };
      return targetEntry;
    };
    await tilesetProcessor.processTileContentEntries(
      uriProcessor,
      entryProcessor
    );
  }

  /**
   * Performs the 'convertPntsToGlb' content stage with the given processor.
   *
   * This will process all tile contents entries of the source tileset
   * that have the `CONTENT_TYPE_ONTS`. These entries will be replaced
   * by entries that contain GLB data that was created from the PNTS.
   *
   * If the entries have names that end in `.pnts`, then these
   * extensions will be changed to `.glb`.
   *
   * @param tilesetProcessor - The `BasicTilesetProcessor`
   * @returns A promise that resolves when the process is finished
   * @throws Error If one of the processing steps causes
   * an error.
   */
  private static async executeConvertPntsToGlb(
    tilesetProcessor: BasicTilesetProcessor
  ): Promise<void> {
    // Define the rule for updating the key (file name) of
    // the entries, as well as possible template URIs of
    // implicit tileset roots.
    const uriProcessor = (uri: string) => {
      if (Paths.hasExtension(uri, ".pnts")) {
        return Paths.replaceExtension(uri, ".glb");
      }
      return uri;
    };

    // Define the `TilesetEntryProcessor` that generates an
    // entry with GLB data from an entry with PNTS data.
    const entryProcessor = async (
      sourceEntry: TilesetEntry,
      type: string | undefined
    ) => {
      if (type !== ContentDataTypes.CONTENT_TYPE_PNTS) {
        return sourceEntry;
      }
      const targetValue = await TileFormatsMigration.convertPntsToGlb(
        sourceEntry.value
      );
      const targetEntry = {
        key: uriProcessor(sourceEntry.key),
        value: targetValue,
      };
      return targetEntry;
    };
    await tilesetProcessor.processTileContentEntries(
      uriProcessor,
      entryProcessor
    );
  }

  /**
   * Performs the 'optimizeB3dm' content stage with the given processor.
   *
   * This will process all tile contents entries of the source tileset
   * that have the `CONTENT_TYPE_B3DM`, and apply the `gltf-pipeline`
   * optimization with the given options to their GLB data.
   *
   * @param tilesetProcessor - The `BasicTilesetProcessor`
   * @param options - The options for `gltf-pipeline`
   * @returns A promise that resolves when the process is finished
   * @throws Error If one of the processing steps causes
   * an error.
   */
  private static async executeOptimizeB3dm(
    tilesetProcessor: BasicTilesetProcessor,
    options: any
  ): Promise<void> {
    // The entry processor receives the source entry, and
    // returns a target entry where the the `value` contains
    // GLB data that was optimized with `gltf-pipeline`
    // and the given options
    const entryProcessor = async (
      sourceEntry: TilesetEntry,
      type: string | undefined
    ) => {
      if (type !== ContentDataTypes.CONTENT_TYPE_B3DM) {
        return sourceEntry;
      }
      const targetValue = await ContentOps.optimizeB3dmBuffer(
        sourceEntry.value,
        options
      );
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
  }

  /**
   * Performs the 'optimizeI3dm' content stage with the given processor.
   *
   * This will process all tile contents entries of the source tileset
   * that have the `CONTENT_TYPE_I3DM`, and apply the `gltf-pipeline`
   * optimization with the given options to their GLB data.
   *
   * @param tilesetProcessor - The `BasicTilesetProcessor`
   * @param options - The options for `gltf-pipeline`
   * @returns A promise that resolves when the process is finished
   * @throws Error If one of the processing steps causes
   * an error.
   */
  private static async executeOptimizeI3dm(
    tilesetProcessor: BasicTilesetProcessor,
    options: any
  ): Promise<void> {
    // The entry processor receives the source entry, and
    // returns a target entry where the the `value` contains
    // GLB data that was optimized with `gltf-pipeline`
    // and the given options
    const entryProcessor = async (
      sourceEntry: TilesetEntry,
      type: string | undefined
    ) => {
      if (type !== ContentDataTypes.CONTENT_TYPE_I3DM) {
        return sourceEntry;
      }
      const targetValue = await ContentOps.optimizeI3dmBuffer(
        sourceEntry.value,
        options
      );
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
    // The entry processor receives the source entry, and
    // returns a target entry where the the `value` contains
    // GLB data that was optimized with `gltf-pipeline`
    // and the given options
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
    await tilesetProcessor.processTileContentEntries(
      (uri: string) => uri,
      entryProcessor
    );
  }

  /**
   * Performs the 'separateGltf' content stage with the given processor.
   *
   * @param tilesetProcessor - The `BasicTilesetProcessor`
   * @returns A promise that resolves when the process is finished
   * @throws PipelineError If one of the processing steps causes
   * an error.
   */
  private static async executeSeparateGltf(
    tilesetProcessor: BasicTilesetProcessor
  ): Promise<void> {
    // Define the rule for updating the key (file name) of
    // the entries, as well as possible template URIs of
    // implicit tileset roots.
    const uriProcessor = (uri: string) => {
      if (Paths.hasExtension(uri, ".glb")) {
        return Paths.replaceExtension(uri, ".gltf");
      }
      return uri;
    };

    // The entry processor receives the source entry, and
    // returns a target entry where the the `value` contains
    // the glTF data that was generated with `gltf-pipeline`.
    // The additional external resources will be passed to
    // the tileset processor, to be stored in the target.
    const entryProcessor = async (
      sourceEntry: TilesetEntry,
      type: string | undefined
    ) => {
      if (type !== ContentDataTypes.CONTENT_TYPE_GLB) {
        return sourceEntry;
      }
      const dirname = path.dirname(sourceEntry.key);
      const prefix = Paths.replaceExtension(path.basename(sourceEntry.key), "");
      const options = {
        separate: true,
        name: prefix,
      };
      const gltfPipelineResults = await GltfPipeline.glbToGltf(
        sourceEntry.value,
        options
      );
      const targetValue = Buffer.from(JSON.stringify(gltfPipelineResults.gltf));
      const targetEntry = {
        key: uriProcessor(sourceEntry.key),
        value: targetValue,
      };

      const separateResources = gltfPipelineResults.separateResources;
      const resourceKeys = Object.keys(separateResources);
      for (const resourceKey of resourceKeys) {
        const resourceValue = separateResources[resourceKey];
        const resourceTargetEntry = {
          key: Paths.join(dirname, resourceKey),
          value: resourceValue,
        };
        tilesetProcessor.storeTargetEntries(resourceTargetEntry);
        tilesetProcessor.markAsProcessed(resourceKey);
      }
      return targetEntry;
    };
    await tilesetProcessor.processTileContentEntries(
      uriProcessor,
      entryProcessor
    );
  }
}

import path from "path";
import GltfPipeline from "gltf-pipeline";

import { Paths } from "../base/Paths";
import { Buffers } from "../base/Buffers";

import { ContentDataTypes } from "../contentTypes/ContentDataTypes";
import { ContentDataTypeChecks } from "../contentTypes/ContentDataTypeChecks";

import { TilesetEntry } from "../tilesetData/TilesetEntry";

import { ContentStage } from "./ContentStage";
import { ContentStages } from "./ContentStages";
import { PipelineError } from "./PipelineError";

import { BasicTilesetProcessor } from "../tilesetProcessing/BasicTilesetProcessor";

import { GltfUtilities } from "../contentProcessing/GtlfUtilities";
import { ContentOps } from "../contentProcessing/ContentOps";

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
    if (contentStage.name === ContentStages.CONTENT_STAGE_GZIP) {
      const condition = ContentDataTypeChecks.createTypeCheck(
        contentStage.includedContentTypes,
        contentStage.excludedContentTypes
      );
      await ContentStageExecutor.executeGzip(tilesetProcessor, condition);
    } else if (contentStage.name === ContentStages.CONTENT_STAGE_UNGZIP) {
      await ContentStageExecutor.executeGunzip(tilesetProcessor);
    } else if (contentStage.name === ContentStages.CONTENT_STAGE_GLB_TO_B3DM) {
      await ContentStageExecutor.executeGlbToB3dm(tilesetProcessor);
    } else if (contentStage.name === ContentStages.CONTENT_STAGE_GLB_TO_I3DM) {
      await ContentStageExecutor.executeGlbToI3dm(tilesetProcessor);
    } else if (contentStage.name === ContentStages.CONTENT_STAGE_B3DM_TO_GLB) {
      await ContentStageExecutor.executeB3dmToGlb(tilesetProcessor);
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
   * @param condition The condition that was created from
   * the included- and excluded types that have been defined
   * in the `ContentStage`
   * @returns A promise that resolves when the process is finished
   * @throws Error If one of the processing steps causes
   * an error.
   */
  private static async executeGzip(
    tilesetProcessor: BasicTilesetProcessor,
    condition: ((type: string | undefined) => boolean) | undefined
  ): Promise<void> {
    // The entry processor receives the source entry, and
    // returns a target entry where the `value` is zipped
    // if the source entry matches the given condition.
    const entryProcessor = async (
      sourceEntry: TilesetEntry,
      type: string | undefined
    ) => {
      let targetValue = sourceEntry.value;
      if (condition) {
        const shouldZip = condition(type);
        if (shouldZip) {
          targetValue = Buffers.gzip(sourceEntry.value);
        }
      }
      const targetEntry = {
        key: sourceEntry.key,
        value: targetValue,
      };
      return targetEntry;
    };

    await tilesetProcessor.processAllEntries(entryProcessor);
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
    // The entry processor receives the source entry, and
    // returns a target entry where the `value` is unzipped
    // (If the data was not zipped, then `Buffers.gunzip`
    // returns an unmodified result)
    const entryProcessor = async (
      sourceEntry: TilesetEntry,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      type: string | undefined
    ) => {
      const targetEntry = {
        key: sourceEntry.key,
        value: Buffers.gunzip(sourceEntry.value),
      };
      return targetEntry;
    };

    await tilesetProcessor.processAllEntries(entryProcessor);
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

import GltfPipeline from "gltf-pipeline";

import { Paths } from "../base/Paths";
import { Buffers } from "../base/Buffers";

import { ContentDataTypes } from "../contentTypes/ContentDataTypes";

import { TilesetEntry } from "../tilesetData/TilesetEntry";

import { ContentStage } from "./ContentStage";

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
   * @throws TilesetError If one of the processing steps causes
   * an error.
   */
  static async executeContentStage(
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
   * @throws TilesetError If one of the processing steps causes
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
        return [targetEntry];
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
   * @throws TilesetError If one of the processing steps causes
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
        return [targetEntry];
      }
    );
  }

  private static async executeB3dmToGlb(
    tilesetProcessor: BasicTilesetProcessor
  ): Promise<void> {
    await tilesetProcessor.forEachExplicitTileContentEntry(
      async (sourceEntry: TilesetEntry, type: string | undefined) => {
        if (type !== ContentDataTypes.CONTENT_TYPE_B3DM) {
          return [sourceEntry];
        }
        const sourceKey = sourceEntry.key;
        const targetKey = Paths.replaceExtension(sourceKey, ".glb");
        const sourceValue = sourceEntry.value;
        const targetValue = ContentOps.b3dmToGlbBuffer(sourceValue);
        const targetEntry = {
          key: targetKey,
          value: targetValue,
        };
        return [targetEntry];
      }
    );
  }

  private static async executeOptimizeGlb(
    tilesetProcessor: BasicTilesetProcessor,
    options: any
  ): Promise<void> {
    await tilesetProcessor.forEachExplicitTileContentEntry(
      async (sourceEntry: TilesetEntry, type: string | undefined) => {
        if (type !== ContentDataTypes.CONTENT_TYPE_GLB) {
          return [sourceEntry];
        }
        const sourceValue = sourceEntry.value;
        const targetValue = await GltfUtilities.optimizeGlb(
          sourceValue,
          options
        );
        const targetEntry = {
          key: sourceEntry.key,
          value: targetValue,
        };
        return [targetEntry];
      }
    );
  }

  /**
   * Internal experiments.
   *
   * @param tilesetProcessor - The `BasicTilesetProcessor`
   * @returns A promise that resolves when the process is finished
   * @throws TilesetError If one of the processing steps causes
   * an error.
   */
  private static async executeSeparateGltf(
    tilesetProcessor: BasicTilesetProcessor
  ): Promise<void> {
    await tilesetProcessor.forEachExplicitTileContentEntry(
      async (sourceEntry: TilesetEntry, type: string | undefined) => {
        if (type !== ContentDataTypes.CONTENT_TYPE_GLB) {
          return [sourceEntry];
        }
        const options = {
          separate: true,
          name: sourceEntry.key,
        };
        const gltfPipelineResults = await GltfPipeline.glbToGltf(
          sourceEntry.value,
          options
        );
        const targetKey = Paths.replaceExtension(sourceEntry.key, ".gltf");
        const targetValue = Buffer.from(
          JSON.stringify(gltfPipelineResults.gltf)
        );
        const targetEntry = {
          key: targetKey,
          value: targetValue,
        };
        for (const resourceKey of Object.keys(
          gltfPipelineResults.separateResources
        )) {
          const resourceValue =
            gltfPipelineResults.separateResources[resourceKey];
          const resourceTargetEntry = {
            key: resourceKey,
            value: resourceValue,
          };
          tilesetProcessor.storeTargetEntry(resourceTargetEntry);
        }
        return [targetEntry];
      }
    );

    // TODO This has to be done for the implicit case:
    /*
    const templateUriUpdateCallback =
      BasicTilesetProcessor.callbackForEachContent(
        async (content: Content): Promise<void> => {
          if (content.uri.toLowerCase().endsWith(".glb")) {
            content.uri = Paths.replaceExtension(content.uri, ".gltf");
          }
        }
      );

    await tilesetProcessor.forEachExplicitTile(
      async (tile: Tile): Promise<void> => {
        if (tile.implicitTiling) {
          templateUriUpdateCallback(tile);
        }
      }
    );
    */
  }
}

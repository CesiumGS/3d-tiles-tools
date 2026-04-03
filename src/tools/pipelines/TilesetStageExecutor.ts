import { Buffers } from "../../base";
import { ContentDataTypeChecks } from "../../base";
import { ContentDataTypes } from "../../base";

import { TilesetEntry } from "../../tilesets";

import { TilesetStage } from "./TilesetStage";
import { ContentStageExecutor } from "./ContentStageExecutor";
import { PipelineError } from "./PipelineError";
import { TilesetStages } from "./TilesetStages";

import { BasicTilesetProcessor } from "../tilesetProcessing/BasicTilesetProcessor";
import { TilesetUpgrader } from "../tilesetProcessing/TilesetUpgrader";
import { TilesetCombiner } from "../tilesetProcessing/TilesetCombiner";
import { TilesetDataProcessor } from "../tilesetProcessing/TilesetDataProcessor";

import { Loggers } from "../../base";
const logger = Loggers.get("pipeline");

/**
 * Methods to execute `TilesetStage` objects.
 *
 * @internal
 */
export class TilesetStageExecutor {
  /**
   * Executes the given `TilesetStage`.
   *
   * @param tilesetStage - The `TilesetStage` object
   * @param currentInput - The current input name, or a temporary
   * name for intermediate steps (see `Pipeline.input` for details)
   * @param currentOutput - The current output name, or a temporary
   * name for intermediate steps (see `Pipeline.input` for details)
   * @param overwrite - Whether outputs should be overwritten if
   * they already exist
   * @returns A promise that resolves when the process is finished
   * @throws PipelineError If one of the processing steps causes
   * an error.
   */
  static async executeTilesetStage(
    tilesetStage: TilesetStage,
    currentInput: string,
    currentOutput: string,
    overwrite: boolean
  ) {
    logger.debug(`  Executing tilesetStage : ${tilesetStage.name}`);
    logger.debug(`    currentInput:  ${currentInput}`);
    logger.debug(`    currentOutput: ${currentOutput}`);

    try {
      await TilesetStageExecutor.executeTilesetStageInternal(
        tilesetStage,
        currentInput,
        currentOutput,
        overwrite
      );
    } catch (e) {
      throw new PipelineError(`${e}`);
    }
  }

  /**
   * Implementation for `executeTilesetStage`.
   *
   * For details about the arguments, see `executeTilesetStage`.
   *
   * @param tilesetStage - The `TilesetStage` object
   * @param currentInput - The current input name
   * @param currentOutput - The current output name
   * @param overwrite - Whether outputs should be overwritten
   * @returns A promise that resolves when the process is finished
   * @throws Error If one of the processing steps causes
   * an error.
   */
  private static async executeTilesetStageInternal(
    tilesetStage: TilesetStage,
    currentInput: string,
    currentOutput: string,
    overwrite: boolean
  ) {
    if (tilesetStage.name === TilesetStages.TILESET_STAGE_GZIP) {
      const condition = ContentDataTypeChecks.createTypeCheck(
        tilesetStage.includedContentTypes,
        tilesetStage.excludedContentTypes
      );
      await TilesetStageExecutor.executeGzip(
        currentInput,
        currentOutput,
        overwrite,
        condition
      );
    } else if (tilesetStage.name === TilesetStages.TILESET_STAGE_UNGZIP) {
      await TilesetStageExecutor.executeGunzip(
        currentInput,
        currentOutput,
        overwrite
      );
    } else if (tilesetStage.name === TilesetStages.TILESET_STAGE_UPGRADE) {
      const gltfUpgradeOptions = undefined;
      const targetVersion = "1.1";
      const tilesetUpgrader = new TilesetUpgrader(
        targetVersion,
        gltfUpgradeOptions
      );
      await tilesetUpgrader.upgrade(currentInput, currentOutput, overwrite);
    } else if (tilesetStage.name === TilesetStages.TILESET_STAGE_COMBINE) {
      const externalTilesetDetector = ContentDataTypeChecks.createIncludedCheck(
        ContentDataTypes.CONTENT_TYPE_TILESET
      );
      const tilesetCombiner = new TilesetCombiner(externalTilesetDetector);
      await tilesetCombiner.combine(currentInput, currentOutput, overwrite);
    } else {
      await TilesetStageExecutor.executeTilesetContentStages(
        tilesetStage,
        currentInput,
        currentOutput,
        overwrite
      );
    }
  }

  /**
   * Performs the 'gzip' tileset stage with the given parameters.
   *
   * This will process all entries of the source tileset. The
   * data of entries that match the given condition will be
   * compressed with gzip. Other entries remain unaffected.
   *
   * @param currentInput - The current input name
   * @param currentOutput - The current output name
   * @param overwrite - Whether outputs should be overwritten
   * @param condition - The condition that was created from
   * the included- and excluded types that have been defined
   * in the `ContentStage`.
   * @returns A promise that resolves when the process is finished
   * @throws Error If one of the processing steps causes
   * an error.
   */
  private static async executeGzip(
    currentInput: string,
    currentOutput: string,
    overwrite: boolean,
    condition: (type: string | undefined) => boolean
  ): Promise<void> {
    const tilesetProcessor = new TilesetDataProcessor();
    await tilesetProcessor.begin(currentInput, currentOutput, overwrite);

    // The entry processor receives the source entry, and
    // returns a target entry where the `value` is zipped
    // if the source entry matches the given condition.
    const entryProcessor = async (
      sourceEntry: TilesetEntry,
      type: string | undefined
    ) => {
      let targetValue = sourceEntry.value;
      const shouldZip = condition(type);
      if (shouldZip) {
        targetValue = Buffers.gzip(sourceEntry.value);
      }
      const targetEntry = {
        key: sourceEntry.key,
        value: targetValue,
      };
      return targetEntry;
    };

    await tilesetProcessor.processAllEntries(entryProcessor);
    await tilesetProcessor.end();
  }

  /**
   * Performs the 'gunzip' tileset stage with the given parameters.
   *
   * This will process all entries of the source tileset. The
   * data of entries that is compressed with gzip will be
   * uncompressed. Other entries remain unaffected.
   *
   * @param currentInput - The current input name
   * @param currentOutput - The current output name
   * @param overwrite - Whether outputs should be overwritten
   * @returns A promise that resolves when the process is finished
   * @throws Error If one of the processing steps causes
   * an error.
   */
  private static async executeGunzip(
    currentInput: string,
    currentOutput: string,
    overwrite: boolean
  ): Promise<void> {
    const tilesetProcessor = new TilesetDataProcessor();
    await tilesetProcessor.begin(currentInput, currentOutput, overwrite);

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
    await tilesetProcessor.end();
  }

  /**
   * Execute all `ContentStage` objects in the given `TilesetStage`.
   *
   * For details about the arguments, see `executeTilesetStage`.
   *
   * @param tilesetStage - The `TilesetStage` object
   * @param currentInput - The current input name
   * @param currentOutput - The current output name
   * @param overwrite - Whether outputs should be overwritten
   * @returns A promise that resolves when the process is finished
   * @throws Error If one of the processing steps causes
   * an error.
   */
  private static async executeTilesetContentStages(
    tilesetStage: TilesetStage,
    currentInput: string,
    currentOutput: string,
    overwrite: boolean
  ) {
    try {
      const tilesetProcessor = new BasicTilesetProcessor();
      await tilesetProcessor.begin(currentInput, currentOutput, overwrite);

      const contentStages = tilesetStage.contentStages;
      if (contentStages) {
        for (let c = 0; c < contentStages.length; c++) {
          const contentStage = contentStages[c];

          const message =
            `    Executing contentStage ${c} of ` +
            `${contentStages.length}: ${contentStage.name}`;
          logger.debug(message);

          await ContentStageExecutor.executeContentStage(
            contentStage,
            tilesetProcessor
          );
        }

        await tilesetProcessor.end();
      }
    } catch (e) {
      throw new PipelineError(`${e}`);
    }
  }
}

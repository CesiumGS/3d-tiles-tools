import { TilesetStage } from "./TilesetStage";
import { ContentStageExecutor } from "./ContentStageExecutor";
import { PipelineError } from "./PipelineError";
import { TilesetStages } from "./TilesetStages";

import { BasicTilesetProcessor } from "../tilesetProcessing/BasicTilesetProcessor";
import { TilesetUpgrader } from "../tilesetProcessing/TilesetUpgrader";
import { TilesetCombiner } from "../tilesetProcessing/TilesetCombiner";

import { ContentDataTypeChecks } from "../contentTypes/ContentDataTypeChecks";
import { ContentDataTypes } from "../contentTypes/ContentDataTypes";

/**
 * Methods to execute `TilesetStage` objects.
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
    console.log(`  Executing tilesetStage : ${tilesetStage.name}`);
    console.log(`    currentInput:  ${currentInput}`);
    console.log(`    currentOutput: ${currentOutput}`);

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
    if (tilesetStage.name === TilesetStages.TILESET_STAGE_UPGRADE) {
      const quiet = false;
      const tilesetUpgrader = new TilesetUpgrader(quiet);
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
          console.log(message);

          await ContentStageExecutor.executeContentStage(
            contentStage,
            tilesetProcessor
          );
        }
      }
      await tilesetProcessor.end();
    } catch (e) {
      throw new PipelineError(`${e}`);
    }
  }
}

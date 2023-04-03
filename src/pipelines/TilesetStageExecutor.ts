import { TilesetStage } from "./TilesetStage";
import { ContentStageExecutor } from "./ContentStageExecutor";

import { BasicTilesetProcessor } from "../tilesetProcessing/BasicTilesetProcessor";

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

    const tilesetProcessor = new BasicTilesetProcessor();
    await tilesetProcessor.begin(currentInput, currentOutput, overwrite);
    await TilesetStageExecutor.executeTilesetStageInternal(
      tilesetStage,
      tilesetProcessor
    );
    await tilesetProcessor.end();
  }

  /**
   * Implementation for `executeTilesetStage`.
   *
   * @param tilesetStage - The `TilesetStage` object
   * @param tilesetProcessor The `BasicTilesetProcessor`
   * @returns A promise that resolves when the process is finished
   * @throws PipelineError If one of the processing steps causes
   * an error.
   */
  private static async executeTilesetStageInternal(
    tilesetStage: TilesetStage,
    tilesetProcessor: BasicTilesetProcessor
  ) {
    const contentStages = tilesetStage.contentStages;
    if (contentStages.length === 0) {
      return;
    }

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
}

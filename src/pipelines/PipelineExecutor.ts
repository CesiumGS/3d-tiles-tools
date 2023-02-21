import { Pipeline } from "./Pipeline";
import { TilesetStageExecutor } from "./TilesetStageExecutor";

export class PipelineExecutor {
  static async executePipeline(pipeline: Pipeline, overwrite: boolean) {
    console.log("Executing pipeline");

    let currentInput = pipeline.input;
    let currentOutput = undefined;
    let currentOverwrite = true;

    const tilesetStages = pipeline.tilesetStages;
    for (let t = 0; t < tilesetStages.length; t++) {
      const tilesetStage = tilesetStages[t];

      const message =
        `  Executing tilesetStage ${t} of ` +
        `${tilesetStages.length}: ${tilesetStage.name}`;
      console.log(message);

      if (t == tilesetStages.length - 1) {
        currentOutput = pipeline.output;
        currentOverwrite = overwrite;
      } else {
        // TODO Use proper OS-specific temp directory here.
        // (And maybe even clean up afterwards...)
        currentOutput = "./data/TEMP/tilesetStage-" + t;
        currentOverwrite = true;
      }

      await TilesetStageExecutor.executeTilesetStage(
        tilesetStage,
        currentInput,
        currentOutput,
        currentOverwrite
      );
      currentInput = currentOutput;
    }
  }
}

import { Pipeline } from "./Pipeline";
import { TilesetStageExecutor } from "./TilesetStageExecutor";

export class PipelineExecutor {
  static async executePipeline(pipeline: Pipeline) {
    console.log("Executing pipeline");

    //console.log(pipeline.stages[0].name);
    //console.log(pipeline.stages[1].name);
    //console.log(pipeline.stages[1].tilesOnly);

    let currentInput = pipeline.input;
    let currentOutput = undefined;

    const tilesetStages = pipeline.tilesetStages;
    for (let t = 0; t < tilesetStages.length; t++) {
      const tilesetStage = tilesetStages[t];
      console.log(
        "  Executing tilesetStage " +
          t +
          " of " +
          tilesetStages.length +
          ": " +
          tilesetStage.name
      );

      if (t == tilesetStages.length - 1) {
        currentOutput = pipeline.output;
      } else {
        currentOutput = "./data/TEMP/tilesetStage-" + t;
      }

      await TilesetStageExecutor.executeTilesetStage(
        tilesetStage,
        currentInput,
        currentOutput
      );
      currentInput = currentOutput;
    }
  }
}

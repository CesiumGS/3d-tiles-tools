import { defined } from "../base/defined";
import { DeveloperError } from "../base/DeveloperError";

import { Pipeline } from "./Pipeline";
import { TilesetStage } from "./TilesetStage";
import { TilesetStages } from "./TilesetStages";

export class Pipelines {
  static createPipeline(pipelineJson: any): Pipeline {
    const tilesetStages: TilesetStage[] = [];
    if (!defined(pipelineJson.tilesetStages)) {
      throw new DeveloperError(
        "The pipeline JSON does not define tilesetStages"
      );
    }
    for (const tilesetStageJson of pipelineJson.tilesetStages) {
      const tilesetStage = TilesetStages.createTilesetStage(tilesetStageJson);
      tilesetStages.push(tilesetStage);
    }
    const pipeline: Pipeline = {
      input: pipelineJson.input,
      output: pipelineJson.output,
      tilesetStages: tilesetStages,
    };
    return pipeline;
  }
}

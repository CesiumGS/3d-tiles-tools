import { DeveloperError } from "@3d-tiles-tools/base";

import { Pipeline } from "./Pipeline.js";
import { TilesetStage } from "./TilesetStage.js";
import { TilesetStages } from "./TilesetStages.js";

/**
 * Methods to create `Pipeline` objects from JSON input.
 *
 * @internal
 */
export class Pipelines {
  /**
   * Creates a `Pipeline` object from the given (untyped) JSON.
   *
   * @param pipelineJson - The JSON object
   * @returns The `Pipeline` object
   * @throws DeveloperError When the input was not valid
   */
  static createPipeline(pipelineJson: any): Pipeline {
    if (!pipelineJson.input) {
      throw new DeveloperError("The pipeline JSON does not define an input");
    }
    if (!pipelineJson.output) {
      throw new DeveloperError("The pipeline JSON does not define an output");
    }

    // The tilesetStages may be undefined, resulting
    // in an empty array here
    const tilesetStages: TilesetStage[] = [];
    if (pipelineJson.tilesetStages) {
      for (const tilesetStageJson of pipelineJson.tilesetStages) {
        const tilesetStage = TilesetStages.createTilesetStage(tilesetStageJson);
        tilesetStages.push(tilesetStage);
      }
    }
    const pipeline: Pipeline = {
      input: pipelineJson.input,
      output: pipelineJson.output,
      tilesetStages: tilesetStages,
    };
    return pipeline;
  }
}

import { ContentDataTypes } from "../src/contentTypes/ContentDataTypes";

import { PipelineExecutor } from "../src/pipelines/PipelineExecutor";
import { Pipelines } from "../src/pipelines/Pipelines";

function createPipelineDraftJson() {
  const pipelineJson = {
    input: "./specs/data/TilesetWithUris",
    output: "./output/pipelineDrafts",
    tilesetStages: [
      {
        name: "unzip-and-zip-tiles-only",
        contentStages: [
          "ungzip",
          {
            name: "gzip",
            includedContentTypes: [ContentDataTypes.CONTENT_TYPE_B3DM],
          },
        ],
      },
      "dummy-tileset-stage",
    ],
  };
  return pipelineJson;
}

async function runPipelineDrafts() {
  const pipelineJson = createPipelineDraftJson();
  const pipeline = Pipelines.createPipeline(pipelineJson);
  const overwrite = true;
  await PipelineExecutor.executePipeline(pipeline, overwrite);
}

runPipelineDrafts();

import { PipelineExecutor } from "../src/pipelines/PipelineExecutor";
import { Pipelines } from "../src/pipelines/Pipelines";

// Notes: (See ContentStageExecutor)
// - The differentiation between explicit and implicit content
//   operations (and which content operations require an update
//   of the template URI) still has to be finalized.
// - The (public!) TilesetProcessor.storeTargetEntry method
//   should be reviewed. Maybe returning multiple entries
//   for content operations should NOT automatically update
//   the contents of the input tile, but there should be
//   a convenience method for doing this.

function createPipelineExperimentsJson() {
  const optimizeGlbOptions = {
    dracoOptions: {
      compressionLevel: 10,
    },
  };

  const pipelineJson = {
    input: "./specs/data/TilesetWithUris/tileset.json",
    output: "./output/result.3tz",
    tilesetStages: [
      {
        name: "Tileset stage for b3dmToGlb",
        contentStages: ["b3dmToGlb"],
      },
      {
        name: "Tileset stage for optimizeGlb",
        contentStages: [
          {
            name: "optimizeGlb",
            options: optimizeGlbOptions,
          },
        ],
      },
      {
        name: "Tileset stage for separateGltf",
        contentStages: [
          {
            name: "separateGltf",
          },
        ],
      },
      {
        // This is not necessary, but done for the experiment
        name: "Tileset stage for 3TZ",
      },
    ],
  };
  return pipelineJson;
}

async function runPipelineDrafts() {
  const pipelineJson = createPipelineExperimentsJson();
  const pipeline = Pipelines.createPipeline(pipelineJson);
  const overwrite = true;
  await PipelineExecutor.executePipeline(pipeline, overwrite);
}

runPipelineDrafts();

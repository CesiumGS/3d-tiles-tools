import { PipelineExecutor } from "../src/pipelines/PipelineExecutor";
import { Pipelines } from "../src/pipelines/Pipelines";

function createPipelineExperimentsJson() {
  const optimizeGlbOptions = {
    dracoOptions: {
      compressionLevel: 10,
    },
  };

  const b3dmToGlbJson = {
    name: "B3DM to GLB",
    description: "Convert B3DM to GLB",
    contentStages: [
      {
        name: "b3dmToGlb",
        description: "Convert each B3DM content into GLB",
      },
    ],
  };

  const optimizeGlbJson = {
    name: "Optimize GLB",
    description: "Optimize GLB",
    contentStages: [
      {
        name: "optimizeGlb",
        description:
          "Apply gltf-pipeline to each GLB content, with the given options",
        options: optimizeGlbOptions,
      },
    ],
  };

  const separateGltfJson = {
    name: "Separate glTF",
    description: "Separate glTF",
    contentStages: [
      {
        name: "separateGltf",
        description:
          "Convert each GLB content into a .gltf file with separate resources",
      },
    ],
  };

  const dummyJson = {
    name: "Dummy",
    description:
      "Dummy (to have the final output in a directory before writing it into the package)",
  };

  const pipelineJson = {
    input: "./specs/data/TilesetWithUris/tileset.json",
    output: "./output/result.3tz",
    tilesetStages: [
      b3dmToGlbJson,
      optimizeGlbJson,
      separateGltfJson,
      dummyJson,
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

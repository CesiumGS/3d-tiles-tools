import { Pipeline } from "../src/pipelines/Pipeline";
import { TilesetStages } from "../src/pipelines/TilesetStages";
import { ContentStages } from "../src/pipelines/ContentStages";
import { PipelineExecutor } from "../src/pipelines/PipelineExecutor";

async function example() {
  const input = "./specs/data/TilesetOfTilesets";
  const output = "./output/result.3tz";
  const overwrite = true;
  const optimizeGlbOptions = {
    dracoOptions: {
      compressionLevel: 10,
    },
  };

  const tilesetStages = [
    TilesetStages.createUpgrade(),
    TilesetStages.createCombine(),
    TilesetStages.create("B3DM to GLB", "Convert B3DM to GLB", [
      ContentStages.createB3dmToGlb(),
    ]),
    TilesetStages.create("Optimize GLB", "Optimize GLB", [
      ContentStages.createOptimizeGlb(optimizeGlbOptions),
    ]),
    TilesetStages.create("Separate glTF", "Separate glTF", [
      ContentStages.createSeparateGltf(),
    ]),
    TilesetStages.create("Dummy", "Dummy", []),
  ];

  const pipeline: Pipeline = {
    input: input,
    output: output,
    tilesetStages: tilesetStages,
  };

  const pipelineJsonString = JSON.stringify(pipeline, null, 2);
  console.log("Executing pipeline:\n" + pipelineJsonString);

  await PipelineExecutor.executePipeline(pipeline, overwrite);
}

example();

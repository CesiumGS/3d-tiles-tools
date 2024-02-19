import { Pipeline } from "3d-tiles-tools";
import { TilesetStages } from "3d-tiles-tools";
import { ContentStages } from "3d-tiles-tools";
import { PipelineExecutor } from "3d-tiles-tools";

import { ContentDataTypes } from "3d-tiles-tools";

const SPECS_DATA_BASE_DIRECTORY = "./specs/data";

async function example() {
  const input = SPECS_DATA_BASE_DIRECTORY + "/TilesetOfTilesets";
  const output = "./output/result";
  const overwrite = true;
  const optimizeGlbOptions = {
    dracoOptions: {
      compressionLevel: 10,
    },
  };

  const tilesetStages = [
    TilesetStages.createUpgrade(),
    TilesetStages.createCombine(),
    TilesetStages.create("_b3dmToGlb", "Convert B3DM to GLB", [
      ContentStages.createB3dmToGlb(),
    ]),
    TilesetStages.create("_optimizeGlb", "Optimize GLB", [
      ContentStages.createOptimizeGlb(optimizeGlbOptions),
    ]),
    TilesetStages.create("_separateGltf", "Separate glTF", [
      ContentStages.createSeparateGltf(),
    ]),
    TilesetStages.createGzip([ContentDataTypes.CONTENT_TYPE_GLTF]),
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

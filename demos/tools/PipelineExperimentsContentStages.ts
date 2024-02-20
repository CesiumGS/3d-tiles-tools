import { Pipeline } from "3d-tiles-tools";
import { TilesetStages } from "3d-tiles-tools";
import { ContentStages } from "3d-tiles-tools";
import { PipelineExecutor } from "3d-tiles-tools";
import { TilesetStage } from "3d-tiles-tools";

const SPECS_DATA_BASE_DIRECTORY = "./specs/data";

function createPipeline(tilesetStage: TilesetStage) {
  const nameSuffix = tilesetStage.name.replace(/[^\w\s]/gi, "");
  const input =
    SPECS_DATA_BASE_DIRECTORY + "/tilesetProcessing/contentProcessing";
  const output =
    "./output/tilesetProcessing/contentProcessing/output-" + nameSuffix;
  const pipeline: Pipeline = {
    input: input,
    output: output,
    tilesetStages: [tilesetStage],
  };
  return pipeline;
}

async function example() {
  const optimizeGlbOptions = {
    dracoOptions: {
      compressionLevel: 10,
    },
  };

  const tilesetStageB3dmToGlb = TilesetStages.create(
    "_b3dmToGlb",
    "Convert B3DM to GLB",
    [ContentStages.createB3dmToGlb()]
  );

  const tilesetStageI3dmToGlb = TilesetStages.create(
    "_i3dmToGlb",
    "Convert I3DM to GLB",
    [ContentStages.createI3dmToGlb()]
  );

  const tilesetStageGlbToB3dm = TilesetStages.create(
    "_glbToB3dm",
    "Convert GLB to B3DM",
    [ContentStages.createGlbToB3dm()]
  );

  const tilesetStageGlbToI3dm = TilesetStages.create(
    "_glbToI3dm",
    "Convert GLB to I3DM",
    [ContentStages.createGlbToI3dm()]
  );

  const tilesetStageOptimizeB3dm = TilesetStages.create(
    "_optimizeB3dm",
    "Optimize the GLB part of B3DM",
    [ContentStages.createOptimizeB3dm(optimizeGlbOptions)]
  );

  const tilesetStageOptimizeI3dm = TilesetStages.create(
    "_optimizeI3dm",
    "Optimize the GLB part of I3DM",
    [ContentStages.createOptimizeI3dm(optimizeGlbOptions)]
  );

  const overwrite = true;
  await PipelineExecutor.executePipeline(
    createPipeline(tilesetStageB3dmToGlb),
    overwrite
  );
  await PipelineExecutor.executePipeline(
    createPipeline(tilesetStageI3dmToGlb),
    overwrite
  );
  await PipelineExecutor.executePipeline(
    createPipeline(tilesetStageGlbToB3dm),
    overwrite
  );
  await PipelineExecutor.executePipeline(
    createPipeline(tilesetStageGlbToI3dm),
    overwrite
  );
  await PipelineExecutor.executePipeline(
    createPipeline(tilesetStageOptimizeB3dm),
    overwrite
  );
  await PipelineExecutor.executePipeline(
    createPipeline(tilesetStageOptimizeI3dm),
    overwrite
  );
}

example();

import { Pipeline } from "../src/pipelines/Pipeline";
import { TilesetStages } from "../src/pipelines/TilesetStages";
import { ContentStages } from "../src/pipelines/ContentStages";
import { PipelineExecutor } from "../src/pipelines/PipelineExecutor";
import { TilesetStage } from "../src/pipelines/TilesetStage";

function createPipeline(tilesetStage: TilesetStage) {
  const nameSuffix = tilesetStage.name.replace(/[^\w\s]/gi, "");
  const input = "./specs/data/tilesetProcessing/contentProcessing";
  const output =
    "./specs/data/output/tilesetProcessing/contentProcessing/output-" +
    nameSuffix;
  const pipeline: Pipeline = {
    input: input,
    output: output,
    tilesetStages: [tilesetStage],
  };
  return pipeline;
}

async function example() {
  const overwrite = true;
  const optimizeGlbOptions = {
    dracoOptions: {
      compressionLevel: 10,
    },
  };

  const tilesetStageB3dmToGlb = TilesetStages.create(
    "B3DM to GLB",
    "Convert B3DM to GLB",
    [ContentStages.createB3dmToGlb()]
  );

  const tilesetStageI3dmToGlb = TilesetStages.create(
    "I3DM to GLB",
    "Convert I3DM to GLB",
    [ContentStages.createI3dmToGlb()]
  );

  const tilesetStageGlbToB3dm = TilesetStages.create(
    "GLB to B3DM",
    "Convert GLB to B3DM",
    [ContentStages.createGlbToB3dm()]
  );

  const tilesetStageGlbToI3dm = TilesetStages.create(
    "GLB to I3DM",
    "Convert GLB to I3DM",
    [ContentStages.createGlbToI3dm()]
  );

  const tilesetStageOptimizeB3dm = TilesetStages.create(
    "Optimize B3DM",
    "Optimize the GLB part of B3DM",
    [ContentStages.createOptimizeB3dm(optimizeGlbOptions)]
  );

  const tilesetStageOptimizeI3dm = TilesetStages.create(
    "Optimize I3DM",
    "Optimize the GLB part of I3DM",
    [ContentStages.createOptimizeI3dm(optimizeGlbOptions)]
  );

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

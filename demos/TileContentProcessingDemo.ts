import { dedup } from "@gltf-transform/functions";
import { prune } from "@gltf-transform/functions";
import { textureCompress } from "@gltf-transform/functions";
import sharp from "sharp";

import { TileContentProcessing } from "../src/tilesetProcessing/TileContentProcessing";
import { TileContentProcessors } from "../src/tilesetProcessing/TileContentProcessors";
import { TileContentProcessorsGltfTransform } from "../src/tilesetProcessing/TileContentProcessorsGltfTransform";
import { TileContentProcessorsGltfPipeline } from "../src/tilesetProcessing/TileContentProcessorsGltfPipeline";
import { TileContentProcessorsGltfpack } from "../src/tilesetProcessing/TileContentProcessorsGltfpack";
import { GltfPackOptions } from "../src/contentProcessing/GltfPackOptions";

// The intention of this demo is to show the effects of compression that
// may be applied with glTF-Transform,  gltf-pipeline, or gltfpack. To
// show these effects, the input tilesets should be large and complex.
// Therefore, the input here is not part of the repository.
const tilesetSourceName = "./input/TestTileset";

async function runDemo() {
  const tilesetTargetName = "./output/TestTileset";
  const overwrite = true;

  // A glTF-Transform Transform object to limit texture
  // sizes and compress them as JPEG
  const transformTextures = textureCompress({
    encoder: sharp,
    targetFormat: "jpeg",
    quality: 70,
    resize: [512, 512],
  });

  // Create a `TileContentProcessor` that applies some transforms with
  // `glTF-Transform`, including the texture transform defined above
  const tileContentProcessorGltfTransform =
    TileContentProcessorsGltfTransform.create(
      dedup(),
      prune(),
      transformTextures
    );

  // Create a `TileContentProcessor` that applies
  // `gltf-pipeline` with the given options
  const gltfPipelineOptions = {
    dracoOptions: {
      compressionLevel: 10,
    },
  };
  const tileContentProcessorGltfPipeline =
    TileContentProcessorsGltfPipeline.create(gltfPipelineOptions);

  // Combine several `TileContentProcessor` instances into one,
  // that will apply the given instances in order
  const tileContentProcessor = TileContentProcessors.concat(
    tileContentProcessorGltfTransform,
    tileContentProcessorGltfPipeline
  );

  // Process the tileset source, and write it to the tileset target,
  // applying each `TileContentProcessor` to all tile contents
  await TileContentProcessing.process(
    tilesetSourceName,
    tilesetTargetName,
    overwrite,
    tileContentProcessor
  );
}

async function runDemoGltfPack() {
  const tilesetTargetName = "./output/TestTileset-gltfpack";
  const overwrite = true;

  // Create a `TileContentProcessor` that applies `gltfpack`
  // with certain compression options
  const gltfpackOptions: GltfPackOptions = {
    // Produce compressed gltf/glb files
    c: true,
    // Simplify meshes (value should be between 0 and 1)
    si: 0.3,
    // Use N-bit quantization for positions
    vp: 12,
  };
  const tileContentProcessorGltfpack =
    TileContentProcessorsGltfpack.create(gltfpackOptions);

  // Process the tileset source, and write it to the tileset target,
  // applying each `TileContentProcessor` to all tile contents
  await TileContentProcessing.process(
    tilesetSourceName,
    tilesetTargetName,
    overwrite,
    tileContentProcessorGltfpack
  );
}

runDemo();

runDemoGltfPack();

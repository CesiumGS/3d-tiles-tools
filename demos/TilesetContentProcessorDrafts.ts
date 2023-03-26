import { Paths } from "../src/base/Paths";
import { ContentOps } from "../src/contentProcessing/ContentOps";
import { GltfUtilities } from "../src/contentProcessing/GtlfUtilities";
import { Content } from "../src/structure/Content";
import { TilesetEntry } from "../src/tilesetData/TilesetEntry";

import { TilesetContentProcessor } from "../src/tilesetProcessing/TilesetContentProcessor";
import { TilesetExplicitContentProcessor } from "../src/tilesetProcessing/TilesetExplicitContentProcessor";

async function runB3dmToGlbTest() {
  const tilesetSourceName =
    "../3d-tiles-samples/1.0/TilesetWithDiscreteLOD/tileset.json";
  const tilesetTargetName = "./output/TilesetWithDiscreteLOD/tileset.json";
  const overwrite = true;

  const quiet = false;
  const tilesetContentProcessor =
    new (class extends TilesetExplicitContentProcessor {
      override async processExplicitTileContentEntry(
        sourceEntry: TilesetEntry,
        type: string | undefined
      ): Promise<TilesetEntry[]> {
        if (type !== "CONTENT_TYPE_B3DM") {
          return [sourceEntry];
        }
        const targetEntry = {
          key: Paths.replaceExtension(sourceEntry.key, ".glb"),
          value: ContentOps.b3dmToGlbBuffer(sourceEntry.value),
        };
        console.log(
          "    Updated " + sourceEntry.key + " to " + targetEntry.key
        );
        return [targetEntry];
      }
    })(quiet);

  await tilesetContentProcessor.process(
    tilesetSourceName,
    tilesetTargetName,
    overwrite
  );
}

async function runOptimizeTest() {
  const tilesetSourceName =
    "../3d-tiles-samples/1.1/SparseImplicitQuadtree/tileset.json";
  const tilesetTargetName =
    "./output/SparseImplicitQuadtree-optimized/tileset.json";
  const overwrite = true;

  const quiet = false;
  const tilesetContentProcessor = new (class extends TilesetContentProcessor {
    override async processTileContentEntry(
      sourceEntry: TilesetEntry,
      type: string | undefined
    ): Promise<TilesetEntry[]> {
      if (type !== "CONTENT_TYPE_GLB") {
        return [sourceEntry];
      }
      const targetEntry = {
        key: "optimized/" + sourceEntry.key,
        value: await GltfUtilities.optimizeGlb(sourceEntry.value, {}),
      };
      console.log(
        "    Optimized " + sourceEntry.key + " to " + targetEntry.key
      );
      return [targetEntry];
    }

    override async processImplicitTilesetRootContent(
      content: Content
    ): Promise<Content> {
      content.uri = "optimized/" + content.uri;
      return content;
    }
  })(quiet);

  await tilesetContentProcessor.process(
    tilesetSourceName,
    tilesetTargetName,
    overwrite
  );
}

//runB3dmToGlbTest();
runOptimizeTest();

import { Paths } from "../src/base/Paths";
import { ContentOps } from "../src/contentProcessing/ContentOps";
import { TilesetEntry } from "../src/tilesetData/TilesetEntry";
import { TilesetContentProcessor } from "../src/tilesetProcessing/TilesetContentProcessor";

async function runB3dmToGlbTest() {
  const tilesetSourceName =
    "../3d-tiles-samples/1.0/TilesetWithDiscreteLOD/tileset.json";
  const tilesetTargetName = "./output/TilesetWithDiscreteLOD/tileset.json";
  const overwrite = true;

  const quiet = true;
  const tilesetContentProcessor = new TilesetContentProcessor(quiet);

  tilesetContentProcessor.setProcessEntryCallback(
    async (sourceEntry: TilesetEntry, type: string | undefined) => {
      if (type !== "CONTENT_TYPE_B3DM") {
        return sourceEntry;
      }
      const targetEntry = {
        key: Paths.replaceExtension(sourceEntry.key, ".glb"),
        value: ContentOps.b3dmToGlbBuffer(sourceEntry.value),
      };
      console.log("Updated " + sourceEntry.key + " to " + targetEntry.key);
      return targetEntry;
    }
  );

  await tilesetContentProcessor.process(
    tilesetSourceName,
    tilesetTargetName,
    overwrite
  );
}

runB3dmToGlbTest();

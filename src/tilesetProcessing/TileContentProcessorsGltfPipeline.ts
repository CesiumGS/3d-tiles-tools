import GltfPipeline from "gltf-pipeline";

import { ContentDataTypes } from "../contentTypes/ContentDataTypes";
import { TileContentProcessor } from "./TileContentProcessor";

export class TileContentProcessorsGltfPipeline {
  static create(options: any): TileContentProcessor {
    const tileContentProcessor = async (
      type: string | undefined,
      inputContentData: Buffer
    ) => {
      if (type !== ContentDataTypes.CONTENT_TYPE_GLB) {
        return inputContentData;
      }
      const result = await GltfPipeline.processGlb(inputContentData, options);
      return result.glb;
    };
    return tileContentProcessor;
  }
}

import GltfPipeline from "gltf-pipeline";

import { ContentDataTypes } from "../../base";

import { TileContentProcessor } from "./TileContentProcessor";

/**
 * Methods to create `TileContentProcessor` instances that
 * process GLB data with `gltf-pipeline`.
 *
 * @internal
 */
export class TileContentProcessorsGltfPipeline {
  /**
   * Creates a `TileContentProcessor` that processes each GLB
   * tile content with `gltf-pipeline`.
   *
   * It will process each tile content that has the content
   * type `ContentDataTypes.CONTENT_TYPE_GLB`, by calling
   * the `gltf-pipeline` `processGlb` method with the input
   * content data and the given options.
   *
   * @param options - The options for `gltf-pipeline`
   * @returns The `TileContentProcessor`
   */
  static create(options: any): TileContentProcessor {
    const tileContentProcessor = async (
      inputContentData: Buffer,
      type: string | undefined
    ): Promise<Buffer> => {
      if (type !== ContentDataTypes.CONTENT_TYPE_GLB) {
        return inputContentData;
      }
      const result = await GltfPipeline.processGlb(inputContentData, options);
      return result.glb;
    };
    return tileContentProcessor;
  }
}

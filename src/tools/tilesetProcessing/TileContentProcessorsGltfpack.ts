import { ContentDataTypes } from "../../base";

import { TileContentProcessor } from "./TileContentProcessor";

import { GltfPack } from "../contentProcessing/GltfPack";
import { GltfPackOptions } from "../contentProcessing/GltfPackOptions";

/**
 * Methods to create `TileContentProcessor` instances that
 * process GLB data with `gltfpack`.
 *
 * @internal
 */
export class TileContentProcessorsGltfpack {
  /**
   * Creates a `TileContentProcessor` that processes each GLB
   * tile content with `gltfpack`.
   *
   * It will process each tile content that has the content
   * type `ContentDataTypes.CONTENT_TYPE_GLB`, by calling
   * `gltfpack` with the given options.
   *
   * @param options - The options for `gltfpack`
   * @returns The `TileContentProcessor`
   */
  static create(options: GltfPackOptions): TileContentProcessor {
    const tileContentProcessor = async (
      inputContentData: Buffer,
      type: string | undefined
    ) => {
      if (type !== ContentDataTypes.CONTENT_TYPE_GLB) {
        return inputContentData;
      }
      return GltfPack.process(inputContentData, options);
    };
    return tileContentProcessor;
  }
}

import { Transform } from "@gltf-transform/core";

import { ContentDataTypes } from "../contentTypes/ContentDataTypes";

import { TileContentProcessor } from "./TileContentProcessor";
import { GltfTransform } from "../contentProcessing/GltfTransform";

/**
 * Methods to create `TileContentProcessor` instances that
 * process GLB data with `gltf-transform`.
 *
 * @internal
 */
export class TileContentProcessorsGltfTransform {
  /**
   * Creates a `TileContentProcessor` that processes each GLB
   * tile content with `gltf-transform`.
   *
   * It will process each tile content that has the content
   * type `ContentDataTypes.CONTENT_TYPE_GLB`, by calling
   * the `gltf-transform` 'transform' method with the
   * input content data, applying the given transforms.
   *
   * @param transforms - The `gltf-transform` `Transform` instances
   * @returns The `TileContentProcessor`
   */
  static create(...transforms: Transform[]): TileContentProcessor {
    const tileContentProcessor = async (
      inputContentData: Buffer,
      type: string | undefined
    ) => {
      if (type !== ContentDataTypes.CONTENT_TYPE_GLB) {
        return inputContentData;
      }
      return GltfTransform.process(inputContentData, ...transforms);
    };
    return tileContentProcessor;
  }
}

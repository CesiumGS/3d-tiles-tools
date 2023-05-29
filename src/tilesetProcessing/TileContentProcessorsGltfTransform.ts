import draco3d from "draco3d";

import { NodeIO, Transform } from "@gltf-transform/core";
import { KHRONOS_EXTENSIONS } from "@gltf-transform/extensions";

import { ContentDataTypes } from "../contentTypes/ContentDataTypes";

import { TileContentProcessor } from "./TileContentProcessor";

/**
 * Methods to create `TileContentProcessor` instances that
 * process GLB data with `gltf-transform`.
 */
export class TileContentProcessorsGltfTransform {
  /**
   * The `gltf-transform` IO handler, intialized lazily and cached
   * in `getIO`.
   */
  private static io: NodeIO | undefined;

  /**
   * Returns the `gltf-transform` `NodeIO` instance, preconfigured
   * for the use in the 3D Tiles Tools.
   *
   * (E.g. it will be configured to handle the Khronos extensions
   * and have a draco encoder/decoder)
   *
   * @returns - The `NodeIO` instance
   */
  private static async getIO(): Promise<NodeIO> {
    if (TileContentProcessorsGltfTransform.io) {
      return TileContentProcessorsGltfTransform.io;
    }
    const io = new NodeIO();
    io.registerExtensions(KHRONOS_EXTENSIONS).registerDependencies({
      "draco3d.decoder": await draco3d.createDecoderModule(),
      "draco3d.encoder": await draco3d.createEncoderModule(),
    });
    TileContentProcessorsGltfTransform.io = io;
    return io;
  }

  /**
   * Creates a `TileContentProcessor` that processes each GLB
   * tile content with `gltf-transform`.
   *
   * It will process each tile content that has the content
   * type `ContentDataTypes.CONTENT_TYPE_GLB`, by calling
   * the `gtlf-transform` 'transform' method with the
   * input content data, applying the given transforms.
   *
   * @param transforms - The `gltf-transform` `Transform` instances
   * @returns The `TileContentProcessor`
   */
  static create(...transforms: Transform[]): TileContentProcessor {
    const gltfTransformCall =
      TileContentProcessorsGltfTransform.createGltfTransformCall(...transforms);
    return async (
      inputContentData: Buffer,
      type: string | undefined
    ): Promise<Buffer> => {
      if (type !== ContentDataTypes.CONTENT_TYPE_GLB) {
        return inputContentData;
      }
      return gltfTransformCall(inputContentData);
    };
  }

  /**
   * Creates a function that calls `gltf-transform` on a GLB buffer
   * and returns the transformed buffer.
   *
   * It will read the GLB data, apply the `transform` call to the
   * resulting `Document` (using the given `Transform` instances),
   * and return a GLB buffer that was crated from the transformed
   * document.
   *
   * @param transforms - The `gltf-transform` `Transform` instances
   * @returns The function
   */
  private static createGltfTransformCall(
    ...transforms: Transform[]
  ): (inputGlb: Buffer) => Promise<Buffer> {
    return async (inputGlb: Buffer): Promise<Buffer> => {
      const io = await TileContentProcessorsGltfTransform.getIO();
      const document = await io.readBinary(inputGlb);
      await document.transform(...transforms);
      const outputGlb = await io.writeBinary(document);
      return Buffer.from(outputGlb);
    };
  }
}

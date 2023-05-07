import { NodeIO, Transform } from "@gltf-transform/core";
import { KHRONOS_EXTENSIONS } from "@gltf-transform/extensions";
import draco3d from "draco3dgltf";

import { ContentDataTypes } from "../contentTypes/ContentDataTypes";
import { TileContentProcessor } from "./TileContentProcessor";

export class TileContentProcessorsGltfTransform {
  private static io: NodeIO | undefined;

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

  static create(...transforms: Transform[]): TileContentProcessor {
    const gltfTransformCall =
      TileContentProcessorsGltfTransform.createGltfTransformCall(...transforms);
    return async (
      type: string | undefined,
      inputContentData: Buffer
    ): Promise<Buffer> => {
      if (type !== ContentDataTypes.CONTENT_TYPE_GLB) {
        return inputContentData;
      }
      return gltfTransformCall(inputContentData);
    };
  }

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

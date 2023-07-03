import draco3d from "draco3d";

import { Transform } from "@gltf-transform/core";
import { NodeIO } from "@gltf-transform/core";
import { KHRONOS_EXTENSIONS } from "@gltf-transform/extensions";

import { EXTMeshFeatures } from "./gltftransform/EXTMeshFeatures";
import { EXTStructuralMetadata } from "./gltftransform/EXTStructuralMetadata";

/**
 * Utilities for using glTF-Transform in the 3D Tiles tools
 */
export class GltfTransform {
  /**
   * The `gltf-transform` IO handler, intialized lazily and cached
   * in `getIO`.
   */
  private static io: NodeIO | undefined;

  /**
   * Returns the `gltf-transform` `NodeIO` instance, preconfigured
   * for the use in the 3D Tiles Tools.
   *
   * (E.g. it will be configured to handle the Khronos extensions,
   * EXT_mesh_features, and have a draco encoder/decoder)
   *
   * @returns - The `NodeIO` instance
   */
  static async getIO(): Promise<NodeIO> {
    if (GltfTransform.io) {
      return GltfTransform.io;
    }
    const io = new NodeIO();
    io.registerExtensions(KHRONOS_EXTENSIONS).registerDependencies({
      "draco3d.decoder": await draco3d.createDecoderModule(),
      "draco3d.encoder": await draco3d.createEncoderModule(),
    });
    io.registerExtensions([EXTMeshFeatures]);
    io.registerExtensions([EXTStructuralMetadata]);
    GltfTransform.io = io;
    return io;
  }

  /**
   * Calls `gltf-transform` on a GLB buffer and returns the transformed
   * buffer.
   *
   * It will read the GLB data, apply the `transform` call to the
   * resulting `Document` (using the given `Transform` instances),
   * and return a GLB buffer that was crated from the transformed
   * document.
   *
   * @param transforms - The `gltf-transform` `Transform` instances
   * @returns The function
   */
  static async process(
    inputGlb: Buffer,
    ...transforms: Transform[]
  ): Promise<Buffer> {
    const io = await GltfTransform.getIO();
    const document = await io.readBinary(inputGlb);
    await document.transform(...transforms);
    const outputGlb = await io.writeBinary(document);
    return Buffer.from(outputGlb);
  }
}

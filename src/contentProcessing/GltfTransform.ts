import draco3d from "draco3d";

import { Transform } from "@gltf-transform/core";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";

import { EXTStructuralMetadata } from "../gltfExtensions/EXTStructuralMetadata";
import { EXTMeshFeatures } from "../gltfExtensions/EXTMeshFeatures";
import { EXTInstanceFeatures } from "../gltfExtensions/EXTInstanceFeatures";

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
   * (E.g. it will be configured to handle the all extensions that
   * are known in glTF-Transform, as well as EXT_mesh_features and
   * EXT_structural_metadata, and have a draco encoder/decoder)
   *
   * @returns - The `NodeIO` instance
   */
  static async getIO(): Promise<NodeIO> {
    if (GltfTransform.io) {
      return GltfTransform.io;
    }
    const io = new NodeIO();
    io.registerExtensions(ALL_EXTENSIONS).registerDependencies({
      "draco3d.decoder": await draco3d.createDecoderModule(),
      "draco3d.encoder": await draco3d.createEncoderModule(),
    });
    // Note: The order of these calls matters. The EXTMeshFeatures and
    // EXTInstanceFeatures depend on the EXTStructuralMetadata, because
    // they may refer to PropertyTable objects via their FeatureId.
    // So the EXTStructuralMetadata has to be read first.
    io.registerExtensions([EXTStructuralMetadata]);
    io.registerExtensions([EXTMeshFeatures]);
    io.registerExtensions([EXTInstanceFeatures]);
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

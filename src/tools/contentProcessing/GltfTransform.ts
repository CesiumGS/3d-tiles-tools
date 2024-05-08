import draco3d from "draco3d";

import { MeshoptDecoder } from "meshoptimizer";
import { MeshoptEncoder } from "meshoptimizer";

import { Document } from "@gltf-transform/core";
import { Logger } from "@gltf-transform/core";
import { Transform } from "@gltf-transform/core";
import { NodeIO } from "@gltf-transform/core";

import { prune } from "@gltf-transform/functions";
import { unpartition } from "@gltf-transform/functions";

import { ALL_EXTENSIONS } from "@gltf-transform/extensions";

import { EXTStructuralMetadata } from "../../gltf-extensions";
import { EXTMeshFeatures } from "../../gltf-extensions";
import { EXTInstanceFeatures } from "../../gltf-extensions";

import { StructuralMetadataMerger } from "../gltfExtensionsUtils/StructuralMetadataMerger";

/**
 * Utilities for using glTF-Transform in the 3D Tiles tools
 *
 * @internal
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
   * EXT_structural_metadata, and have draco- and meshopt
   * encoders/decoders)
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
      "meshopt.decoder": MeshoptDecoder,
      "meshopt.encoder": MeshoptEncoder,
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

  /**
   * Combine all scenes in the given document into one.
   *
   * This will take the first scene, declare it as the default scene,
   * attach the nodes from all other scenes to this one, and dispose
   * the other scenes.
   *
   * @param document - The glTF-Transform document
   */
  private static async combineScenes(document: Document) {
    const root = document.getRoot();
    const scenes = root.listScenes();
    if (scenes.length > 0) {
      const combinedScene = scenes[0];
      root.setDefaultScene(combinedScene);
      for (let s = 1; s < scenes.length; s++) {
        const otherScene = scenes[s];
        const children = otherScene.listChildren();
        for (const child of children) {
          combinedScene.addChild(child);
          otherScene.removeChild(child);
        }
        otherScene.dispose();
      }
    }
    document.setLogger(new Logger(Logger.Verbosity.WARN));
    await document.transform(prune());
  }

  /**
   * Creates a single glTF Transform document from the given GLB buffers.
   *
   * This will create a document with a single scene that contains all
   * nodes that have been children of any scene in the given input
   * GLBs.
   *
   * @param inputGlbBuffers - The buffers containing GLB data
   * @param schemaUriResolver - A function that can resolve the `schemaUri`
   * and return the metadata schema JSON object
   * @returns The merged document
   */
  static async merge(
    inputGlbBuffers: Buffer[],
    schemaUriResolver: (schemaUri: string) => Promise<any>
  ): Promise<Document> {
    // Create one document from each buffer and merge them
    const io = await GltfTransform.getIO();
    const mergedDocument = new Document();
    for (const inputGlbBuffer of inputGlbBuffers) {
      const inputDocument = await io.readBinary(inputGlbBuffer);
      await StructuralMetadataMerger.mergeDocumentsWithStructuralMetadata(
        mergedDocument,
        inputDocument,
        schemaUriResolver
      );
    }
    // Combine all scenes into one
    await GltfTransform.combineScenes(mergedDocument);
    await mergedDocument.transform(unpartition());
    const root = mergedDocument.getRoot();
    const asset = root.getAsset();
    asset.generator = "glTF-Transform";
    return mergedDocument;
  }
}

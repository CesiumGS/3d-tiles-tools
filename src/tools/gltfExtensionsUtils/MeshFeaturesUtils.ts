import { Document } from "@gltf-transform/core";
import { Mesh } from "@gltf-transform/core";
import { Primitive } from "@gltf-transform/core";

import { MeshFeaturesFeatureId as FeatureId } from "../../gltf-extensions";
import { MeshFeatures } from "../../gltf-extensions";

import { StringBuilder } from "./StringBuilder";

/**
 * Utilities related to the glTF `EXT_mesh_features` extension.
 *
 * @internal
 */
export class MeshFeaturesUtils {
  /**
   * Creates an string representation of the `EXT_mesh_features`
   * that is contained in the given glTF Transform document.
   *
   * The exact format and contents of this string is not specified
   *
   * @param document - The glTF Transform document
   * @returns The string
   */
  static createMeshFeaturesInfoString(document: Document): string {
    const sb = new StringBuilder();
    const meshes = document.getRoot().listMeshes();
    MeshFeaturesUtils.createMeshesFeaturesString(sb, meshes);
    return sb.toString();
  }

  private static createMeshesFeaturesString(sb: StringBuilder, meshes: Mesh[]) {
    sb.addLine("Meshes");
    for (let m = 0; m < meshes.length; m++) {
      sb.increaseIndent();
      sb.addLine("Mesh ", m, " of ", meshes.length);
      const mesh = meshes[m];
      const primitives = mesh.listPrimitives();
      sb.increaseIndent();
      MeshFeaturesUtils.createPrimitivesFeaturesString(sb, primitives);
      sb.decreaseIndent();
      sb.decreaseIndent();
    }
  }

  private static createPrimitivesFeaturesString(
    sb: StringBuilder,
    primitives: Primitive[]
  ) {
    sb.addLine("Primitives:");
    for (let p = 0; p < primitives.length; p++) {
      sb.increaseIndent();
      sb.addLine("Primitive ", p, " of ", primitives.length);
      const primitive = primitives[p];

      sb.increaseIndent();
      const meshFeatures =
        primitive.getExtension<MeshFeatures>("EXT_mesh_features");
      MeshFeaturesUtils.createMeshFeaturesString(sb, meshFeatures);
      sb.decreaseIndent();

      sb.decreaseIndent();
    }
  }

  private static createMeshFeaturesString(
    sb: StringBuilder,
    meshFeatures: MeshFeatures | null
  ) {
    if (!meshFeatures) {
      sb.addLine("EXT_mesh_features: (none)");
      return;
    }
    sb.addLine("EXT_mesh_features:");
    sb.increaseIndent();
    sb.addLine("featureIds:");
    const featureIds = meshFeatures.listFeatureIds();
    for (let f = 0; f < featureIds.length; f++) {
      sb.increaseIndent();
      sb.addLine("Feature ID ", f, " of ", featureIds.length);
      const featureId = featureIds[f];
      sb.increaseIndent();
      MeshFeaturesUtils.createFeatureIdString(sb, featureId);
      sb.decreaseIndent();
      sb.decreaseIndent();
    }
    sb.decreaseIndent();
  }

  private static createFeatureIdString(
    sb: StringBuilder,
    featureId: FeatureId
  ) {
    sb.addLine("featureCount: ", featureId.getFeatureCount());
    sb.addLine("attribute: ", featureId.getAttribute());
    const t = featureId.getTexture();
    sb.addLine("texture: ", t);
    if (t) {
      sb.increaseIndent();
      sb.addLine("channels: ", t.getChannels());
      sb.addLine("texture: ", t.getTexture());
      sb.addLine("textureInfo: ", t.getTextureInfo());
      sb.decreaseIndent();
    }
    sb.addLine("propertyTable: ", featureId.getPropertyTable());
  }
}

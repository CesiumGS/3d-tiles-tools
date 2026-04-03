import { Document } from "@gltf-transform/core";
import { Node } from "@gltf-transform/core";

import { InstancedMesh } from "@gltf-transform/extensions";

import { InstanceFeatures } from "../../gltf-extensions";
import { InstanceFeaturesFeatureId as FeatureId } from "../../gltf-extensions";

import { StringBuilder } from "./StringBuilder";

/**
 * Utilities related to the glTF `EXT_instance_features` extension.
 *
 * @internal
 */
export class InstanceFeaturesUtils {
  /**
   * Creates an string representation of the `EXT_instance_features`
   * that is contained in the given glTF Transform document.
   *
   * The exact format and contents of this string is not specified
   *
   * @param document - The glTF Transform document
   * @returns The string
   */
  static createInstanceFeaturesInfoString(document: Document): string {
    const sb = new StringBuilder();
    const nodes = document.getRoot().listNodes();
    InstanceFeaturesUtils.createInstancesFeaturesString(sb, nodes);
    return sb.toString();
  }

  private static createInstancesFeaturesString(
    sb: StringBuilder,
    nodes: Node[]
  ) {
    sb.addLine("Nodes");
    for (let n = 0; n < nodes.length; n++) {
      sb.increaseIndent();
      sb.addLine("Node ", n, " of ", nodes.length);
      const node = nodes[n];

      sb.increaseIndent();
      const meshGpuInstancing = node.getExtension<InstancedMesh>(
        "EXT_mesh_gpu_instancing"
      );
      const instanceFeatures = node.getExtension<InstanceFeatures>(
        "EXT_instance_features"
      );
      if (!meshGpuInstancing) {
        sb.addLine("(no EXT_mesh_gpu_instancing)");
      }
      if (!instanceFeatures) {
        sb.addLine("(no EXT_instance_features)");
      }
      if (meshGpuInstancing && instanceFeatures) {
        InstanceFeaturesUtils.createInstanceFeaturesString(
          sb,
          meshGpuInstancing,
          instanceFeatures
        );
      }
      sb.decreaseIndent();
      sb.decreaseIndent();
    }
  }

  private static createInstanceFeaturesString(
    sb: StringBuilder,
    meshGpuInstancing: InstancedMesh,
    instanceFeatures: InstanceFeatures
  ) {
    sb.addLine("EXT_instance_features:");
    sb.increaseIndent();
    sb.addLine("featureIds:");
    const featureIds = instanceFeatures.listFeatureIds();
    for (let f = 0; f < featureIds.length; f++) {
      sb.increaseIndent();
      sb.addLine("Feature ID ", f, " of ", featureIds.length);
      const featureId = featureIds[f];
      sb.increaseIndent();
      InstanceFeaturesUtils.createFeatureIdString(
        sb,
        featureId,
        meshGpuInstancing
      );
      sb.decreaseIndent();
      sb.decreaseIndent();
    }
    sb.decreaseIndent();
  }

  private static createFeatureIdString(
    sb: StringBuilder,
    featureId: FeatureId,
    meshGpuInstancing: InstancedMesh
  ) {
    sb.addLine("featureCount: ", featureId.getFeatureCount());
    sb.addLine("attribute: ", featureId.getAttribute());

    const attributeNumber = featureId.getAttribute();
    if (attributeNumber !== undefined) {
      const attribute = `_FEATURE_ID_${attributeNumber}`;
      const featureIdAccessor = meshGpuInstancing.getAttribute(attribute);
      if (featureIdAccessor) {
        sb.addLine(attribute, " values: ", featureIdAccessor.getArray());
      } else {
        sb.addLine(attribute, " values: ", "ERROR: NOT FOUND!");
      }
    }
  }
}

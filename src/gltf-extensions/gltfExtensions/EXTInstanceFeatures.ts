import { GLTF } from "@gltf-transform/core";
import { Node } from "@gltf-transform/core";
import { Extension } from "@gltf-transform/core";

import { ReaderContext } from "@gltf-transform/core";
import { WriterContext } from "@gltf-transform/core";
import { FeatureId } from "./InstanceFeatures";
import { InstanceFeatures } from "./InstanceFeatures";
import { StructuralMetadata } from "./StructuralMetadata";

const NAME = "EXT_instance_features";

//============================================================================
// Interfaces for the JSON structure
// (See `EXTMeshFeatures` for details about the concepts)
//

interface InstanceFeaturesDef {
  featureIds: FeatureIdDef[];
}
interface FeatureIdDef {
  featureCount: number;
  nullFeatureId?: number;
  label?: string;
  attribute?: FeatureIdAttributeDef;
  propertyTable?: number;
}
type FeatureIdAttributeDef = number;

//============================================================================

/**
 * [`EXT_instance_features`](https://github.com/CesiumGS/glTF/blob/3d-tiles-next/extensions/2.0/Vendor/EXT_instance_features/)
 * defines a means of assigning identifiers to instances that are created with the `EXT_mesh_gpu_instancing` extension.
 *
 * Properties:
 * - {@link InstanceFeatures}
 * - {@link InstanceFeaturesFeatureId}
 *
 * @internal
 */
export class EXTInstanceFeatures extends Extension {
  public override readonly extensionName = NAME;
  public static override EXTENSION_NAME = NAME;

  createInstanceFeatures() {
    return new InstanceFeatures(this.document.getGraph());
  }

  createFeatureId() {
    return new FeatureId(this.document.getGraph());
  }

  public override read(context: ReaderContext): this {
    const jsonDoc = context.jsonDoc;
    const gltfDef = jsonDoc.json;
    const nodeDefs = gltfDef.nodes || [];
    nodeDefs.forEach((nodeDef, nodeIndex) => {
      const node = context.nodes[nodeIndex];
      this.readNode(context, node, nodeDef);
    });
    return this;
  }

  private readNode(context: ReaderContext, node: Node, nodeDef: GLTF.INode) {
    if (!nodeDef.extensions || !nodeDef.extensions[NAME]) {
      return;
    }
    const instanceFeatures = this.createInstanceFeatures();

    const instanceFeaturesDef = nodeDef.extensions[NAME] as InstanceFeaturesDef;
    const featureIdDefs = instanceFeaturesDef.featureIds;
    for (const featureIdDef of featureIdDefs) {
      const featureId = this.createFeatureId();
      this.readFeatureId(featureId, featureIdDef);
      instanceFeatures.addFeatureId(featureId);
    }
    node.setExtension(NAME, instanceFeatures);
  }

  private readFeatureId(featureId: FeatureId, featureIdDef: FeatureIdDef) {
    featureId.setFeatureCount(featureIdDef.featureCount);
    if (featureIdDef.nullFeatureId !== undefined) {
      featureId.setNullFeatureId(featureIdDef.nullFeatureId);
    }
    if (featureIdDef.label !== undefined) {
      featureId.setLabel(featureIdDef.label);
    }
    if (featureIdDef.attribute !== undefined) {
      featureId.setAttribute(featureIdDef.attribute);
    }

    if (featureIdDef.propertyTable !== undefined) {
      const root = this.document.getRoot();
      const structuralMetadata = root.getExtension<StructuralMetadata>(
        "EXT_structural_metadata"
      );
      if (structuralMetadata) {
        const propertyTables = structuralMetadata.listPropertyTables();
        const propertyTable = propertyTables[featureIdDef.propertyTable];
        featureId.setPropertyTable(propertyTable);
      } else {
        throw new Error(
          `${NAME}: No EXT_structural_metadata definition for looking up property tables`
        );
      }
    }
  }

  public override write(context: WriterContext): this {
    const jsonDoc = context.jsonDoc;
    const nodeDefs = jsonDoc.json.nodes;
    if (!nodeDefs) {
      return this;
    }

    for (const node of this.document.getRoot().listNodes()) {
      const nodeIndex = context.nodeIndexMap.get(node);
      if (nodeIndex === undefined) {
        continue;
      }
      const nodeDef = nodeDefs[nodeIndex];
      this.writeNode(node, nodeDef);
    }
    return this;
  }

  private writeNode(node: Node, nodeDef: GLTF.INode) {
    const instanceFeatures = node.getExtension<InstanceFeatures>(NAME);
    if (!instanceFeatures) {
      return;
    }

    const instanceFeaturesDef = { featureIds: [] } as InstanceFeaturesDef;
    instanceFeatures.listFeatureIds().forEach((featureId) => {
      const featureIdDef = this.createFeatureIdDef(featureId);
      instanceFeaturesDef.featureIds.push(featureIdDef);
    });
    nodeDef.extensions = nodeDef.extensions || {};
    nodeDef.extensions[NAME] = instanceFeaturesDef;
  }

  private createFeatureIdDef(featureId: FeatureId): FeatureIdDef {
    let propertyTableDef: number | undefined;
    const propertyTable = featureId.getPropertyTable();
    if (propertyTable !== null) {
      const root = this.document.getRoot();
      const structuralMetadata = root.getExtension<StructuralMetadata>(
        "EXT_structural_metadata"
      );
      if (structuralMetadata) {
        const propertyTables = structuralMetadata.listPropertyTables();
        propertyTableDef = propertyTables.indexOf(propertyTable);
        if (propertyTableDef < 0) {
          throw new Error(`${NAME}: Invalid property table in feature ID`);
        }
      } else {
        throw new Error(
          `${NAME}: No EXT_structural_metadata definition for looking up property table index`
        );
      }
    }
    const featureIdDef: FeatureIdDef = {
      featureCount: featureId.getFeatureCount(),
      nullFeatureId: featureId.getNullFeatureId() ?? undefined,
      label: featureId.getLabel() ?? undefined,
      attribute: featureId.getAttribute() ?? undefined,
      propertyTable: propertyTableDef,
    };
    return featureIdDef;
  }
}

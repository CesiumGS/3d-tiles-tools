import { Document, Mesh, Primitive } from "@gltf-transform/core";
import {
  Class,
  ClassProperty,
  MeshPrimitiveStructuralMetadata,
  Schema,
  StructuralMetadata,
} from "./StructuralMetadata";
import { FeatureId, MeshFeatures } from "./MeshFeatures";

class StringBuilder {
  private s: string;
  private indent: number;
  private indentation: number;
  constructor() {
    this.s = "";
    this.indentation = 2;
    this.indent = 0;
  }
  increaseIndent() {
    this.indent += this.indentation;
  }
  decreaseIndent() {
    this.indent -= this.indentation;
  }
  addLine(...args: any[]) {
    this.s += " ".repeat(this.indent);
    for (const arg of args) {
      this.s += `${arg}`;
    }
    this.s += "\n";
  }
  toString(): string {
    return this.s;
  }
}

export class MetadataUtils {
  static createMetadataInfoString(document: Document): string {
    const structuralMetadata = document
      .getRoot()
      .getExtension<StructuralMetadata>("EXT_structural_metadata");
    console.log(structuralMetadata);

    const sb = new StringBuilder();
    if (structuralMetadata) {
      MetadataUtils.createStructuralMetadataString(sb, structuralMetadata);
      console.log(sb.toString());
    }

    const meshes = document.getRoot().listMeshes();
    MetadataUtils.createMeshesString(sb, meshes);
    return sb.toString();
  }

  private static createStructuralMetadataString(
    sb: StringBuilder,
    structuralMetadata: StructuralMetadata
  ) {
    sb.addLine("StructuralMetadata:");
    const schema = structuralMetadata.getSchema();
    if (schema) {
      sb.increaseIndent();
      sb.addLine("Schema:");
      sb.increaseIndent();
      MetadataUtils.createSchemaString(sb, schema);
      sb.decreaseIndent();
      sb.decreaseIndent();
    }
  }

  private static createSchemaString(sb: StringBuilder, schema: Schema) {
    sb.addLine("id: ", schema.getId());
    sb.addLine("name: ", schema.getObjectName());
    sb.addLine("description: ", schema.getDescription());
    sb.addLine("version: ", schema.getVersion());
    sb.addLine("classes: ");
    const classKeys = schema.listClassKeys();
    for (const classKey of classKeys) {
      sb.increaseIndent();
      sb.addLine(classKey, ":");
      const classObject = schema.getClass(classKey);
      if (classObject) {
        sb.increaseIndent();
        MetadataUtils.createClassString(sb, classObject);
        sb.decreaseIndent();
      }
      sb.increaseIndent();
    }
  }

  private static createClassString(sb: StringBuilder, classObject: Class) {
    sb.addLine("name: ", classObject.getObjectName());
    sb.addLine("description: ", classObject.getDescription());
    sb.addLine("properties:");
    const propertyKeys = classObject.listPropertyKeys();
    for (const propertyKey of propertyKeys) {
      sb.increaseIndent();
      sb.addLine(propertyKey, ":");
      const classProperty = classObject.getProperty(propertyKey);
      if (classProperty) {
        sb.increaseIndent();
        MetadataUtils.createClassPropertyString(sb, classProperty);
        sb.decreaseIndent();
      }
      sb.decreaseIndent();
    }
  }

  private static createClassPropertyString(
    sb: StringBuilder,
    classProperty: ClassProperty
  ) {
    sb.addLine("name: ", classProperty.getObjectName());
    sb.addLine("description: ", classProperty.getDescription());
    sb.addLine("type: ", classProperty.getType());
    sb.addLine("componentType: ", classProperty.getComponentType());
    sb.addLine("enumType: ", classProperty.getEnumType());
    sb.addLine("array: ", classProperty.getArray());
    sb.addLine("count: ", classProperty.getCount());
    sb.addLine("normalized: ", classProperty.getNormalized());
    sb.addLine("offset: ", classProperty.getOffset());
    sb.addLine("scale: ", classProperty.getScale());
    sb.addLine("max: ", classProperty.getMax());
    sb.addLine("min: ", classProperty.getMin());
    sb.addLine("required: ", classProperty.getRequired());
    sb.addLine("noData: ", classProperty.getNoData());
    sb.addLine("default: ", classProperty.getDefault());
  }

  private static createMeshesString(sb: StringBuilder, meshes: Mesh[]) {
    sb.addLine("Meshes");
    for (let m = 0; m < meshes.length; m++) {
      sb.increaseIndent();
      sb.addLine("Mesh ", m, " of ", meshes.length);
      const mesh = meshes[m];
      const primitives = mesh.listPrimitives();
      sb.increaseIndent();
      MetadataUtils.createPrimitivesString(sb, primitives);
      sb.increaseIndent();
      sb.increaseIndent();
    }
  }

  private static createPrimitivesString(
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
      MetadataUtils.createMeshFeaturesString(sb, meshFeatures);
      sb.decreaseIndent();

      sb.increaseIndent();
      const meshPrimitiveStructuralMetadata =
        primitive.getExtension<MeshPrimitiveStructuralMetadata>(
          "EXT_structural_metadata"
        );
      MetadataUtils.createMeshPrimitiveStructuralMetadataString(
        sb,
        meshPrimitiveStructuralMetadata
      );
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
      MetadataUtils.createFeatureIdString(sb, featureId);
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

  private static createMeshPrimitiveStructuralMetadataString(
    sb: StringBuilder,
    meshPrimitiveStructuralMetadata: MeshPrimitiveStructuralMetadata | null
  ) {
    if (!meshPrimitiveStructuralMetadata) {
      sb.addLine("EXT_structural_metadata: (none)");
      return;
    }
    sb.addLine("EXT_structural_metadata:");
    sb.increaseIndent();
    sb.addLine("property textures:");
    const propertyTextures =
      meshPrimitiveStructuralMetadata.listPropertyTextures();
    for (let t = 0; t < propertyTextures.length; t++) {
      sb.increaseIndent();
      sb.addLine("Property Texture ", t, " of ", propertyTextures.length);
      const propertyTexture = propertyTextures[t];
      sb.increaseIndent();
      sb.addLine("TODO");
      sb.decreaseIndent();
      sb.decreaseIndent();
    }
    sb.decreaseIndent();

    sb.increaseIndent();
    sb.addLine("property attributes:");
    const propertyAttributes =
      meshPrimitiveStructuralMetadata.listPropertyAttributes();
    for (let a = 0; a < propertyAttributes.length; a++) {
      sb.increaseIndent();
      sb.addLine("Property Attribute ", a, " of ", propertyAttributes.length);
      const propertyAttribute = propertyAttributes[a];
      sb.increaseIndent();
      sb.addLine("TODO");
      sb.decreaseIndent();
      sb.decreaseIndent();
    }
    sb.decreaseIndent();
  }
}

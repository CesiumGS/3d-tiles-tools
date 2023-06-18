import { Document } from "@gltf-transform/core";
import { Mesh } from "@gltf-transform/core";
import { Primitive } from "@gltf-transform/core";

import { Class } from "./StructuralMetadata";
import { ClassProperty } from "./StructuralMetadata";
import { MeshPrimitiveStructuralMetadata } from "./StructuralMetadata";
import { PropertyAttribute } from "./StructuralMetadata";
import { PropertyAttributeProperty } from "./StructuralMetadata";
import { PropertyTable } from "./StructuralMetadata";
import { PropertyTableProperty } from "./StructuralMetadata";
import { PropertyTexture } from "./StructuralMetadata";
import { PropertyTextureProperty } from "./StructuralMetadata";
import { Schema } from "./StructuralMetadata";
import { StructuralMetadata } from "./StructuralMetadata";

import { FeatureId } from "./MeshFeatures";
import { MeshFeatures } from "./MeshFeatures";

import { BinaryPropertyModels } from "../../metadata/binary/BinaryPropertyModels";

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

    const sb = new StringBuilder();
    if (structuralMetadata) {
      MetadataUtils.createStructuralMetadataString(sb, structuralMetadata);
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
    sb.increaseIndent();

    const schema = structuralMetadata.getSchema();
    if (schema) {
      sb.addLine("Schema:");
      sb.increaseIndent();
      MetadataUtils.createSchemaString(sb, schema);
      sb.decreaseIndent();
    }

    sb.addLine("Property tables:");
    const propertyTables = structuralMetadata.listPropertyTables();
    for (let i = 0; i < propertyTables.length; i++) {
      const propertyTable = propertyTables[i];
      sb.increaseIndent();
      sb.addLine("Property table ", i, " of ", propertyTables.length);
      sb.increaseIndent();
      MetadataUtils.createPropertyTableString(sb, propertyTable, schema);
      sb.decreaseIndent();
      sb.decreaseIndent();
    }
    sb.decreaseIndent();
  }

  private static createPropertyTableString(
    sb: StringBuilder,
    propertyTable: PropertyTable,
    schema: Schema | null
  ) {
    sb.addLine("name: ", propertyTable.getObjectName());
    sb.addLine("class: ", propertyTable.getClass());
    sb.addLine("count: ", propertyTable.getCount());
    sb.addLine("properties:");
    const propertyKeys = propertyTable.listPropertyKeys();
    for (const propertyKey of propertyKeys) {
      sb.increaseIndent();
      sb.addLine(propertyKey, ":");
      const propertyTableProperty = propertyTable.getProperty(propertyKey);
      if (propertyTableProperty) {
        sb.increaseIndent();
        const className = propertyTable.getClass();
        const rowCount = propertyTable.getCount();
        MetadataUtils.createPropertyTablePropertyString(
          sb,
          propertyTableProperty
        );
        MetadataUtils.createPropertyTablePropertyValuesString(
          sb,
          propertyTableProperty,
          schema,
          className,
          propertyKey,
          rowCount
        );
        sb.decreaseIndent();
      }
      sb.decreaseIndent();
    }
  }

  private static createPropertyTablePropertyValuesString(
    sb: StringBuilder,
    propertyTableProperty: PropertyTableProperty,
    schema: Schema | null,
    className: string,
    propertyName: string,
    rowCount: number
  ) {
    if (!schema) {
      sb.addLine("decoded values: (no schema");
      return;
    }
    const classValue = schema.getClass(className);
    if (!classValue) {
      sb.addLine(`decoded values: (no class '${className}' in schema)`);
      return;
    }
    const classProperty = classValue.getProperty(propertyName);
    if (!classProperty) {
      sb.addLine(
        `decoded values: (no property '${propertyName}' in class '${className}' in schema)`
      );
      return;
    }
    const type = classProperty.getType();
    const componentType = classProperty.getComponentType();
    const isArray = classProperty.getArray();
    const count = classProperty.getCount();
    const valuesBufferViewData = Buffer.from(propertyTableProperty.getValues());

    const arrayOffsets = propertyTableProperty.getArrayOffsets();
    let arrayOffsetsBufferViewData: Buffer | undefined = undefined;
    if (arrayOffsets) {
      arrayOffsetsBufferViewData = Buffer.from(arrayOffsets);
    }
    const arrayOffsetType = propertyTableProperty.getArrayOffsetType();

    const stringOffsets = propertyTableProperty.getStringOffsets();
    let stringOffsetsBufferViewData: Buffer | undefined;
    if (stringOffsets) {
      stringOffsetsBufferViewData = Buffer.from(stringOffsets);
    }
    const stringOffsetType = propertyTableProperty.getStringOffsetType();

    let enumValueType = undefined;
    const enumType = classProperty.getEnumType();
    if (enumType !== undefined) {
      const enumObject = schema.getEnum(enumType);
      if (!enumObject) {
        sb.addLine(`decoded values: (no enum '${enumType}' in schema)`);
        return;
      }
      enumValueType = enumObject.getValueType() ?? "UINT16";
    }
    const propertyModel = BinaryPropertyModels.createPropertyModelInternal(
      propertyName,
      type,
      componentType,
      isArray,
      count,
      valuesBufferViewData,
      arrayOffsetsBufferViewData,
      arrayOffsetType,
      stringOffsetsBufferViewData,
      stringOffsetType,
      enumValueType
    );
    sb.addLine("decoded values: ");
    sb.increaseIndent();
    for (let r = 0; r < rowCount; r++) {
      const v = propertyModel.getPropertyValue(r);
      sb.addLine(v);
    }
    sb.decreaseIndent();
  }

  private static createPropertyTablePropertyString(
    sb: StringBuilder,
    propertyTableProperty: PropertyTableProperty
  ) {
    sb.addLine(
      "values: ",
      propertyTableProperty.getValues() ? "(present)" : "undefined"
    );
    sb.addLine(
      "arrayOffsets: ",
      propertyTableProperty.getArrayOffsets() ? "(present)" : "undefined"
    );
    sb.addLine(
      "stringOffsets: ",
      propertyTableProperty.getStringOffsets() ? "(present)" : "undefined"
    );
    sb.addLine("arrayOffsetType: ", propertyTableProperty.getArrayOffsetType());
    sb.addLine(
      "stringOffsetType: ",
      propertyTableProperty.getStringOffsetType()
    );
    sb.addLine("offset: ", propertyTableProperty.getOffset());
    sb.addLine("scale: ", propertyTableProperty.getScale());
    sb.addLine("max: ", propertyTableProperty.getMax());
    sb.addLine("min: ", propertyTableProperty.getMin());
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
      sb.increaseIndent();
      const propertyTexture = propertyTextures[t];
      MetadataUtils.createPropertyTextureString(sb, propertyTexture);
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
      sb.increaseIndent();
      const propertyAttribute = propertyAttributes[a];
      MetadataUtils.createPropertyAttributeString(sb, propertyAttribute);
      sb.decreaseIndent();
      sb.decreaseIndent();
    }
    sb.decreaseIndent();
  }

  private static createPropertyTextureString(
    sb: StringBuilder,
    propertyTexture: PropertyTexture
  ) {
    sb.addLine("name: ", propertyTexture.getObjectName());
    sb.addLine("class: ", propertyTexture.getClass());
    sb.addLine("properties:");
    const propertyKeys = propertyTexture.listPropertyKeys();
    for (const propertyKey of propertyKeys) {
      sb.increaseIndent();
      sb.addLine(propertyKey, ":");
      const propertyTextureProperty = propertyTexture.getProperty(propertyKey);
      if (propertyTextureProperty) {
        sb.increaseIndent();
        MetadataUtils.createPropertyTexturePropertyString(
          sb,
          propertyTextureProperty
        );
        sb.decreaseIndent();
      }
      sb.decreaseIndent();
    }
  }

  private static createPropertyTexturePropertyString(
    sb: StringBuilder,
    propertyTextureProperty: PropertyTextureProperty
  ) {
    sb.addLine("channels: ", propertyTextureProperty.getChannels());
    sb.addLine("offset: ", propertyTextureProperty.getOffset());
    sb.addLine("scale: ", propertyTextureProperty.getScale());
    sb.addLine("max: ", propertyTextureProperty.getMax());
    sb.addLine("min: ", propertyTextureProperty.getMin());
    sb.addLine("texture ", propertyTextureProperty.getTexture());
    sb.addLine("textureInfo ", propertyTextureProperty.getTextureInfo());
  }

  private static createPropertyAttributeString(
    sb: StringBuilder,
    propertyAttribute: PropertyAttribute
  ) {
    sb.addLine("name: ", propertyAttribute.getObjectName());
    sb.addLine("class: ", propertyAttribute.getClass());
    sb.addLine("properties:");
    const propertyKeys = propertyAttribute.listPropertyKeys();
    for (const propertyKey of propertyKeys) {
      sb.increaseIndent();
      sb.addLine(propertyKey, ":");
      const propertyAttributeProperty =
        propertyAttribute.getProperty(propertyKey);
      if (propertyAttributeProperty) {
        sb.increaseIndent();
        MetadataUtils.createPropertyAttributePropertyString(
          sb,
          propertyAttributeProperty
        );
        sb.decreaseIndent();
      }
      sb.decreaseIndent();
    }
  }

  private static createPropertyAttributePropertyString(
    sb: StringBuilder,
    propertyAttributeProperty: PropertyAttributeProperty
  ) {
    sb.addLine("attribute: ", propertyAttributeProperty.getAttribute());
    sb.addLine("offset: ", propertyAttributeProperty.getOffset());
    sb.addLine("scale: ", propertyAttributeProperty.getScale());
    sb.addLine("max: ", propertyAttributeProperty.getMax());
    sb.addLine("min: ", propertyAttributeProperty.getMin());
  }
}

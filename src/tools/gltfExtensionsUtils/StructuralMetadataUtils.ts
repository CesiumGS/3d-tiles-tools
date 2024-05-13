import { Document } from "@gltf-transform/core";
import { Mesh } from "@gltf-transform/core";
import { Primitive } from "@gltf-transform/core";

import { StructuralMetadataClass as Class } from "../../gltf-extensions";
import { StructuralMetadataClassProperty as ClassProperty } from "../../gltf-extensions";
import { MeshPrimitiveStructuralMetadata } from "../../gltf-extensions";
import { StructuralMetadataPropertyAttribute as PropertyAttribute } from "../../gltf-extensions";
import { StructuralMetadataPropertyAttributeProperty as PropertyAttributeProperty } from "../../gltf-extensions";
import { StructuralMetadataPropertyTable as PropertyTable } from "../../gltf-extensions";
import { StructuralMetadataPropertyTableProperty as PropertyTableProperty } from "../../gltf-extensions";
import { StructuralMetadataPropertyTexture as PropertyTexture } from "../../gltf-extensions";
import { StructuralMetadataPropertyTextureProperty as PropertyTextureProperty } from "../../gltf-extensions";
import { StructuralMetadataSchema as Schema } from "../../gltf-extensions";
import { StructuralMetadata } from "../../gltf-extensions";

import { BinaryPropertyModels } from "../../metadata";

import { StringBuilder } from "./StringBuilder";

/**
 * Utilities related to the glTF `EXT_structural_metadata` extension.
 *
 * @internal
 */
export class StructuralMetadataUtils {
  /**
   * Creates an string representation of the `EXT_structural_metadata`
   * that is contained in the given glTF Transform document.
   *
   * The exact format and contents of this string is not specified
   *
   * @param document - The glTF Transform document
   * @returns The string
   */
  static createStructuralMetadataInfoString(document: Document): string {
    const structuralMetadata = document
      .getRoot()
      .getExtension<StructuralMetadata>("EXT_structural_metadata");

    const sb = new StringBuilder();
    if (structuralMetadata) {
      StructuralMetadataUtils.createStructuralMetadataString(
        sb,
        structuralMetadata
      );
    }
    const meshes = document.getRoot().listMeshes();
    StructuralMetadataUtils.createMeshesMetadataString(sb, meshes);
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
      StructuralMetadataUtils.createSchemaString(sb, schema);
      sb.decreaseIndent();
    }

    sb.addLine("Property tables:");
    const propertyTables = structuralMetadata.listPropertyTables();
    for (let i = 0; i < propertyTables.length; i++) {
      const propertyTable = propertyTables[i];
      sb.increaseIndent();
      sb.addLine("Property table ", i, " of ", propertyTables.length);
      sb.increaseIndent();
      StructuralMetadataUtils.createPropertyTableString(
        sb,
        propertyTable,
        schema
      );
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
        StructuralMetadataUtils.createPropertyTablePropertyString(
          sb,
          propertyTableProperty
        );
        StructuralMetadataUtils.createPropertyTablePropertyValuesString(
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

    let enumValueType: string | undefined = undefined;
    const enumType = classProperty.getEnumType();
    if (enumType !== null) {
      const enumObject = schema.getEnum(enumType);
      if (!enumObject) {
        sb.addLine(`decoded values: (no enum '${enumType}' in schema)`);
        return;
      }
      enumValueType = enumObject.getValueType();
    }
    const propertyModel = BinaryPropertyModels.createPropertyModelInternal(
      propertyName,
      type,
      componentType ?? undefined,
      isArray,
      count ?? undefined,
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
        StructuralMetadataUtils.createClassString(sb, classObject);
        sb.decreaseIndent();
      }
      sb.decreaseIndent();
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
        StructuralMetadataUtils.createClassPropertyString(sb, classProperty);
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

  private static createMeshesMetadataString(sb: StringBuilder, meshes: Mesh[]) {
    sb.addLine("Meshes");
    for (let m = 0; m < meshes.length; m++) {
      sb.increaseIndent();
      sb.addLine("Mesh ", m, " of ", meshes.length);
      const mesh = meshes[m];
      const primitives = mesh.listPrimitives();
      sb.increaseIndent();
      StructuralMetadataUtils.createPrimitivesMetadataString(sb, primitives);
      sb.decreaseIndent();
      sb.decreaseIndent();
    }
  }

  private static createPrimitivesMetadataString(
    sb: StringBuilder,
    primitives: Primitive[]
  ) {
    sb.addLine("Primitives:");
    for (let p = 0; p < primitives.length; p++) {
      sb.increaseIndent();
      sb.addLine("Primitive ", p, " of ", primitives.length);
      const primitive = primitives[p];
      sb.increaseIndent();
      const meshPrimitiveStructuralMetadata =
        primitive.getExtension<MeshPrimitiveStructuralMetadata>(
          "EXT_structural_metadata"
        );
      StructuralMetadataUtils.createMeshPrimitiveMetadataString(
        sb,
        meshPrimitiveStructuralMetadata
      );
      sb.decreaseIndent();

      sb.decreaseIndent();
    }
  }

  private static createMeshPrimitiveMetadataString(
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
      StructuralMetadataUtils.createPropertyTextureString(sb, propertyTexture);
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
      StructuralMetadataUtils.createPropertyAttributeString(
        sb,
        propertyAttribute
      );
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
        StructuralMetadataUtils.createPropertyTexturePropertyString(
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
        StructuralMetadataUtils.createPropertyAttributePropertyString(
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

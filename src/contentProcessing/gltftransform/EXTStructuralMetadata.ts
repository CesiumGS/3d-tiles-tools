import { Extension } from "@gltf-transform/core";
import { GLTF } from "@gltf-transform/core";
import { ReaderContext } from "@gltf-transform/core";
import { WriterContext } from "@gltf-transform/core";

import {
  Class,
  ClassProperty,
  ElementStructuralMetadata,
  Enum,
  EnumValue,
  MeshPrimitiveStructuralMetadata,
  PropertyAttribute,
  PropertyAttributeProperty,
  PropertyTable,
  PropertyTableProperty,
  PropertyTexture,
  PropertyTextureProperty,
  Schema,
  StructuralMetadata,
} from "./StructuralMetadata";

const NAME = "EXT_structural_metadata";

//============================================================================
// Interfaces for the JSON structure
// (See `EXTMeshFeatures` for details about the concepts)

// TODO Consider limiting the type from string to the valid set for
// type, componentType, valueType, arrayOffsetType, stringOffsetType

interface StructuralMetadataDef {
  schema?: SchemaDef;
  schemaUri?: string;
  propertyTables?: PropertyTableDef[];
  propertyTextures?: PropertyTextureDef[];
  propertyAttributes?: PropertyAttributeDef[];
}
interface SchemaDef {
  id: string;
  name?: string;
  description: string;
  version: string;
  classes: { [key: string]: ClassDef };
  enums: { [key: string]: EnumDef };
}
interface ClassDef {
  name?: string;
  description?: string;
  properties?: { [key: string]: ClassPropertyDef };
}

type NumericValue = number | number[] | number[][];
type NoDataValue = number | string | number[] | string[] | number[][];
type AnyValue =
  | number
  | string
  | boolean
  | number[]
  | string[]
  | boolean[]
  | number[][];

interface ClassPropertyDef {
  name?: string;
  description?: string;
  type: string;
  componentType?: string;
  enumType?: string;
  array?: boolean;
  count?: number;
  normalized?: boolean;
  offset?: NumericValue;
  scale?: NumericValue;
  max?: NumericValue;
  min?: NumericValue;
  required?: boolean;
  noData?: NoDataValue;
  default?: AnyValue;
}

interface EnumDef {
  name?: string;
  description?: string;
  valueType?: string;
  values: EnumValueDef[];
}

interface EnumValueDef {
  name: string;
  description?: string;
  value: number;
}

interface PropertyTableDef {
  name?: string;
  class: string;
  count: number;
  properties?: { [key: string]: PropertyTablePropertyDef };
}

interface PropertyTablePropertyDef {
  values: number;
  arrayOffsets?: number;
  stringOffsets?: number;
  arrayOffsetType?: string;
  stringOffsetType?: string;
  offset?: NumericValue;
  scale?: NumericValue;
  max?: NumericValue;
  min?: NumericValue;
}

interface PropertyTextureDef {
  name?: string;
  class: string;
  properties?: { [key: string]: PropertyTexturePropertyDef };
}

interface PropertyTexturePropertyDef extends GLTF.ITextureInfo {
  channels?: number[];
  offset?: NumericValue;
  scale?: NumericValue;
  max?: NumericValue;
  min?: NumericValue;
}

interface PropertyAttributeDef {
  name?: string;
  class: string;
  properties?: { [key: string]: PropertyAttributePropertyDef };
}

interface PropertyAttributePropertyDef {
  attribute: string;
  offset?: NumericValue;
  scale?: NumericValue;
  max?: NumericValue;
  min?: NumericValue;
}

// This corresponds to the EXT_structural_metadata.schema.json
// schema, which is structural metadata that can be applied
// to all glTF elements, and is only constrainted to 'nodes' in
// the specification text for now
interface ElementStructuralMetadataDef {
  propertyTable?: number;
  index?: number;
}

// This corresponds to the mesh.primitive.EXT_structural_metadata.schema.json
// schema
interface MeshPrimitiveStructuralMetadataDef {
  propertyTextures?: number[];
  propertyAttributes?: number[];
}

//============================================================================

export class EXTStructuralMetadata extends Extension {
  public override readonly extensionName = NAME;
  public static override EXTENSION_NAME = NAME;

  createStructuralMetadata() {
    return new StructuralMetadata(this.document.getGraph());
  }

  createSchema() {
    return new Schema(this.document.getGraph());
  }

  createClass() {
    return new Class(this.document.getGraph());
  }

  createClassProperty() {
    return new ClassProperty(this.document.getGraph());
  }

  createEnum() {
    return new Enum(this.document.getGraph());
  }

  createEnumValue() {
    return new EnumValue(this.document.getGraph());
  }

  createPropertyTable() {
    return new PropertyTable(this.document.getGraph());
  }

  createPropertyTableProperty() {
    return new PropertyTableProperty(this.document.getGraph());
  }

  createPropertyTexture() {
    return new PropertyTexture(this.document.getGraph());
  }

  createPropertyTextureProperty() {
    return new PropertyTextureProperty(this.document.getGraph());
  }

  createPropertyAttribute() {
    return new PropertyAttribute(this.document.getGraph());
  }

  createPropertyAttributeProperty() {
    return new PropertyAttributeProperty(this.document.getGraph());
  }

  createElementStructuralMetadata() {
    return new ElementStructuralMetadata(this.document.getGraph());
  }

  createMeshPrimitiveStructuralMetadata() {
    return new MeshPrimitiveStructuralMetadata(this.document.getGraph());
  }

  public override read(context: ReaderContext): this {
    const structuralMetadata = this.createTopLevelStructuralMetadata(context);
    if (!structuralMetadata) {
      return this;
    }

    const jsonDoc = context.jsonDoc;
    const gltfDef = jsonDoc.json;
    const meshDefs = gltfDef.meshes || [];
    meshDefs.forEach((meshDef, meshIndex) => {
      const primDefs = meshDef.primitives || [];
      primDefs.forEach((primDef, primIndex) => {
        this.readPrimitive(
          context,
          structuralMetadata,
          meshIndex,
          primDef,
          primIndex
        );
      });
    });
    return this;
  }

  private createTopLevelStructuralMetadata(
    context: ReaderContext
  ): StructuralMetadata | undefined {
    const jsonDoc = context.jsonDoc;
    const gltfDef = jsonDoc.json;
    if (!gltfDef.extensions || !gltfDef.extensions[NAME]) {
      return undefined;
    }

    // Obtain the top-level structural metadatat information,
    // and use it to will the "model class" instance
    const structuralMetadataDef = gltfDef.extensions[
      NAME
    ] as StructuralMetadataDef;
    const structuralMetadata = this.createStructuralMetadata();

    this.readStructuralMetadata(
      context,
      structuralMetadata,
      structuralMetadataDef
    );

    const root = this.document.getRoot();
    root.setExtension(NAME, structuralMetadata);
    return structuralMetadata;
  }

  private readPrimitive(
    context: ReaderContext,
    structuralMetadata: StructuralMetadata,
    meshIndex: number,
    primDef: GLTF.IMeshPrimitive,
    primIndex: number
  ) {
    if (!primDef.extensions || !primDef.extensions[NAME]) {
      return;
    }
    const meshPrimitiveStructuralMetadata =
      this.createMeshPrimitiveStructuralMetadata();

    const extensionObject = primDef.extensions[NAME];
    const meshPrimitiveStructuralMetadataDef =
      extensionObject as MeshPrimitiveStructuralMetadataDef;

    const propertyTextures = structuralMetadata.listPropertyTextures();
    const propertyTextureIndexDefs =
      meshPrimitiveStructuralMetadataDef.propertyTextures || [];
    for (const propertyTextureIndexDef of propertyTextureIndexDefs) {
      const propertyTexture = propertyTextures[propertyTextureIndexDef];
      meshPrimitiveStructuralMetadata.addPropertyTexture(propertyTexture);
    }

    const propertyAttributes = structuralMetadata.listPropertyAttributes();
    const propertyAttributeIndexDefs =
      meshPrimitiveStructuralMetadataDef.propertyAttributes || [];
    for (const propertyAttributeIndexDef of propertyAttributeIndexDefs) {
      const propertyAttribute = propertyAttributes[propertyAttributeIndexDef];
      meshPrimitiveStructuralMetadata.addPropertyAttribute(propertyAttribute);
    }

    const mesh = context.meshes[meshIndex];
    const primitives = mesh.listPrimitives();
    primitives[primIndex].setExtension(NAME, meshPrimitiveStructuralMetadata);
  }

  private readStructuralMetadata(
    context: ReaderContext,
    structuralMetadata: StructuralMetadata,
    structuralMetadataDef: StructuralMetadataDef
  ) {
    if (structuralMetadataDef.schema !== undefined) {
      const schemaDef = structuralMetadataDef.schema;
      const schema = this.createSchema();
      this.readSchema(context, schema, schemaDef);
      structuralMetadata.setSchema(schema);
    } else if (structuralMetadataDef.schemaUri !== undefined) {
      const schemaUri = structuralMetadataDef.schemaUri;
      structuralMetadata.setSchemaUri(schemaUri);
    }

    const propertyTextureDefs = structuralMetadataDef.propertyTextures || [];
    for (const propertyTextureDef of propertyTextureDefs) {
      const propertyTexture = this.createPropertyTexture();
      this.readPropertyTexture(context, propertyTexture, propertyTextureDef);
      structuralMetadata.addPropertyTexture(propertyTexture);
    }

    const propertyTableDefs = structuralMetadataDef.propertyTables || [];
    for (const propertyTableDef of propertyTableDefs) {
      const propertyTable = this.createPropertyTable();
      this.readPropertyTable(context, propertyTable, propertyTableDef);
      structuralMetadata.addPropertyTable(propertyTable);
    }

    const propertyAttributeDefs =
      structuralMetadataDef.propertyAttributes || [];
    for (const propertyAttributeDef of propertyAttributeDefs) {
      const propertyAttribute = this.createPropertyAttribute();
      this.readPropertyAttribute(
        context,
        propertyAttribute,
        propertyAttributeDef
      );
      structuralMetadata.addPropertyAttribute(propertyAttribute);
    }
  }
  private readSchema(
    context: ReaderContext,
    schema: Schema,
    schemaDef: SchemaDef
  ) {
    if (schemaDef.id !== undefined) {
      schema.setId(schemaDef.id);
    }
    if (schemaDef.name !== undefined) {
      schema.setObjectName(schemaDef.name);
    }
    if (schemaDef.description !== undefined) {
      schema.setDescription(schemaDef.description);
    }
    if (schemaDef.version !== undefined) {
      schema.setVersion(schemaDef.version);
    }
    const classes = schemaDef.classes || {};
    for (const classKey of Object.keys(classes)) {
      const classDef = classes[classKey];
      const classObject = this.createClass();
      this.readClass(context, classObject, classDef);
      schema.setClass(classKey, classObject);
    }
  }

  private readClass(
    context: ReaderContext,
    classObject: Class,
    classDef: ClassDef
  ) {
    if (classDef.name !== undefined) {
      classObject.setObjectName(classDef.name);
    }
    if (classDef.description !== undefined) {
      classObject.setDescription(classDef.description);
    }
    const properties = classDef.properties || {};
    for (const classPropertyKey of Object.keys(properties)) {
      const classPropertyDef = properties[classPropertyKey];
      const classProperty = this.createClassProperty();
      this.readClassProperty(context, classProperty, classPropertyDef);
      classObject.setProperty(classPropertyKey, classProperty);
    }
  }

  private readClassProperty(
    context: ReaderContext,
    classProperty: ClassProperty,
    classPropertyDef: ClassPropertyDef
  ) {
    if (classPropertyDef.name !== undefined) {
      classProperty.setObjectName(classPropertyDef.name);
    }
    if (classPropertyDef.description !== undefined) {
      classProperty.setDescription(classPropertyDef.description);
    }

    if (classPropertyDef.type !== undefined) {
      classProperty.setType(classPropertyDef.type);
    }
    if (classPropertyDef.componentType !== undefined) {
      classProperty.setComponentType(classPropertyDef.componentType);
    }
    if (classPropertyDef.enumType !== undefined) {
      classProperty.setEnumType(classPropertyDef.enumType);
    }
    if (classPropertyDef.array !== undefined) {
      classProperty.setArray(classPropertyDef.array);
    }
    if (classPropertyDef.count !== undefined) {
      classProperty.setCount(classPropertyDef.count);
    }
    if (classPropertyDef.normalized !== undefined) {
      classProperty.setNormalized(classPropertyDef.normalized);
    }
    if (classPropertyDef.offset !== undefined) {
      classProperty.setOffset(classPropertyDef.offset);
    }
    if (classPropertyDef.scale !== undefined) {
      classProperty.setScale(classPropertyDef.scale);
    }
    if (classPropertyDef.max !== undefined) {
      classProperty.setMax(classPropertyDef.max);
    }
    if (classPropertyDef.min !== undefined) {
      classProperty.setMin(classPropertyDef.min);
    }
    if (classPropertyDef.required !== undefined) {
      classProperty.setRequired(classPropertyDef.required);
    }
    if (classPropertyDef.noData !== undefined) {
      classProperty.setNoData(classPropertyDef.noData);
    }
    if (classPropertyDef.default !== undefined) {
      classProperty.setDefault(classPropertyDef.default);
    }
  }

  private readPropertyTexture(
    context: ReaderContext,
    propertyTexture: PropertyTexture,
    propertyTextureDef: PropertyTextureDef
  ) {
    propertyTexture.setClass(propertyTextureDef.class);
    if (propertyTextureDef.name !== undefined) {
      propertyTexture.setName(propertyTextureDef.name);
    }
    const properties = propertyTextureDef.properties || {};
    for (const propertyKey of Object.keys(properties)) {
      const propertyTexturePropertyDef = properties[propertyKey];
      const propertyTextureProperty = this.createPropertyTextureProperty();
      this.readPropertyTextureProperty(
        context,
        propertyTextureProperty,
        propertyTexturePropertyDef
      );
      propertyTexture.setProperty(propertyKey, propertyTextureProperty);
    }
  }

  private readPropertyTextureProperty(
    context: ReaderContext,
    propertyTextureProperty: PropertyTextureProperty,
    propertyTexturePropertyDef: PropertyTexturePropertyDef
  ) {
    const jsonDoc = context.jsonDoc;
    const textureDefs = jsonDoc.json.textures || [];
    if (propertyTexturePropertyDef.channels) {
      propertyTextureProperty.setChannels(propertyTexturePropertyDef.channels);
    }
    const source = textureDefs[propertyTexturePropertyDef.index].source;
    if (source !== undefined) {
      const texture = context.textures[source];
      propertyTextureProperty.setTexture(texture);
      const textureInfo = propertyTextureProperty.getTextureInfo();
      if (textureInfo) {
        context.setTextureInfo(textureInfo, propertyTexturePropertyDef);
      }
    }
    if (propertyTexturePropertyDef.offset !== undefined) {
      propertyTextureProperty.setOffset(propertyTexturePropertyDef.offset);
    }
    if (propertyTexturePropertyDef.scale !== undefined) {
      propertyTextureProperty.setScale(propertyTexturePropertyDef.scale);
    }
    if (propertyTexturePropertyDef.max !== undefined) {
      propertyTextureProperty.setMax(propertyTexturePropertyDef.max);
    }
    if (propertyTexturePropertyDef.min !== undefined) {
      propertyTextureProperty.setMin(propertyTexturePropertyDef.min);
    }
  }

  private readPropertyTable(
    context: ReaderContext,
    propertyTable: PropertyTable,
    propertyTableDef: PropertyTableDef
  ) {
    propertyTable.setClass(propertyTableDef.class);
    if (propertyTableDef.name !== undefined) {
      propertyTable.setName(propertyTableDef.name);
    }
    propertyTable.setCount(propertyTableDef.count);
    const properties = propertyTableDef.properties || {};
    for (const propertyKey of Object.keys(properties)) {
      const propertyTablePropertyDef = properties[propertyKey];
      const propertyTableProperty = this.createPropertyTableProperty();
      this.readPropertyTableProperty(
        context,
        propertyTableProperty,
        propertyTablePropertyDef
      );
      propertyTable.setProperty(propertyKey, propertyTableProperty);
    }
  }

  private readPropertyTableProperty(
    context: ReaderContext,
    propertyTableProperty: PropertyTableProperty,
    propertyTablePropertyDef: PropertyTablePropertyDef
  ) {
    const valuesBufferViewIndex = propertyTablePropertyDef.values;

    /*/ TODO: Here, the data should be obtained 
    const jsonDoc = context.jsonDoc;
    const bufferDefs = jsonDoc.json.buffers || [];
    const bufferViewDefs = jsonDoc.json.bufferViews || [];
    const bufferViewDef = bufferViewDefs[valuesBufferViewIndex];
    const bufferDef = bufferDefs[bufferViewDef.buffer];
    const bufferData = bufferDef.uri ? jsonDoc.resources[bufferDef.uri] : jsonDoc.resources[GLB_BUFFER];
    const byteOffset = bufferViewDef.byteOffset || 0;
    const byteLength = bufferViewDef.byteLength;
    const bufferViewData = bufferData.slice(byteOffset, byteOffset + byteLength);
    //*/
    propertyTableProperty.setValues(valuesBufferViewIndex);

    // I'd REALLY like to boil these down to
    // setIfDefined(propertyTableProperty, propertyTablePropertyDef, "arrayOffsets");
    // or even
    // for (p in def) set(m, def, p);
    // or even
    // assignAll(model, def);
    // ...

    if (propertyTablePropertyDef.arrayOffsets !== undefined) {
      propertyTableProperty.setArrayOffsets(
        propertyTablePropertyDef.arrayOffsets
      );
    }
    if (propertyTablePropertyDef.stringOffsets !== undefined) {
      propertyTableProperty.setStringOffsets(
        propertyTablePropertyDef.stringOffsets
      );
    }
    if (propertyTablePropertyDef.arrayOffsetType !== undefined) {
      propertyTableProperty.setArrayOffsetType(
        propertyTablePropertyDef.arrayOffsetType
      );
    }
    if (propertyTablePropertyDef.stringOffsetType !== undefined) {
      propertyTableProperty.setStringOffsetType(
        propertyTablePropertyDef.stringOffsetType
      );
    }
    if (propertyTablePropertyDef.offset !== undefined) {
      propertyTableProperty.setOffset(propertyTablePropertyDef.offset);
    }
    if (propertyTablePropertyDef.scale !== undefined) {
      propertyTableProperty.setScale(propertyTablePropertyDef.scale);
    }
    if (propertyTablePropertyDef.max !== undefined) {
      propertyTableProperty.setMax(propertyTablePropertyDef.max);
    }
    if (propertyTablePropertyDef.min !== undefined) {
      propertyTableProperty.setMin(propertyTablePropertyDef.min);
    }
  }

  private readPropertyAttribute(
    context: ReaderContext,
    propertyAttribute: PropertyAttribute,
    propertyAttributeDef: PropertyAttributeDef
  ) {
    propertyAttribute.setClass(propertyAttributeDef.class);
    if (propertyAttributeDef.name !== undefined) {
      propertyAttribute.setName(propertyAttributeDef.name);
    }
    const properties = propertyAttributeDef.properties || {};
    for (const propertyKey of Object.keys(properties)) {
      const propertyAttributePropertyDef = properties[propertyKey];
      const propertyAttributeProperty = this.createPropertyAttributeProperty();
      this.readPropertyAttributeProperty(
        context,
        propertyAttributeProperty,
        propertyAttributePropertyDef
      );
      propertyAttribute.setProperty(propertyKey, propertyAttributeProperty);
    }
  }

  private readPropertyAttributeProperty(
    context: ReaderContext,
    propertyAttributeProperty: PropertyAttributeProperty,
    propertyAttributePropertyDef: PropertyAttributePropertyDef
  ) {
    propertyAttributeProperty.setAttribute(
      propertyAttributePropertyDef.attribute
    );

    if (propertyAttributePropertyDef.offset !== undefined) {
      propertyAttributeProperty.setOffset(propertyAttributePropertyDef.offset);
    }
    if (propertyAttributePropertyDef.scale !== undefined) {
      propertyAttributeProperty.setScale(propertyAttributePropertyDef.scale);
    }
    if (propertyAttributePropertyDef.max !== undefined) {
      propertyAttributeProperty.setMax(propertyAttributePropertyDef.max);
    }
    if (propertyAttributePropertyDef.min !== undefined) {
      propertyAttributeProperty.setMin(propertyAttributePropertyDef.min);
    }
  }

  public override write(context: WriterContext): this {
    // TODO
    return this;
  }
}

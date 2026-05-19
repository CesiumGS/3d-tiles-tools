import { EXTStructuralMetadata } from "@gltf-transform/extensions";
import { Schema } from "@gltf-transform/extensions";
import { Class } from "@gltf-transform/extensions";
import { ClassProperty } from "@gltf-transform/extensions";
import { Enum } from "@gltf-transform/extensions";
import { EnumValue } from "@gltf-transform/extensions";

/**
 * Utility methods for creating a 'Schema' for EXTStructuralMetadata
 * from a given JSON representation.
 *
 * @internal
 */
export class StructuralMetadataSchemas {
  /**
   * Create a 'Schema' object in the given extension, based on the
   * given JSON representation.
   *
   * @param ext - The EXTStructuralMetadata
   * @param schemaDef - The JSON input
   * @returns The resulting object
   */
  static createSchemaFrom(ext: EXTStructuralMetadata, schemaDef: any): Schema {
    const schema = ext.createSchema();
    if (schemaDef.id !== undefined) {
      schema.setId(schemaDef.id);
    } else {
      throw new Error(`The schema.id is required`);
    }

    if (schemaDef.name !== undefined) {
      schema.setName(schemaDef.name);
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
      schema.setClass(
        classKey,
        StructuralMetadataSchemas.createClassFrom(ext, classDef)
      );
    }
    const enums = schemaDef.enums || {};
    for (const enumKey of Object.keys(enums)) {
      schema.setEnum(
        enumKey,
        StructuralMetadataSchemas.createEnumFrom(ext, enums[enumKey])
      );
    }
    return schema;
  }

  /**
   * Create a 'Class' object in the given extension, based on the
   * given JSON representation.
   *
   * @param ext - The EXTStructuralMetadata
   * @param schemaDef - The JSON input
   * @returns The resulting object
   */
  private static createClassFrom(
    ext: EXTStructuralMetadata,
    classDef: any
  ): Class {
    const classObject = ext.createClass();

    if (classDef.name !== undefined) {
      classObject.setName(classDef.name);
    }

    if (classDef.description !== undefined) {
      classObject.setDescription(classDef.description);
    }

    const properties = classDef.properties || {};
    for (const classPropertyKey of Object.keys(properties)) {
      const classProperty = StructuralMetadataSchemas.createClassPropertyFrom(
        ext,
        properties[classPropertyKey]
      );
      classObject.setProperty(classPropertyKey, classProperty);
    }

    return classObject;
  }

  /**
   * Create a 'ClassProperty' object in the given extension, based on the
   * given JSON representation.
   *
   * @param ext - The EXTStructuralMetadata
   * @param schemaDef - The JSON input
   * @returns The resulting object
   */
  private static createClassPropertyFrom(
    ext: EXTStructuralMetadata,
    classPropertyDef: any
  ): ClassProperty {
    const classProperty = ext
      .createClassProperty()
      .setType(classPropertyDef.type);

    if (classPropertyDef.name !== undefined) {
      classProperty.setName(classPropertyDef.name);
    }
    if (classPropertyDef.description !== undefined) {
      classProperty.setDescription(classPropertyDef.description);
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

    return classProperty;
  }

  /**
   * Create an 'Enum' object in the given extension, based on the
   * given JSON representation.
   *
   * @param ext - The EXTStructuralMetadata
   * @param schemaDef - The JSON input
   * @returns The resulting object
   */
  private static createEnumFrom(
    ext: EXTStructuralMetadata,
    enumDef: any
  ): Enum {
    const enumObject = ext.createEnum();

    if (enumDef.name !== undefined) {
      enumObject.setName(enumDef.name);
    }
    if (enumDef.description !== undefined) {
      enumObject.setDescription(enumDef.description);
    }
    if (enumDef.valueType !== undefined) {
      enumObject.setValueType(enumDef.valueType);
    }

    const valueDefs = enumDef.values || {};
    for (const valueDef of valueDefs) {
      enumObject.addEnumValue(
        StructuralMetadataSchemas.createEnumValueFrom(ext, valueDef)
      );
    }

    return enumObject;
  }

  /**
   * Create a 'EnumValue' object in the given extension, based on the
   * given JSON representation.
   *
   * @param ext - The EXTStructuralMetadata
   * @param schemaDef - The JSON input
   * @returns The resulting object
   */
  private static createEnumValueFrom(
    ext: EXTStructuralMetadata,
    enumValueDef: any
  ): EnumValue {
    const enumValue = ext.createEnumValue();

    if (enumValueDef.name !== undefined) {
      enumValue.setName(enumValueDef.name);
    }

    if (enumValueDef.description !== undefined) {
      enumValue.setDescription(enumValueDef.description);
    }

    if (enumValueDef.value !== undefined) {
      enumValue.setValue(enumValueDef.value);
    }

    return enumValue;
  }
}

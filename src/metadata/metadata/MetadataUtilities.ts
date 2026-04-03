import { defined } from "../../base";

import { Schema } from "../../structure";
import { ClassProperty } from "../../structure";
import { MetadataEnum } from "../../structure";

import { BinaryEnumInfo } from "./binary/BinaryEnumInfo";

/**
 * Internal utilities related to metadata
 *
 * @internal
 */
export class MetadataUtilities {
  /**
   * Computes the `BianaryEnumInfo` that summarizes information
   * about the binary representation of `MetadataEnum` values
   * from the given schema.
   *
   * @param schema - The metadata `Schema`
   * @returns The `BinaryEnumInfo`
   */
  static computeBinaryEnumInfo(schema: Schema): BinaryEnumInfo {
    const binaryEnumInfo: BinaryEnumInfo = {
      enumValueTypes: MetadataUtilities.computeEnumValueTypes(schema),
      enumValueNameValues: MetadataUtilities.computeEnumValueNameValues(schema),
      enumValueValueNames: MetadataUtilities.computeEnumValueValueNames(schema),
    };
    return binaryEnumInfo;
  }

  /**
   * Computes a mapping from enum type names to the `valueType` that
   * the respective `MetdataEnum` has (defaulting to `UINT16` if it
   * did not define one)
   *
   * @param schema - The metadata `Schema`
   * @returns The mapping from enum type names to enum value types
   */
  private static computeEnumValueTypes(schema: Schema): {
    [key: string]: string;
  } {
    const enumValueTypes: { [key: string]: string } = {};
    const enums = schema.enums;
    if (enums) {
      for (const enumName of Object.keys(enums)) {
        const metadataEnum = enums[enumName];
        const valueType = metadataEnum.valueType ?? "UINT16";
        enumValueTypes[enumName] = valueType;
      }
    }
    return enumValueTypes;
  }

  /**
   * Computes the value type of the enum that is represented with
   * the given class property.
   *
   * This assumes that the given schema and class property are
   * structurally valid: If the class property is not an ENUM
   * property, or the schema does not define enums, then
   * `undefined` is returned.
   *
   * Otherwise, the `valueType` of the respective enum is returned
   * (defaulting to `UINT16` if it did not define one).
   *
   * @param schema - The metadata `Schema`
   * @param classProperty - The `ClassProperty`
   * @returns The enum value type, or `undefined`.
   */
  static computeEnumValueType(
    schema: Schema,
    classProperty: ClassProperty
  ): string | undefined {
    const enumType = classProperty.enumType;
    if (enumType === undefined) {
      return undefined;
    }
    const enums = schema.enums;
    if (enums === undefined) {
      return undefined;
    }
    const metadataEnum = enums[enumType];
    const valueType = metadataEnum.valueType ?? "UINT16";
    return valueType;
  }

  /**
   * Computes a mapping from enum type names to the dictionaries
   * that map the enum values names to the enum value values.
   *
   * @param schema - The metadata `Schema`
   * @returns The mapping from enum type names to dictionaries
   */
  private static computeEnumValueNameValues(schema: Schema): {
    [key: string]: {
      [key: string]: number;
    };
  } {
    const enumValueNameValues: {
      [key: string]: {
        [key: string]: number;
      };
    } = {};
    const enums = schema.enums;
    if (enums) {
      for (const enumName of Object.keys(enums)) {
        const metadataEnum = enums[enumName];
        const nameValues =
          MetadataUtilities.computeMetadataEnumValueNameValues(metadataEnum);
        enumValueNameValues[enumName] = nameValues;
      }
    }
    return enumValueNameValues;
  }
  /**
   * Computes a mapping from enum values names to the enum value values
   * for the given metadata enum.
   *
   * @param metadataEnum - The metadata enum
   * @returns The mapping from enum value names to enum value values
   */
  static computeMetadataEnumValueNameValues(metadataEnum: MetadataEnum): {
    [key: string]: number;
  } {
    const nameValues: {
      [key: string]: number;
    } = {};
    for (let i = 0; i < metadataEnum.values.length; i++) {
      const enumValue = metadataEnum.values[i];
      const value = enumValue.value;
      const name = enumValue.name;
      nameValues[name] = value;
    }
    return nameValues;
  }

  /**
   * Computes a mapping from enum type names to the dictionaries
   * that map the enum value values to the enum value names.
   *
   * @param schema - The metadata `Schema`
   * @returns The mapping from enum type names to dictionaries
   */
  private static computeEnumValueValueNames(schema: Schema): {
    [key: string]: {
      [key: number]: string;
    };
  } {
    const enumValueValueNames: {
      [key: string]: {
        [key: number]: string;
      };
    } = {};
    const enums = schema.enums;
    if (enums) {
      for (const enumName of Object.keys(enums)) {
        const metadataEnum = enums[enumName];
        const valueNames =
          MetadataUtilities.computeMetadataEnumValueValueNames(metadataEnum);
        enumValueValueNames[enumName] = valueNames;
      }
    }
    return enumValueValueNames;
  }

  /**
   * Computes a mapping from enum value values to enum value names
   * for the given metadata enum.
   *
   * The name and comment look strange, but this is indeed the mapping from
   * `metadataEnum.values[i].value` to `metadataEnum.values[i].name` for
   * the given metadata enum.
   *
   * @param metadataEnum - The metadata enum
   * @returns The mapping from enum value values to enum value names.
   */
  static computeMetadataEnumValueValueNames(metadataEnum: MetadataEnum): {
    [key: number]: string;
  } {
    const valueNames: {
      [key: number]: string;
    } = {};
    for (let i = 0; i < metadataEnum.values.length; i++) {
      const enumValue = metadataEnum.values[i];
      const value = enumValue.value;
      const name = enumValue.name;
      valueNames[value] = name;
    }
    return valueNames;
  }

  /**
   * Internal method to obtain the names of enum values for the
   * given property.
   *
   * This tries to return the list of all
   * `schema.enums[classProperty.enumType].values[i].name`
   * values, returning the empty list if the property does not
   * have an enum type or any element is not defined.
   *
   * @param classProperty - The `ClassProperty`
   * @param schema - The `Schema`
   * @returns The enum value names
   */
  static obtainEnumValueNames(
    classProperty: ClassProperty,
    schema: Schema
  ): string[] {
    const type = classProperty.type;
    if (type !== "ENUM") {
      return [];
    }
    const enumType = classProperty.enumType;
    if (!defined(enumType)) {
      return [];
    }
    const enums = schema.enums;
    if (!enums) {
      return [];
    }
    const theEnum = enums[enumType];
    if (!defined(theEnum)) {
      return [];
    }
    const enumValues = theEnum.values;
    if (!enumValues) {
      return [];
    }
    const enumValueNames = enumValues.map((e: { name: string }) => e.name);
    return enumValueNames;
  }
}

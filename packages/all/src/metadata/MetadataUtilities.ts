import { defined } from "../base/defined";

import { BinaryEnumInfo } from "./binary/BinaryEnumInfo";

import { Schema } from "../structure/Metadata/Schema";
import { ClassProperty } from "../structure/Metadata/ClassProperty";

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
        const nameValues: {
          [key: string]: number;
        } = {};
        for (let i = 0; i < metadataEnum.values.length; i++) {
          const enumValue = metadataEnum.values[i];
          const value = enumValue.value;
          const name = enumValue.name;
          nameValues[name] = value;
        }
        enumValueNameValues[enumName] = nameValues;
      }
    }
    return enumValueNameValues;
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

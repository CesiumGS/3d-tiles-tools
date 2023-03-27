import { defined } from "../base/defined";
import { MetadataError } from "./MetadataError";

/**
 * Internal utilities related to the `componentType` of the
 * `ClassProperty` instances of `MetadataClass` objects
 *
 * @internal
 */
export class MetadataComponentTypes {
  /**
   * The valid values for the `class.property.componentType` property
   */
  static allComponentTypes: string[] = [
    "INT8",
    "UINT8",
    "INT16",
    "UINT16",
    "INT32",
    "UINT32",
    "INT64",
    "UINT64",
    "FLOAT32",
    "FLOAT64",
  ];

  /**
   * Integer component types.
   * These are the types for which a property can be `normalized`,
   * and the valid values for the `enum.valueType` property
   */
  static integerComponentTypes: string[] = [
    "INT8",
    "UINT8",
    "INT16",
    "UINT16",
    "INT32",
    "UINT32",
    "INT64",
    "UINT64",
  ];

  /**
   * Unsigned component types.
   */
  static unsignedComponentTypes: string[] = [
    "UINT8",
    "UINT16",
    "UINT32",
    "UINT64",
  ];

  /**
   * Returns whether the given component type is an integer component
   * type.
   *
   * @param componentType - The component type
   * @returns Whether the component type is an integer component type
   */
  static isIntegerComponentType(componentType: string | undefined) {
    if (!defined(componentType)) {
      return false;
    }
    return MetadataComponentTypes.integerComponentTypes.includes(componentType);
  }

  /**
   * Returns whether the given component type is an unsigned component
   * type.
   *
   * @param componentType - The component type
   * @returns Whether the component type is an unsigned component type
   */
  static isUnsignedComponentType(componentType: string | undefined) {
    if (!defined(componentType)) {
      return false;
    }
    return MetadataComponentTypes.unsignedComponentTypes.includes(
      componentType
    );
  }

  /**
   * Returns the size of the given component type in bytes
   *
   * @param componentType - The type
   * @returns The size in bytes
   * @throws MetadataError If the given component type is not
   * one of the `allComponentTypes`
   */
  static byteSizeForComponentType(componentType: string): number {
    switch (componentType) {
      case "INT8":
        return 1;
      case "UINT8":
        return 1;
      case "INT16":
        return 2;
      case "UINT16":
        return 2;
      case "INT32":
        return 4;
      case "UINT32":
        return 4;
      case "INT64":
        return 8;
      case "UINT64":
        return 8;
      case "FLOAT32":
        return 4;
      case "FLOAT64":
        return 8;
    }
    throw new MetadataError(`Invalid component type: ${componentType}`);
  }

  // Partially adapted from CesiumJS
  static normalize(value: number, componentType: string | undefined): number {
    if (MetadataComponentTypes.isIntegerComponentType(componentType)) {
      return Math.max(
        Number(value) /
          Number(MetadataComponentTypes.maximumValue(componentType)),
        -1.0
      );
    }
    return value;
  }

  // Partially adapted from CesiumJS
  private static maximumValue(
    componentType: string | undefined
  ): number | bigint | undefined {
    switch (componentType) {
      case "INT8":
        return 127;
      case "UINT8":
        return 255;
      case "INT16":
        return 32767;
      case "UINT16":
        return 65535;
      case "INT32":
        return 2147483647;
      case "UINT32":
        return 4294967295;
      case "INT64":
        return BigInt("9223372036854775807");
      case "UINT64":
        return BigInt("18446744073709551615");
      case "FLOAT32":
        return 340282346638528859811704183484516925440.0;
      case "FLOAT64":
        return Number.MAX_VALUE;
    }
    throw new MetadataError(`Invalid component type: ${componentType}`);
  }
}

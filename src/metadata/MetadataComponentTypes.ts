import { MetadataError } from "./MetadataError";

/**
 * Internal utilities related to the `componentType` of the
 * `ClassProperty` instances of `MetadataClass` objects
 *
 * @internal
 */
export class MetadataComponentTypes {
  public static readonly INT8 = "INT8";
  public static readonly UINT8 = "UINT8";
  public static readonly INT16 = "INT16";
  public static readonly UINT16 = "UINT16";
  public static readonly INT32 = "INT32";
  public static readonly UINT32 = "UINT32";
  public static readonly INT64 = "INT64";
  public static readonly UINT64 = "UINT64";
  public static readonly FLOAT32 = "FLOAT32";
  public static readonly FLOAT64 = "FLOAT64";

  /**
   * The valid values for the `class.property.componentType` property
   */
  static allComponentTypes: string[] = [
    MetadataComponentTypes.INT8,
    MetadataComponentTypes.UINT8,
    MetadataComponentTypes.INT16,
    MetadataComponentTypes.UINT16,
    MetadataComponentTypes.INT32,
    MetadataComponentTypes.UINT32,
    MetadataComponentTypes.INT64,
    MetadataComponentTypes.UINT64,
    MetadataComponentTypes.FLOAT32,
    MetadataComponentTypes.FLOAT64,
  ];

  /**
   * Integer component types.
   * These are the types for which a property can be `normalized`,
   * and the valid values for the `enum.valueType` property
   */
  static integerComponentTypes: string[] = [
    MetadataComponentTypes.INT8,
    MetadataComponentTypes.UINT8,
    MetadataComponentTypes.INT16,
    MetadataComponentTypes.UINT16,
    MetadataComponentTypes.INT32,
    MetadataComponentTypes.UINT32,
    MetadataComponentTypes.INT64,
    MetadataComponentTypes.UINT64,
  ];

  /**
   * Unsigned component types.
   */
  static unsignedComponentTypes: string[] = [
    MetadataComponentTypes.UINT8,
    MetadataComponentTypes.UINT16,
    MetadataComponentTypes.UINT32,
    MetadataComponentTypes.UINT64,
  ];

  /**
   * Returns whether the given component type is an integer component
   * type.
   *
   * @param componentType - The component type
   * @returns Whether the component type is an integer component type
   */
  static isIntegerComponentType(componentType: string | undefined) {
    if (componentType === undefined) {
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
    if (componentType === undefined) {
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
      case MetadataComponentTypes.INT8:
        return 1;
      case MetadataComponentTypes.UINT8:
        return 1;
      case MetadataComponentTypes.INT16:
        return 2;
      case MetadataComponentTypes.UINT16:
        return 2;
      case MetadataComponentTypes.INT32:
        return 4;
      case MetadataComponentTypes.UINT32:
        return 4;
      case MetadataComponentTypes.INT64:
        return 8;
      case MetadataComponentTypes.UINT64:
        return 8;
      case MetadataComponentTypes.FLOAT32:
        return 4;
      case MetadataComponentTypes.FLOAT64:
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
  ): number | bigint {
    switch (componentType) {
      case MetadataComponentTypes.INT8:
        return 127;
      case MetadataComponentTypes.UINT8:
        return 255;
      case MetadataComponentTypes.INT16:
        return 32767;
      case MetadataComponentTypes.UINT16:
        return 65535;
      case MetadataComponentTypes.INT32:
        return 2147483647;
      case MetadataComponentTypes.UINT32:
        return 4294967295;
      case MetadataComponentTypes.INT64:
        return BigInt("9223372036854775807");
      case MetadataComponentTypes.UINT64:
        return BigInt("18446744073709551615");
      case MetadataComponentTypes.FLOAT32:
        return 340282346638528859811704183484516925440.0;
      case MetadataComponentTypes.FLOAT64:
        return Number.MAX_VALUE;
    }
    throw new MetadataError(`Invalid component type: ${componentType}`);
  }

  // Partially adapted from CesiumJS
  private static minimumValue(
    componentType: string | undefined
  ): number | bigint {
    switch (componentType) {
      case MetadataComponentTypes.INT8:
        return -128;
      case MetadataComponentTypes.UINT8:
        return 0;
      case MetadataComponentTypes.INT16:
        return -32768;
      case MetadataComponentTypes.UINT16:
        return 0;
      case MetadataComponentTypes.INT32:
        return -2147483648;
      case MetadataComponentTypes.UINT32:
        return 0;
      case MetadataComponentTypes.INT64:
        return BigInt("-9223372036854775808");
      case MetadataComponentTypes.UINT64:
        return BigInt(0);
      case MetadataComponentTypes.FLOAT32:
        return -340282346638528859811704183484516925440.0;
      case MetadataComponentTypes.FLOAT64:
        return -Number.MAX_VALUE;
    }
    throw new MetadataError(`Invalid component type: ${componentType}`);
  }
}

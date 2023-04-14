import { MetadataError } from "./MetadataError";

/**
 * Internal utilities related to the `type` of the
 * `ClassProperty` instances of `MetadataClass` objects
 *
 * @internal
 */
export class MetadataTypes {
  /**
   * The valid values for the `class.property.type` property
   */
  static allTypes: string[] = [
    "SCALAR",
    "VEC2",
    "VEC3",
    "VEC4",
    "MAT2",
    "MAT3",
    "MAT4",
    "STRING",
    "BOOLEAN",
    "ENUM",
  ];

  /**
   * The valid values for the `class.property.type` property
   * that count as "numeric" types. These are the ones where
   * a `class.property.componentType` is given
   */
  static numericTypes: string[] = [
    "SCALAR",
    "VEC2",
    "VEC3",
    "VEC4",
    "MAT2",
    "MAT3",
    "MAT4",
  ];

  /**
   * Returns whether the given type is numeric, i.e. whether
   * it is SCALAR, VECn, or MATn.
   *
   * @param type - The type
   * @returns Whether the type is numeric
   */
  static isNumericType(type: string) {
    return MetadataTypes.numericTypes.includes(type);
  }

  /**
   * Returns the number of components for the given type
   *
   * @param type - The type
   * @returns The number of components
   * @throws MetadataError If the given string is not one
   * of the types contained in `allTypes`
   */
  static componentCountForType(type: string): number {
    switch (type) {
      case "SCALAR":
      case "STRING":
      case "ENUM":
      case "BOOLEAN":
        return 1;
      case "VEC2":
        return 2;
      case "VEC3":
        return 3;
      case "VEC4":
        return 4;
      case "MAT2":
        return 4;
      case "MAT3":
        return 9;
      case "MAT4":
        return 16;
    }
    throw new MetadataError(`Invalid type: ${type}`);
  }
}

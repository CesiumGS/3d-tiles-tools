import { defined } from "../../base";

import { ClassProperty } from "../../structure";

import { MetadataTypes } from "./MetadataTypes";
import { MetadataComponentTypes } from "./MetadataComponentTypes";

/**
 * Utility methods related to `ClassProperty` objects
 *
 * @internal
 */
export class ClassProperties {
  /**
   * Returns whether the given property effectively describes a floating
   * point type.
   *
   * These are the properties for which 'offset' and 'scale' may be defined.
   *
   * This means that the value has the type SCALAR, VECn, or MATn, and
   * - either has the componentType FLOAT32 or FLOAT46
   * - or has an integer component type AND is 'normalized'
   *
   * @param property - The property
   * @returns Whether the property is a floating point property
   */
  static hasEffectivelyFloatingPointType(property: ClassProperty): boolean {
    const type = property.type;
    if (!MetadataTypes.numericTypes.includes(type)) {
      return false;
    }
    const componentType = property.componentType;
    if (!defined(componentType)) {
      return false;
    }
    if (componentType === "FLOAT32" || componentType === "FLOAT64") {
      return true;
    }
    if (MetadataComponentTypes.isIntegerComponentType(componentType)) {
      const normalized = property.normalized;
      if (!defined(normalized)) {
        return false;
      }
      return normalized;
    }
    return false;
  }

  /**
   * Returns whether the given property describes a numeric type.
   *
   * These are the properties for which 'max' and 'min' may be defined.
   *
   * This means tha the value has the type SCALAR, VECn, or MATn, and
   * one of the allowed component types.
   *
   * @param property - The property
   * @returns Whether the property is a numeric property
   */
  static hasNumericType(property: ClassProperty): boolean {
    const type = property.type;
    if (!MetadataTypes.numericTypes.includes(type)) {
      return false;
    }
    const componentType = property.componentType;
    if (!defined(componentType)) {
      return false;
    }
    if (!MetadataComponentTypes.allComponentTypes.includes(componentType)) {
      return false;
    }
    return true;
  }
}

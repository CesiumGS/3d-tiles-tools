import { defined } from "../base/defined";

import { ClassProperty } from "../structure/Metadata/ClassProperty";

import { MetadataComponentTypes } from "./MetadataComponentTypes";
import { ArrayValues } from "./ArrayValues";

/**
 * Internal methods related to metadata values.
 *
 * @internal
 */
export class MetadataValues {
  /**
   * Processes the given "raw" value that was obtained for a metadata
   * property (e.g. from the JSON representation), and returns the
   * processed value according to the type definition that is given
   * by the given class property.
   *
   * If the type defines a `noData` value, and the given value
   * is the `noData` value, then the `default` value of the type
   * is returned.
   *
   * If the type defines the value to be `normalized`, then the
   * normalization is applied to the given values.
   *
   * If the type defines an `offset`, then the offset is added
   * to the value.
   *
   * If the type defines a `scale`, then this is multiplied
   * with the value.
   *
   * @param classProperty - The `ClassProperty`
   * @param offsetOverride -: An optional override for the
   * `offset` of the `ClassProperty`. If this is defined, then
   * it will be used instead of the one from the class property.
   * @param scaleOverride -: An optional override for the
   * `scale` of the `ClassProperty`. If this is defined, then
   * it will be used instead of the one from the class property.
   * @param value - The value
   * @returns The processed value
   */
  static processValue(
    classProperty: ClassProperty,
    offsetOverride: any,
    scaleOverride: any,
    value: any
  ): any {
    const noData = classProperty.noData;
    const defaultValue = classProperty.default;
    if (defined(noData)) {
      if (ArrayValues.deepEquals(value, noData)) {
        return ArrayValues.deepClone(defaultValue);
      }
    }
    if (!defined(value)) {
      return ArrayValues.deepClone(defaultValue);
    }
    value = ArrayValues.deepClone(value);

    if (classProperty.normalized === true) {
      const componentType = classProperty.componentType;
      value = MetadataValues.normalize(value, componentType);
    }
    const offset = defined(offsetOverride)
      ? offsetOverride
      : classProperty.offset;
    const scale = defined(scaleOverride) ? scaleOverride : classProperty.scale;

    if (defined(scale)) {
      value = ArrayValues.deepMultiply(value, scale);
    }
    if (defined(offset)) {
      value = ArrayValues.deepAdd(value, offset);
    }
    return value;
  }

  /**
   * Normalize the given input value, based on the given component type.
   *
   * If example, the value of `255` for `UINT8` will be normalized to `1.0`.
   *
   * @param value - The input value
   * @param componentType - The component type
   * @returns The normalized value
   */
  private static normalize(value: any, componentType: string | undefined): any {
    if (!Array.isArray(value)) {
      return MetadataComponentTypes.normalize(value, componentType);
    }
    for (let i = 0; i < value.length; i++) {
      value[i] = MetadataValues.normalize(value[i], componentType);
    }
    return value;
  }
}

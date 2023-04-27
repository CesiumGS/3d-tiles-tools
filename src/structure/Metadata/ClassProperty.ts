import { RootProperty } from "../RootProperty";

/**
 * A single property of a metadata class.
 * @internal
 */
export interface ClassProperty extends RootProperty {
  /**
   * The name of the property e.g. for display purposes.
   */
  name?: string;

  /**
   * The description of the property.
   */
  description?: string;

  /**
   * The element type.
   */
  type: string;

  /**
   * The datatype of the element's components. Required for `SCALAR` `VECN`
   * and `MATN` types and disallowed for other types.
   */
  componentType?: string;

  /**
   * Enum ID as declared in the `enums` dictionary. Required when `type` is
   * `ENUM`. Disallowed when `type` is not `ENUM`
   */
  enumType?: string;

  /**
   * Whether the property is an array. When `count` is defined the property
   * is a fixed-length array. Otherwise the property is a variable-length
   * array.
   */
  array?: boolean;

  /**
   * The number of array elements. May only be defined when `array` is
   * `true`.
   */
  count?: number;

  /**
   * Specifies whether integer values are normalized. Only applicable to
   * `SCALAR` `VECN` and `MATN` types with integer component types. For
   * unsigned integer component types values are normalized between
   * `[0.0 1.0]`. For signed integer component types values are normalized
   * between `[-1.0 1.0]`. For all other component types this property
   * shall be false.
   */
  normalized?: boolean;

  /**
   * An offset to apply to property values. Only applicable to `SCALAR`
   * `VECN` and `MATN` types when the component type is `FLOAT32` or
   * `FLOAT64` or when the property is `normalized`. Not applicable to
   * variable-length arrays.
   */
  offset?: any;

  /**
   * A scale to apply to property values. Only applicable to `SCALAR`
   * `VECN` and `MATN` types when the component type is `FLOAT32` or
   * `FLOAT64` or when the property is `normalized`. Not applicable to
   * variable-length arrays.
   */
  scale?: any;

  /**
   * Maximum allowed value for the property. Only applicable to `SCALAR`
   * `VECN` and `MATN` types. This is the maximum of all property values
   * after the transforms based on the `normalized` `offset` and `scale`
   * properties have been applied. Not applicable to variable-length
   * arrays.
   */
  max?: any;

  /**
   * Minimum allowed value for the property. Only applicable to `SCALAR`
   * `VECN` and `MATN` types. This is the minimum of all property values
   * after the transforms based on the `normalized` `offset` and `scale`
   * properties have been applied. Not applicable to variable-length
   * arrays.
   */
  min?: any;

  /**
   * If required the property shall be present in every entity conforming
   * to the class. If not required individual entities may include `noData`
   * values or the entire property may be omitted. As a result `noData` has
   * no effect on a required property. Client implementations may use
   * required properties to make performance optimizations.
   */
  required?: boolean;

  /**
   * A `noData` value represents missing data — also known as a sentinel
   * value — wherever it appears. `BOOLEAN` properties may not specify
   * `noData` values. This is given as the plain property value without the
   * transforms from the `normalized` `offset` and `scale` properties.
   * Shall not be defined if `required` is true.
   */
  noData?: any;

  /**
   * A default value to use when encountering a `noData` value or an
   * omitted property. The value is given in its final form taking the
   * effect of `normalized` `offset` and `scale` properties into account.
   * Shall not be defined if `required` is true.
   */
  default?: any;

  /**
   * An identifier that describes how this property should be interpreted.
   * The semantic cannot be used by other properties in the class.
   */
  semantic?: string;
}

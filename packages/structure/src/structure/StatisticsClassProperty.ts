import { RootProperty } from "./RootProperty";

/**
 * Statistics about property values.
 * @internal
 */
export interface StatisticsClassProperty extends RootProperty {
  /**
   * The minimum property value occurring in the tileset. Only applicable
   * to `SCALAR` `VECN` and `MATN` types. This is the minimum of all
   * property values after the transforms based on the `normalized`
   * `offset` and `scale` properties have been applied.
   */
  min?: any;

  /**
   * The maximum property value occurring in the tileset. Only applicable
   * to `SCALAR` `VECN` and `MATN` types. This is the maximum of all
   * property values after the transforms based on the `normalized`
   * `offset` and `scale` properties have been applied.
   */
  max?: any;

  /**
   * The arithmetic mean of property values occurring in the tileset. Only
   * applicable to `SCALAR` `VECN` and `MATN` types. This is the mean of
   * all property values after the transforms based on the `normalized`
   * `offset` and `scale` properties have been applied.
   */
  mean?: any;

  /**
   * The median of property values occurring in the tileset. Only
   * applicable to `SCALAR` `VECN` and `MATN` types. This is the median of
   * all property values after the transforms based on the `normalized`
   * `offset` and `scale` properties have been applied.
   */
  median?: any;

  /**
   * The standard deviation of property values occurring in the tileset.
   * Only applicable to `SCALAR` `VECN` and `MATN` types. This is the
   * standard deviation of all property values after the transforms based
   * on the `normalized` `offset` and `scale` properties have been applied.
   */
  standardDeviation?: any;

  /**
   * The variance of property values occurring in the tileset. Only
   * applicable to `SCALAR` `VECN` and `MATN` types. This is the variance
   * of all property values after the transforms based on the `normalized`
   * `offset` and `scale` properties have been applied.
   */
  variance?: any;

  /**
   * The sum of property values occurring in the tileset. Only applicable
   * to `SCALAR` `VECN` and `MATN` types. This is the sum of all property
   * values after the transforms based on the `normalized` `offset` and
   * `scale` properties have been applied.
   */
  sum?: any;

  /**
   * A dictionary where each key corresponds to an enum `name` and each
   * value is the number of occurrences of that enum. Only applicable when
   * `type` is `ENUM`. For fixed-length arrays this is an array of
   * component-wise occurrences.
   */
  occurrences?: { [key: string]: any };
}

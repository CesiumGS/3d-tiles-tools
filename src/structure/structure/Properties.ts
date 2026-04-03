import { RootProperty } from "./RootProperty";

/**
 * A dictionary object of metadata about per-feature properties.
 * @internal
 */
export interface Properties extends RootProperty {
  /**
   * The maximum value of this property of all the features in the tileset.
   * The maximum value shall not be larger than the minimum value.
   */
  maximum: number;

  /**
   * The minimum value of this property of all the features in the tileset.
   * The maximum value shall not be larger than the minimum value.
   */
  minimum: number;
}

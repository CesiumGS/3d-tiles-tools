import { RootProperty } from "../RootProperty";

/**
 * A 3D Tiles style.
 * @internal
 */
export interface Style extends RootProperty {
  /**
   * A dictionary object of `expression` strings mapped to a variable name
   * key that may be referenced throughout the style. If an expression
   * references a defined variable it is replaced with the evaluated result
   * of the corresponding expression.
   */
  defines?: { [key: string]: string };

  /**
   * A `boolean expression` or `conditions` property which determines if a
   * feature should be shown.
   */
  show?: string | string[];

  /**
   * A `color expression` or `conditions` property which determines the
   * color blended with the feature's intrinsic color.
   */
  color?: string | string[];

  /**
   * A `meta` object which determines the values of non-visual properties
   * of the feature.
   */
  meta?: { [key: string]: string };
}

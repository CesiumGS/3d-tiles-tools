import { RootProperty } from "./RootProperty";
import { PropertyTableProperty } from "./PropertyTableProperty";

/**
 * Properties conforming to a class organized as property values stored
 * in binary columnar arrays.
 * @internal
 */
export interface PropertyTable extends RootProperty {
  /**
   * The name of the property table e.g. for display purposes.
   */
  name?: string;

  /**
   * The class that property values conform to. The value shall be a class
   * ID declared in the `classes` dictionary.
   */
  class: string;

  /**
   * The number of elements in each property array.
   */
  count: number;

  /**
   * A dictionary where each key corresponds to a property ID in the class'
   * `properties` dictionary and each value is an object describing where
   * property values are stored. Required properties shall be included in
   * this dictionary.
   */
  properties?: { [key: string]: PropertyTableProperty };
}

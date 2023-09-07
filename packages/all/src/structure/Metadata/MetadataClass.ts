import { RootProperty } from "../RootProperty";
import { ClassProperty } from "./ClassProperty";

/**
 * A class containing a set of properties.
 * @internal
 */
export interface MetadataClass extends RootProperty {
  /**
   * The name of the class e.g. for display purposes.
   */
  name?: string;

  /**
   * The description of the class.
   */
  description?: string;

  /**
   * A dictionary where each key is a property ID and each value is an
   * object defining the property. Property IDs shall be alphanumeric
   * identifiers matching the regular expression
   * `^[a-zA-Z_][a-zA-Z0-9_]*$`.
   */
  properties?: { [key: string]: ClassProperty };
}

import { RootProperty } from "../RootProperty";
import { EnumValue } from "./EnumValue";

/**
 * An object defining the values of an enum.
 * @internal
 */
export interface MetadataEnum extends RootProperty {
  /**
   * The name of the enum e.g. for display purposes.
   */
  name?: string;

  /**
   * The description of the enum.
   */
  description?: string;

  /**
   * The type of the integer enum value.
   */
  valueType?: string;

  /**
   * An array of enum values. Duplicate names or duplicate integer values
   * are not allowed.
   */
  values: EnumValue[];
}

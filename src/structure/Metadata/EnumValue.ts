import { RootProperty } from "../RootProperty";

/**
 * An enum value.
 * @internal
 */
export interface EnumValue extends RootProperty {
  /**
   * The name of the enum value.
   */
  name: string;

  /**
   * The description of the enum value.
   */
  description?: string;

  /**
   * The integer enum value.
   */
  value: number;
}

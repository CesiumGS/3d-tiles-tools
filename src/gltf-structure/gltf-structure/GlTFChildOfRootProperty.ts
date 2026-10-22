import { GlTFProperty } from "./GlTFProperty";

/**
 * glTF Child of Root Property
 *
 * @internal
 */
export interface GlTFChildOfRootProperty extends GlTFProperty {
  /**
   * The user-defined name of this object.
   */
  name?: string;
}

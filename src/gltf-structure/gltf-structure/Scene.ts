import { GlTFChildOfRootProperty } from "./GlTFChildOfRootProperty";
import { GlTFid } from "./GlTFid";

/**
 * The root nodes of a scene.
 * @internal
 */
export interface Scene extends GlTFChildOfRootProperty {
  /**
   * The indices of each root node.
   */
  nodes?: GlTFid[];
}

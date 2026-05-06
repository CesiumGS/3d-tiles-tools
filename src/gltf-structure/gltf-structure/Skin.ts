import { GlTFChildOfRootProperty } from "./GlTFChildOfRootProperty";
import { GlTFid } from "./GlTFid";

/**
 * Joints and matrices defining a skin.
 * @internal
 */
export interface Skin extends GlTFChildOfRootProperty {
  /**
   * The index of the accessor containing the floating-point 4x4
   * inverse-bind matrices.
   */
  inverseBindMatrices?: GlTFid;

  /**
   * The index of the node used as a skeleton root.
   */
  skeleton?: GlTFid;

  /**
   * Indices of skeleton nodes used as joints in this skin.
   */
  joints: GlTFid[];
}

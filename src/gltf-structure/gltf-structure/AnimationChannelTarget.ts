import { GlTFProperty } from "./GlTFProperty";
import { GlTFid } from "./GlTFid";

/**
 * The descriptor of the animated property.
 * @internal
 */
export interface AnimationChannelTarget extends GlTFProperty {
  /**
   * The index of the node to animate. When undefined the animated object
   * **MAY** be defined by an extension.
   */
  node?: GlTFid;

  /**
   * The name of the node's TRS property to animate or the `"weights"` of
   * the Morph Targets it instantiates. For the `"translation"` property
   * the values that are provided by the sampler are the translation along
   * the X Y and Z axes. For the `"rotation"` property the values are a
   * quaternion in the order (x y z w) where w is the scalar. For the
   * `"scale"` property the values are the scaling factors along the X Y
   * and Z axes.
   */
  path: string;
}

import { GlTFProperty } from "./GlTFProperty";
import { GlTFid } from "./GlTFid";
import { AnimationChannelTarget } from "./AnimationChannelTarget";

/**
 * An animation channel combines an animation sampler with a target
 * property being animated.
 * @internal
 */
export interface AnimationChannel extends GlTFProperty {
  /**
   * The index of a sampler in this animation used to compute the value for
   * the target.
   */
  sampler: GlTFid;

  /**
   * The descriptor of the animated property.
   */
  target: AnimationChannelTarget;
}

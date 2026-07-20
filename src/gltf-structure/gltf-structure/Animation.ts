import { GlTFChildOfRootProperty } from "./GlTFChildOfRootProperty";
import { AnimationChannel } from "./AnimationChannel";
import { AnimationSampler } from "./AnimationSampler";

/**
 * A keyframe animation.
 * @internal
 */
export interface Animation extends GlTFChildOfRootProperty {
  /**
   * An array of animation channels. An animation channel combines an
   * animation sampler with a target property being animated. Different
   * channels of the same animation **MUST NOT** have the same targets.
   */
  channels: AnimationChannel[];

  /**
   * An array of animation samplers. An animation sampler combines
   * timestamps with a sequence of output values and defines an
   * interpolation algorithm.
   */
  samplers: AnimationSampler[];
}

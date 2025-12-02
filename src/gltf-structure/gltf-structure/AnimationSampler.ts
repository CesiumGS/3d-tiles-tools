import { GlTFProperty } from "./GlTFProperty";
import { GlTFid } from "./GlTFid";

/**
 * An animation sampler combines timestamps with a sequence of output
 * values and defines an interpolation algorithm.
 * @internal
 */
export interface AnimationSampler extends GlTFProperty {
  /**
   * The index of an accessor containing keyframe timestamps.
   */
  input: GlTFid;

  /**
   * Interpolation algorithm.
   */
  interpolation?: string;

  /**
   * The index of an accessor containing keyframe output values.
   */
  output: GlTFid;
}

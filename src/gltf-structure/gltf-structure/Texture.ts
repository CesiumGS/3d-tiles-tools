import { GlTFChildOfRootProperty } from "./GlTFChildOfRootProperty";
import { GlTFid } from "./GlTFid";

/**
 * A texture and its sampler.
 * @internal
 */
export interface Texture extends GlTFChildOfRootProperty {
  /**
   * The index of the sampler used by this texture. When undefined a
   * sampler with repeat wrapping and auto filtering **SHOULD** be used.
   */
  sampler?: GlTFid;

  /**
   * The index of the image used by this texture. When undefined an
   * extension or other mechanism **SHOULD** supply an alternate texture
   * source otherwise behavior is undefined.
   */
  source?: GlTFid;
}

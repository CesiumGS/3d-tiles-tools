import { GlTFChildOfRootProperty } from "./GlTFChildOfRootProperty";

/**
 * Texture sampler properties for filtering and wrapping modes.
 * @internal
 */
export interface Sampler extends GlTFChildOfRootProperty {
  /**
   * Magnification filter.
   */
  magFilter?: number;

  /**
   * Minification filter.
   */
  minFilter?: number;

  /**
   * S (U) wrapping mode.
   */
  wrapS?: number;

  /**
   * T (V) wrapping mode.
   */
  wrapT?: number;
}

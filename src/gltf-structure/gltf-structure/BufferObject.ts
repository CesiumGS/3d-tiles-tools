import { GlTFChildOfRootProperty } from "./GlTFChildOfRootProperty";

/**
 * A buffer points to binary geometry animation or skins.
 * @internal
 */
export interface BufferObject extends GlTFChildOfRootProperty {
  /**
   * The URI (or IRI) of the buffer.
   */
  uri?: string;

  /**
   * The length of the buffer in bytes.
   */
  byteLength: number;
}

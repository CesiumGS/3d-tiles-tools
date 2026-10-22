import { GlTFProperty } from "./GlTFProperty";
import { GlTFid } from "./GlTFid";

/**
 * Reference to a texture.
 * @internal
 */
export interface TextureInfo extends GlTFProperty {
  /**
   * The index of the texture.
   */
  index: GlTFid;

  /**
   * The set index of texture's TEXCOORD attribute used for texture
   * coordinate mapping.
   */
  texCoord?: number;
}

import { TextureInfo } from "./TextureInfo";

/**
 * @internal
 */
export interface MaterialNormalTextureInfo extends TextureInfo {
  /**
   * The scalar parameter applied to each normal vector of the normal
   * texture.
   */
  scale?: number;
}

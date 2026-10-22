import { TextureInfo } from "./TextureInfo";

/**
 * @internal
 */
export interface MaterialOcclusionTextureInfo extends TextureInfo {
  /**
   * A scalar multiplier controlling the amount of occlusion applied.
   */
  strength?: number;
}

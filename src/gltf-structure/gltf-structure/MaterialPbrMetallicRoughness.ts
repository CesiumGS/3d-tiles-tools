import { GlTFProperty } from "./GlTFProperty";
import { TextureInfo } from "./TextureInfo";

/**
 * A set of parameter values that are used to define the
 * metallic-roughness material model from Physically-Based Rendering
 * (PBR) methodology.
 * @internal
 */
export interface MaterialPbrMetallicRoughness extends GlTFProperty {
  /**
   * The factors for the base color of the material.
   */
  baseColorFactor?: number[];

  /**
   * The base color texture.
   */
  baseColorTexture?: TextureInfo;

  /**
   * The factor for the metalness of the material.
   */
  metallicFactor?: number;

  /**
   * The factor for the roughness of the material.
   */
  roughnessFactor?: number;

  /**
   * The metallic-roughness texture.
   */
  metallicRoughnessTexture?: TextureInfo;
}

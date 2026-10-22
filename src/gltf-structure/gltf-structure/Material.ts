import { GlTFChildOfRootProperty } from "./GlTFChildOfRootProperty";
import { MaterialPbrMetallicRoughness } from "./MaterialPbrMetallicRoughness";
import { MaterialNormalTextureInfo } from "./MaterialNormalTextureInfo";
import { MaterialOcclusionTextureInfo } from "./MaterialOcclusionTextureInfo";
import { TextureInfo } from "./TextureInfo";

/**
 * The material appearance of a primitive.
 * @internal
 */
export interface Material extends GlTFChildOfRootProperty {
  /**
   * A set of parameter values that are used to define the
   * metallic-roughness material model from Physically Based Rendering
   * (PBR) methodology. When undefined all the default values of
   * `pbrMetallicRoughness` **MUST** apply.
   */
  pbrMetallicRoughness?: MaterialPbrMetallicRoughness;

  /**
   * The tangent space normal texture.
   */
  normalTexture?: MaterialNormalTextureInfo;

  /**
   * The occlusion texture.
   */
  occlusionTexture?: MaterialOcclusionTextureInfo;

  /**
   * The emissive texture.
   */
  emissiveTexture?: TextureInfo;

  /**
   * The factors for the emissive color of the material.
   */
  emissiveFactor?: number[];

  /**
   * The alpha rendering mode of the material.
   */
  alphaMode?: string;

  /**
   * The alpha cutoff value of the material.
   */
  alphaCutoff?: number;

  /**
   * Specifies whether the material is double sided.
   */
  doubleSided?: boolean;
}

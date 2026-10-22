import { GlTFProperty } from "./GlTFProperty";

/**
 * A perspective camera containing properties to create a perspective
 * projection matrix.
 * @internal
 */
export interface CameraPerspective extends GlTFProperty {
  /**
   * The floating-point aspect ratio of the field of view.
   */
  aspectRatio?: number;

  /**
   * The floating-point vertical field of view in radians. This value
   * **SHOULD** be less than π.
   */
  yfov: number;

  /**
   * The floating-point distance to the far clipping plane.
   */
  zfar?: number;

  /**
   * The floating-point distance to the near clipping plane.
   */
  znear: number;
}

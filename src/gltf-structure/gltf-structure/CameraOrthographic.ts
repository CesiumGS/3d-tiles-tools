import { GlTFProperty } from "./GlTFProperty";

/**
 * An orthographic camera containing properties to create an orthographic
 * projection matrix.
 * @internal
 */
export interface CameraOrthographic extends GlTFProperty {
  /**
   * The floating-point horizontal magnification of the view. This value
   * **MUST NOT** be equal to zero. This value **SHOULD NOT** be negative.
   */
  xmag: number;

  /**
   * The floating-point vertical magnification of the view. This value
   * **MUST NOT** be equal to zero. This value **SHOULD NOT** be negative.
   */
  ymag: number;

  /**
   * The floating-point distance to the far clipping plane. This value
   * **MUST NOT** be equal to zero. `zfar` **MUST** be greater than
   * `znear`.
   */
  zfar: number;

  /**
   * The floating-point distance to the near clipping plane.
   */
  znear: number;
}

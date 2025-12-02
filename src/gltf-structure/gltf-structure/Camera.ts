import { GlTFChildOfRootProperty } from "./GlTFChildOfRootProperty";
import { CameraOrthographic } from "./CameraOrthographic";
import { CameraPerspective } from "./CameraPerspective";

/**
 * A camera's projection. A node **MAY** reference a camera to apply a
 * transform to place the camera in the scene.
 * @internal
 */
export interface Camera extends GlTFChildOfRootProperty {
  /**
   * An orthographic camera containing properties to create an orthographic
   * projection matrix. This property **MUST NOT** be defined when
   * `perspective` is defined.
   */
  orthographic?: CameraOrthographic;

  /**
   * A perspective camera containing properties to create a perspective
   * projection matrix. This property **MUST NOT** be defined when
   * `orthographic` is defined.
   */
  perspective?: CameraPerspective;

  /**
   * Specifies if the camera uses a perspective or orthographic projection.
   */
  type: string;
}

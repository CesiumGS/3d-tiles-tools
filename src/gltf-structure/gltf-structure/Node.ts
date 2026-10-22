import { GlTFChildOfRootProperty } from "./GlTFChildOfRootProperty";
import { GlTFid } from "./GlTFid";

/**
 * A node in the node hierarchy. When the node contains `skin` all
 * `mesh.primitives` **MUST** contain `JOINTS_0` and `WEIGHTS_0`
 * attributes. A node **MAY** have either a `matrix` or any combination
 * of `translation`/`rotation`/`scale` (TRS) properties. TRS properties
 * are converted to matrices and postmultiplied in the `T * R * S` order
 * to compose the transformation matrix; first the scale is applied to
 * the vertices then the rotation and then the translation. If none are
 * provided the transform is the identity. When a node is targeted for
 * animation (referenced by an animation.channel.target) `matrix` **MUST
 * NOT** be present.
 * @internal
 */
export interface Node extends GlTFChildOfRootProperty {
  /**
   * The index of the camera referenced by this node.
   */
  camera?: GlTFid;

  /**
   * The indices of this node's children.
   */
  children?: GlTFid[];

  /**
   * The index of the skin referenced by this node.
   */
  skin?: GlTFid;

  /**
   * A floating-point 4x4 transformation matrix stored in column-major
   * order.
   */
  matrix?: number[];

  /**
   * The index of the mesh in this node.
   */
  mesh?: GlTFid;

  /**
   * The node's unit quaternion rotation in the order (x y z w) where w is
   * the scalar.
   */
  rotation?: number[];

  /**
   * The node's non-uniform scale given as the scaling factors along the x
   * y and z axes.
   */
  scale?: number[];

  /**
   * The node's translation along the x y and z axes.
   */
  translation?: number[];

  /**
   * The weights of the instantiated morph target. The number of array
   * elements **MUST** match the number of morph targets of the referenced
   * mesh. When defined `mesh` **MUST** also be defined.
   */
  weights?: number[];
}

import { GlTFChildOfRootProperty } from "./GlTFChildOfRootProperty";
import { MeshPrimitive } from "./MeshPrimitive";

/**
 * A set of primitives to be rendered. Its global transform is defined by
 * a node that references it.
 * @internal
 */
export interface Mesh extends GlTFChildOfRootProperty {
  /**
   * An array of primitives each defining geometry to be rendered.
   */
  primitives: MeshPrimitive[];

  /**
   * Array of weights to be applied to the morph targets. The number of
   * array elements **MUST** match the number of morph targets.
   */
  weights?: number[];
}

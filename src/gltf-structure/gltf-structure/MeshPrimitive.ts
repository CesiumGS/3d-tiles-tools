import { GlTFProperty } from "./GlTFProperty";
import { GlTFid } from "./GlTFid";

/**
 * Geometry to be rendered with the given material.
 * @internal
 */
export interface MeshPrimitive extends GlTFProperty {
  /**
   * A plain JSON object where each key corresponds to a mesh attribute
   * semantic and each value is the index of the accessor containing
   * attribute's data.
   */
  attributes: { [key: string]: GlTFid };

  /**
   * The index of the accessor that contains the vertex indices.
   */
  indices?: GlTFid;

  /**
   * The index of the material to apply to this primitive when rendering.
   */
  material?: GlTFid;

  /**
   * The topology type of primitives to render.
   */
  mode?: number;

  /**
   * An array of morph targets.
   */
  targets?: object[];
}

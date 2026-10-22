import { GlTFChildOfRootProperty } from "./GlTFChildOfRootProperty";
import { GlTFid } from "./GlTFid";
import { AccessorSparse } from "./AccessorSparse";

/**
 * A typed view into a buffer view that contains raw binary data.
 * @internal
 */
export interface Accessor extends GlTFChildOfRootProperty {
  /**
   * The index of the bufferView.
   */
  bufferView?: GlTFid;

  /**
   * The offset relative to the start of the buffer view in bytes.
   */
  byteOffset?: number;

  /**
   * The datatype of the accessor's components.
   */
  componentType: number;

  /**
   * Specifies whether integer data values are normalized before usage.
   */
  normalized?: boolean;

  /**
   * The number of elements referenced by this accessor.
   */
  count: number;

  /**
   * Specifies if the accessor's elements are scalars vectors or matrices.
   */
  type: string;

  /**
   * Maximum value of each component in this accessor.
   */
  max?: number[];

  /**
   * Minimum value of each component in this accessor.
   */
  min?: number[];

  /**
   * Sparse storage of elements that deviate from their initialization
   * value.
   */
  sparse?: AccessorSparse;
}

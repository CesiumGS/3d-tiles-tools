import { GlTFProperty } from "./GlTFProperty";
import { GlTFid } from "./GlTFid";

/**
 * An object pointing to a buffer view containing the indices of
 * deviating accessor values. The number of indices is equal to
 * `accessor.sparse.count`. Indices **MUST** strictly increase.
 * @internal
 */
export interface AccessorSparseIndices extends GlTFProperty {
  /**
   * The index of the buffer view with sparse indices. The referenced
   * buffer view **MUST NOT** have its `target` or `byteStride` properties
   * defined. The buffer view and the optional `byteOffset` **MUST** be
   * aligned to the `componentType` byte length.
   */
  bufferView: GlTFid;

  /**
   * The offset relative to the start of the buffer view in bytes.
   */
  byteOffset?: number;

  /**
   * The indices data type.
   */
  componentType: number;
}

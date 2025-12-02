import { GlTFProperty } from "./GlTFProperty";
import { GlTFid } from "./GlTFid";

/**
 * An object pointing to a buffer view containing the deviating accessor
 * values. The number of elements is equal to `accessor.sparse.count`
 * times number of components. The elements have the same component type
 * as the base accessor. The elements are tightly packed. Data **MUST**
 * be aligned following the same rules as the base accessor.
 * @internal
 */
export interface AccessorSparseValues extends GlTFProperty {
  /**
   * The index of the bufferView with sparse values. The referenced buffer
   * view **MUST NOT** have its `target` or `byteStride` properties
   * defined.
   */
  bufferView: GlTFid;

  /**
   * The offset relative to the start of the bufferView in bytes.
   */
  byteOffset?: number;
}

import { GlTFProperty } from "./GlTFProperty";
import { AccessorSparseIndices } from "./AccessorSparseIndices";
import { AccessorSparseValues } from "./AccessorSparseValues";

/**
 * Sparse storage of accessor values that deviate from their
 * initialization value.
 * @internal
 */
export interface AccessorSparse extends GlTFProperty {
  /**
   * Number of deviating accessor values stored in the sparse array.
   */
  count: number;

  /**
   * An object pointing to a buffer view containing the indices of
   * deviating accessor values. The number of indices is equal to `count`.
   * Indices **MUST** strictly increase.
   */
  indices: AccessorSparseIndices;

  /**
   * An object pointing to a buffer view containing the deviating accessor
   * values.
   */
  values: AccessorSparseValues;
}

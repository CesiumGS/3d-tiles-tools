import { QuantizationInfo } from "./QuantizationInfo";

/**
 * Information about the structure of an attriubte, after it
 * was decoded from the Draco representation.
 *
 * @internal
 */
export type AttributeInfo = {
  /**
   * The number of components (e.g. 1 for scalars, 3 for 3D
   * vectors)
   */
  componentsPerAttribute: number;

  /**
   * The component data type, as the string representation of one
   * of the (GL) constants, like "SHORT" or "UNSIGNED_BYTE"
   */
  componentDatatype: string;

  /**
   * The byte offset of the attribute data
   */
  byteOffset: number;

  /**
   * The byte stride between attributes (i.e. `componentsPerAttribute`
   * times the size of the `componentDataType` in bytes)
   */
  byteStride: number;

  /**
   * Whether the attribute is normalized
   */
  normalized: boolean;

  /**
   * Optional quantization information for quantized attributes
   */
  quantization?: QuantizationInfo;
};

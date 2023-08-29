/**
 * The information that is included in an `AttributeInfo` for
 * the case that the Draco data was quantized
 *
 * @internal
 */
export type QuantizationInfo = {
  /**
   * The number of bits for the quantization
   */
  quantizationBits: number;

  /**
   * The minimal dequantized value for each component of the attribute.
   *
   * This is present when `octEncoded` is `false`.
   */
  minValues?: number[];

  /**
   * Bounds of the dequantized attribute.
   *
   * This is the maximum delta over all components.
   * This is present when `octEncoded` is `false`.
   */
  range?: number;

  /**
   * Whether the attribute was oct-encoded.
   *
   * If this is `true`, then the attribute was quantized with an
   * AttributeOctahedronTransform. Otherwise, the attribute was
   * quantized with an AttributeQuantizationTransform.
   */
  octEncoded: boolean;
};

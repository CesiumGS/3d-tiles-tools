/**
 * A set of options for configuring KTX ETC1S compression in the `KtxUtility`
 *
 * @internal
 */
export type KtxEtc1sOptions = Partial<{
  /**
   * ETC1S / BasisLZ compression level, an encoding speed vs. quality
   * tradeoff. Higher values are slower, but give higher quality.
   *
   * minimum: 0
   * maximum: 5
   * default: 1
   */
  compressionLevel: number;

  /**
   * ETC1S / BasisLZ quality level. Lower gives better compression/lower
   * quality/faster. Higher gives less compression /higher quality/slower.
   *
   * minimum: 1
   * maximum: 255
   * default: 128
   */
  qualityLevel: number;

  /**
   * The transfer function.
   */
  transferFunction: "SRGB" | "LINEAR";
}>;

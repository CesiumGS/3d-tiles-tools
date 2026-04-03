/**
 * A set of options for configuring KTX UASTC compression in the `KtxUtility`
 *
 * @internal
 */
export type KtxUastcOptions = Partial<{
  /**
   * Set UASTC encoding level. Higher=slower but higher quality.
   * 0=fastest/lowest quality,
   * 3=slowest practical option,
   * 4=impractically slow/highest achievable quality.
   *
   * minimum: 0
   * maximum: 4
   * default: 2
   */
  level: number;

  /**
   * Enable UASTC RDO post-processing and set UASTC RDO quality scalar
   * (lambda) to X. Lower values=higher quality/larger LZ compressed
   * files, higher values=lower quality/smaller LZ compressed files.
   * Good range to try is [.25-3.0].
   *
   * minimum: 0.001
   * maximum: 10.0
   * default: 1.0
   */
  rdo_l: number;

  /**
   * Set UASTC RDO dictionary size in bytes. Lower values=faster,
   * but less compression.
   *
   * minimum: 64
   * maximum: 65536
   * default: 4096
   */
  rdo_d: number;

  /**
   * Supercompress the data with Zstandard. Most effective with
   * RDO-conditioned UASTC or uncompressed formats. Lower
   * values=faster but give less compression. Values above 20
   * should be used with caution as they require more memory.
   *
   * minimum: 1
   * maximum: 22
   * default: 9
   */
  zstd: number;

  /**
   * The transfer function.
   *
   * default: "SRGB"
   */
  transferFunction: "SRGB" | "LINEAR";
}>;

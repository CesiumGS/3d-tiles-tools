/**
 * Methods for color conversions.
 *
 * These methods convert between different color representations.
 *
 * The terms "RGB" and "RGBA" refer to values in [0,255], unless
 * they are referred to as "Normalized".
 *
 * The prefix "Normalized" indicates that the RGB/RGBA values
 * are in [0.0, 1.0].
 *
 * The prefix "standard" indicates sRGB/sRGBA values.
 *
 * The prefix "linear" indicates linear RGB/RGBA values (often
 * used as factors).
 *
 * @internal
 */
export class Colors {
  /**
   * Converts three sRGB values in [0,255] to linear RGBA values
   * in [0.0, 1.0].
   *
   * @param input - The three sRGB components
   * @returns The four linear RGBA components
   */
  static standardRGBToNormalizedLinearRGBA(input: number[]) {
    const normalizedStandardRGB = input.map((b) => b / 255.0);
    const normalizedStandardRGBA = [...normalizedStandardRGB, 1.0];
    const normalizedLinearRGBA =
      Colors.normalizedStandardRGBAToNormalizedLinearRGBA(
        normalizedStandardRGBA
      );
    return normalizedLinearRGBA;
  }

  /**
   * Converts four sRGB values in [0,255] to linear RGBA values
   * in [0.0, 1.0].
   *
   * @param input - The four sRGBA components
   * @returns The four linear RGBA components
   */
  static standardRGBAToNormalizedLinearRGBA(input: number[]) {
    const normalizedStandardRGBA = input.map((b) => b / 255.0);
    const normalizedLinearRGBA =
      Colors.normalizedStandardRGBAToNormalizedLinearRGBA(
        normalizedStandardRGBA
      );
    return normalizedLinearRGBA;
  }

  /**
   * Converts a standard sRGB656 value to linear RGBA values
   * in [0.0, 1.0].
   *
   * @param input - The sRGB565 value
   * @returns The four linear RGBA components
   */
  static standardRGB565ToNormalizedLinearRGBA(input: number) {
    const normalizedStandardRGBA =
      Colors.decodeStandardRGB565ToNormalizedStandardRGBA(input);
    const normalizedLinearRGBA =
      Colors.normalizedStandardRGBAToNormalizedLinearRGBA(
        normalizedStandardRGBA
      );
    return normalizedLinearRGBA;
  }

  // From CesiumJS AttributeCompression
  private static normalizedStandardRGBAToNormalizedLinearRGBA(srgb: number[]) {
    const linear = Array<number>(4);
    linear[3] = srgb[3];

    for (let i = 0; i < 3; i++) {
      const c = srgb[i];
      if (c <= 0.04045) {
        // eslint-disable-next-line no-loss-of-precision, @typescript-eslint/no-loss-of-precision
        linear[i] = srgb[i] * 0.07739938080495356037151702786378;
      } else {
        linear[i] = Math.pow(
          // eslint-disable-next-line no-loss-of-precision, @typescript-eslint/no-loss-of-precision
          (c + 0.055) * 0.94786729857819905213270142180095,
          2.4
        );
      }
    }
    return linear;
  }

  // From CesiumJS AttributeCompression
  /**
   * Decodes the given standard RGB656 value into normalized standard
   * RGBA components (i.e. into four values in [0.0, 1.0]).
   *
   * @param value - The RGB656 value
   * @returns The normalized standard RGB components
   */
  private static decodeStandardRGB565ToNormalizedStandardRGBA(
    value: number
  ): number[] {
    const mask5 = (1 << 5) - 1;
    const mask6 = (1 << 6) - 1;
    const normalize5 = 1.0 / 31.0;
    const normalize6 = 1.0 / 63.0;
    const red = value >> 11;
    const green = (value >> 5) & mask6;
    const blue = value & mask5;
    const result = Array<number>(4);
    result[0] = red * normalize5;
    result[1] = green * normalize6;
    result[2] = blue * normalize5;
    result[3] = 1.0;
    return result;
  }
}

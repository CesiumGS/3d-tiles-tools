import { AttributeCompression } from "./AttributeCompression";

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
      AttributeCompression.decodeStandardRGB565ToNormalizedStandardRGBA(input);
    const normalizedLinearRGBA =
      Colors.normalizedStandardRGBAToNormalizedLinearRGBA(
        normalizedStandardRGBA
      );
    return normalizedLinearRGBA;
  }

  // From CesiumJS AttributeCompression
  private static normalizedStandardRGBAToNormalizedLinearRGBA(srgb: number[]) {
    const linear = new Array(4);
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
}

import { Cartesian3 } from "cesium";
import { Math as CesiumMath } from "cesium";

/**
 * Adapted from CesiumJS 'AttributeCompression' class:
 *
 * Methods for decoding (point cloud) attribute values that are
 * stored in compressed forms.
 *
 * @internal
 */
export class AttributeCompression {
  private static readonly octDecodeInRangeInternalResultScratch =
    new Cartesian3();

  /**
   * Decodes two 8-bit values that represent an oct-encoded normal
   * into a 3D (normalized) normal.
   *
   * @param input - The input values
   * @returns The resulting normal
   */
  static octDecode8(input: number[]): number[] {
    const rangeMax = 255;
    const result = AttributeCompression.octDecodeInRangeInternalResultScratch;
    const x = input[0];
    const y = input[1];
    AttributeCompression.octDecodeInRangeInternal(x, y, rangeMax, result);
    const array = Array<number>(3);
    Cartesian3.pack(result, array, 0);
    return array;
  }

  /**
   * Decodes two 16-bit values that represent an oct-encoded normal
   * into a 3D (normalized) normal.
   *
   * @param input - The input values
   * @returns The resulting normal
   */
  static octDecode16(input: number[]): number[] {
    const rangeMax = 65535;
    const result = AttributeCompression.octDecodeInRangeInternalResultScratch;
    const x = input[0];
    const y = input[1];
    AttributeCompression.octDecodeInRangeInternal(x, y, rangeMax, result);
    const array = Array<number>(3);
    Cartesian3.pack(result, array, 0);
    return array;
  }

  private static octDecodeInRangeInternal(
    x: number,
    y: number,
    rangeMax: number,
    result: Cartesian3
  ) {
    result.x = CesiumMath.fromSNorm(x, rangeMax);
    result.y = CesiumMath.fromSNorm(y, rangeMax);
    result.z = 1.0 - (Math.abs(result.x) + Math.abs(result.y));

    if (result.z < 0.0) {
      const oldVX = result.x;
      result.x = (1.0 - Math.abs(result.y)) * CesiumMath.signNotZero(oldVX);
      result.y = (1.0 - Math.abs(oldVX)) * CesiumMath.signNotZero(result.y);
    }
    return Cartesian3.normalize(result, result);
  }
}

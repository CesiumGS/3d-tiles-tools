// Relevant functions ported from https://github.com/CesiumGS/cesium/blob/4b333bc145fa9f7aed0c7ad7e0f46cb001a94ddd/Source/Core/S2Cell.js

import { DeveloperError } from "../../../base";

/**
 * Functions related to S2 cells
 *
 * @internal
 */
export class S2Cell {
  // The maximum level supported within an S2 cell ID. Each level is represented by two bits in the final cell ID
  private static readonly S2_MAX_LEVEL = 30;

  // The number of bits in a S2 cell ID used for specifying the position along the Hilbert curve
  private static readonly S2_POSITION_BITS = 2 * S2Cell.S2_MAX_LEVEL + 1;

  // Lookup table for getting trailing zero bits.
  // https://graphics.stanford.edu/~seander/bithacks.html
  private static readonly Mod67BitPosition = [
    64, 0, 1, 39, 2, 15, 40, 23, 3, 12, 16, 59, 41, 19, 24, 54, 4, 64, 13, 10,
    17, 62, 60, 28, 42, 30, 20, 51, 25, 44, 55, 47, 5, 32, 65, 38, 14, 22, 11,
    58, 18, 53, 63, 9, 61, 27, 29, 50, 43, 46, 31, 37, 21, 57, 52, 8, 26, 49,
    45, 36, 56, 7, 48, 35, 6, 34, 33, 0,
  ];

  /**
   * Converts a 64-bit S2 cell ID to an S2 cell token.
   *
   * @param cellId - The S2 cell ID.
   * @returns Returns hexadecimal representation of an S2CellId.
   * @internal
   */
  static getTokenFromId = function (cellId: bigint): string {
    const trailingZeroHexChars = Math.floor(
      S2Cell.countTrailingZeroBits(cellId) / 4
    );
    const hexString = cellId.toString(16).replace(/0*$/, "");

    const zeroString = Array(17 - trailingZeroHexChars - hexString.length).join(
      "0"
    );
    return zeroString + hexString;
  };

  /**
   * Return the number of trailing zeros in number.
   * @internal
   */
  private static countTrailingZeroBits(x: bigint) {
    const index = (-x & x) % BigInt(67);
    return S2Cell.Mod67BitPosition[Number(index)];
  }

  /**
   * Converts an S2 cell token to a 64-bit S2 cell ID.
   *
   * @param token - The hexadecimal representation of an S2CellId. Expected to be a valid S2 token.
   * @returns Returns the S2 cell ID.
   * @internal
   */
  static getIdFromToken = function (token: string): bigint {
    return BigInt("0x" + token + "0".repeat(16 - token.length));
  };

  /**
   * Creates an S2Cell from its face, position along the Hilbert curve for a given level.
   *
   * @param face - The root face of S2 this cell is on. Must be in the range [0-5].
   * @param position - The position along the Hilbert curve. Must be in the range [0-4**level).
   * @param level - The level of the S2 curve. Must be in the range [0-30].
   * @returns A new S2Cell ID from the given parameters.
   * @internal
   */
  static fromFacePositionLevel(
    face: number,
    position: bigint,
    level: number
  ): bigint {
    if (face < 0 || face > 5) {
      throw new DeveloperError("Invalid S2 Face (must be within 0-5)");
    }

    if (level < 0 || level > S2Cell.S2_MAX_LEVEL) {
      throw new DeveloperError("Invalid level (must be within 0-30)");
    }
    if (position < 0 || position >= Math.pow(4, level)) {
      throw new DeveloperError("Invalid Hilbert position for level");
    }

    const faceBitString =
      (face < 4 ? "0" : "") + (face < 2 ? "0" : "") + face.toString(2);
    const positionBitString = position.toString(2);
    const positionPrefixPadding = Array(
      2 * level - positionBitString.length + 1
    ).join("0");
    const positionSuffixPadding = Array(
      S2Cell.S2_POSITION_BITS - 2 * level
    ).join("0");

    const cellId = BigInt(
      `0b${faceBitString}${positionPrefixPadding}${positionBitString}1${
        // Adding the sentinel bit that always follows the position bits.
        positionSuffixPadding
      }`
    );
    return cellId;
  }
}

// Ported from https://github.com/CesiumGS/cesium/blob/4b333bc145fa9f7aed0c7ad7e0f46cb001a94ddd/Source/Core/HilbertOrder.js

import { DeveloperError } from "../../../base";

/**
 * Hilbert Order helper functions.
 *
 * @internal
 */
export class HilbertOrder {
  /**
   * Computes the Hilbert index at the given level from 2D coordinates.
   *
   * @param level - The level of the curve
   * @param x - The X coordinate
   * @param y - The Y coordinate
   * @returns  The Hilbert index.
   */
  static encode2D(level: number, x: number, y: number): bigint {
    const n = Math.pow(2, level);
    if (level < 1) {
      throw new DeveloperError("Hilbert level cannot be less than 1.");
    }
    if (x < 0 || x >= n || y < 0 || y >= n) {
      throw new DeveloperError("Invalid coordinates for given level.");
    }

    const p = {
      x: x,
      y: y,
    };
    let rx,
      ry,
      s,
      index = BigInt(0);

    for (s = n / 2; s > 0; s /= 2) {
      rx = (p.x & s) > 0 ? 1 : 0;
      ry = (p.y & s) > 0 ? 1 : 0;
      index += BigInt(((3 * rx) ^ ry) * s * s);
      HilbertOrder.rotate(n, p, rx, ry);
    }

    return index;
  }

  /**
   * Computes the 2D coordinates from the Hilbert index at the given level.
   *
   * @param level - The level of the curve
   * @param index - The Hilbert index
   * @returns An array containing the 2D coordinates ([x, y]) corresponding to the Morton index.
   * @internal
   */
  static decode2D(level: number, index: bigint): number[] {
    if (level < 1) {
      throw new DeveloperError("Hilbert level cannot be less than 1.");
    }
    if (index < BigInt(0) || index >= BigInt(Math.pow(4, level))) {
      throw new DeveloperError(
        "Hilbert index exceeds valid maximum for given level."
      );
    }

    const n = Math.pow(2, level);
    const p = {
      x: 0,
      y: 0,
    };
    let rx, ry, s, t;

    for (s = 1, t = index; s < n; s *= 2) {
      rx = 1 & Number(t / BigInt(2));
      ry = 1 & Number(t ^ BigInt(rx));
      HilbertOrder.rotate(s, p, rx, ry);
      p.x += s * rx;
      p.y += s * ry;
      t /= BigInt(4);
    }

    return [p.x, p.y];
  }

  /**
   * @internal
   */
  private static rotate(
    n: number,
    p: { x: number; y: number },
    rx: number,
    ry: number
  ) {
    if (ry !== 0) {
      return;
    }

    if (rx === 1) {
      p.x = n - 1 - p.x;
      p.y = n - 1 - p.y;
    }

    const t = p.x;
    p.x = p.y;
    p.y = t;
  }
}

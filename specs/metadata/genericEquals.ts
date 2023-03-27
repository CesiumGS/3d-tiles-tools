import { defaultValue } from "../../src/base/defaultValue";

/**
 * Returns whether two numbers are equal, up to a certain epsilon
 *
 * @param left - The first value
 * @param right - The second value
 * @param relativeEpsilon - The maximum inclusive delta for the relative tolerance test.
 * @param absoluteEpsilon - The maximum inclusive delta for the absolute tolerance test.
 * @returns Whether the values are equal within the epsilon
 */
function equalsEpsilon(
  left: number,
  right: number,
  relativeEpsilon: number,
  absoluteEpsilon?: number
) {
  relativeEpsilon = defaultValue(relativeEpsilon, 0.0);
  absoluteEpsilon = defaultValue(absoluteEpsilon, relativeEpsilon);
  const absDiff = Math.abs(left - right);
  return (
    absDiff <= absoluteEpsilon ||
    absDiff <= relativeEpsilon * Math.max(Math.abs(left), Math.abs(right))
  );
}

/**
 * A function for checking values for equality, taking into account the
 * possibility that the values are (potentially multi- dimensional)
 * arrays, and recursively comparing the elements in this case.
 * If the eventual elements are numbers, they are compared for
 * equality up to the given relative epsilon.
 *
 * This is ONLY used in the specs, to compare metadata values.
 *
 * @param a - The first element
 * @param b - The second element
 * @param epsilon - A relative epsilon
 * @returns Whether the objects are equal
 */
export function genericEquals(a: any, b: any, epsilon: number): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false;
    }

    for (let i = 0; i < a.length; ++i) {
      if (!genericEquals(a[i], b[i], epsilon)) {
        return false;
      }
    }
    return true;
  }
  if (typeof a === "number") {
    return equalsEpsilon(a, Number(b), epsilon);
  }
  return a === b;
}

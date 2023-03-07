import { defined } from "../base/defined";
import { defaultValue } from "../base/defaultValue";

/**
 * Utility functions for generic operations on values that
 * may be numbers or bigints or (potentially multi-dimensional)
 * arrays of numbers or bigints.
 *
 * These methods are mainly used for performing operations
 * on metadata values that have been found to be numeric
 * values (i.e. SCALAR values, VECn or MATn values, or
 * arrays thereof)
 *
 * When two values are involved, then the methods assume
 * that the values have the same structure, i.e. they are
 * both numeric, or arrays with the same length.
 */
export class ArrayValues {
  // Implementation note:
  // The way how these functions are written is drilling a hole
  // into the type checks that COULD be offered by TypeScript.
  // However, defining these methods in a type-safe way is fairly
  // non-trivial, and (more importantly) would require the proper
  // type checks to be done by the caller.

  /**
   * Multiplies the given input value with the given factor.
   *
   * If the factor is undefined, then the original value
   * is returned.
   *
   * This considers the case that the values are numbers or
   * (potentially multi-dimensional) arrays of numbers.
   *
   * @param value - The input value
   * @param factor - The optional factor
   * @returns The resulting value
   */
  static deepMultiply(value: any, factor: any): any {
    if (!defined(factor)) {
      return value;
    }
    const f = factor as any;
    if (!Array.isArray(value)) {
      return value * f;
    }
    for (let i = 0; i < value.length; i++) {
      value[i] = ArrayValues.deepMultiply(value[i], f[i]);
    }
    return value;
  }

  /**
   * Adds the given addend to the given input value.
   *
   * If the addend is undefined, then the original value
   * is returned.
   *
   * This considers the case that the values are numbers or
   * (potentially multi-dimensional) arrays of numbers.
   *
   * @param value - The input value
   * @param addend - The optional addend
   * @returns The resulting value
   */
  static deepAdd(value: any, addend: any): any {
    if (!defined(addend)) {
      return value;
    }
    if (!Array.isArray(value)) {
      return value + addend;
    }
    const a = addend as any;
    for (let i = 0; i < value.length; i++) {
      value[i] = ArrayValues.deepAdd(value[i], a[i]);
    }
    return value;
  }

  /**
   * Computes the minimum of the given values.
   *
   * This considers the case that the values are numbers or
   * (potentially multi-dimensional) arrays of numbers,
   * and computes the component-wise minimum.
   *
   * @param a - The first value
   * @param b - THe second value
   * @returns The mimimum value
   */
  static deepMin(a: any, b: any): any {
    if (Array.isArray(a) && Array.isArray(b)) {
      const result = a.slice();
      for (let i = 0; i < a.length; ++i) {
        result[i] = ArrayValues.deepMin(a[i], b[i]);
      }
      return result;
    }
    return Math.min(a, b);
  }

  /**
   * Computes the maximum of the given values.
   *
   * This considers the case that the values are numbers or
   * (potentially multi-dimensional) arrays of numbers,
   * and computes the component-wise maximum.
   *
   * @param a - The first value
   * @param b - THe second value
   * @returns The maximum value
   */
  static deepMax(a: any, b: any): any {
    if (Array.isArray(a) && Array.isArray(b)) {
      const result = a.slice();
      for (let i = 0; i < a.length; ++i) {
        result[i] = ArrayValues.deepMax(a[i], b[i]);
      }
      return result;
    }
    return Math.max(a, b);
  }

  /**
   * Returns whether the given values are equal up to the
   * give relative epsilon.
   *
   * This considers the case that the values are numbers or
   * (potentially multi-dimensional) arrays of numbers.
   *
   * @param a - The first element
   * @param b - The second element
   * @param epsilon - A relative epsilon
   * @returns Whether the objects are equal
   */
  static deepEqualsEpsilon(a: any, b: any, epsilon: number): boolean {
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) {
        return false;
      }
      for (let i = 0; i < a.length; ++i) {
        if (!ArrayValues.deepEqualsEpsilon(a[i], b[i], epsilon)) {
          return false;
        }
      }
      return true;
    }
    return ArrayValues.equalsEpsilon(a, b, epsilon);
  }

  /**
   * From CesiumJS:
   *
   * Returns whether two numbers are equal, up to a certain epsilon
   *
   * @param left - The first value
   * @param right - The second value
   * @param relativeEpsilon - The maximum inclusive delta for the relative tolerance test.
   * @param absoluteEpsilon - The maximum inclusive delta for the absolute tolerance test.
   * @returns Whether the values are equal within the epsilon
   */
  private static equalsEpsilon(
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
   * Checks whether two values are equal.
   *
   * This considers the case that the values are numbers or
   * (potentially multi-dimensional) arrays of numbers.
   *
   * @param a - The first value
   * @param b - The second value
   * @returns Whether the values are equal
   */
  static deepEquals(a: any, b: any) {
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) {
        return false;
      }
      for (let i = 0; i < a.length; i++) {
        if (!ArrayValues.deepEquals(a[i], b[i])) {
          return false;
        }
      }
      return true;
    }
    return a === b;
  }

  /**
   * Returns a deep clone of the given value.
   *
   * This considers the case that the values are (potentially
   * multi-dimensional) arrays. Non-array values (including
   * objects!) will be returned directly.
   *
   * @param value - The input value
   * @returns The result value
   */
  static deepClone(value: any) {
    if (!Array.isArray(value)) {
      return value;
    }
    const result = value.slice();
    for (let i = 0; i < value.length; i++) {
      result[i] = ArrayValues.deepClone(value[i]);
    }
    return result;
  }

  /**
   * Returns whether one value is less than another.
   *
   * This considers the case that the values are numbers or
   * (potentially multi-dimensional) arrays of numbers.
   *
   * It returns whether the first number is smaller than
   * the second number. For arrays, it recursively checks
   * whether ANY element of the first array is smaller
   * than the corresponding element of the secon array.
   *
   * @param a - The first value
   * @param b - The second value
   * @returns Whether the first value is less than the second
   */
  static anyDeepLessThan(a: any, b: any): boolean {
    if (Array.isArray(a) && Array.isArray(b)) {
      for (let i = 0; i < a.length; ++i) {
        if (ArrayValues.anyDeepLessThan(a[i], b[i])) {
          return true;
        }
      }
      return false;
    }
    return a < b;
  }
  /**
   * Returns whether one value is greater than another.
   *
   * This considers the case that the values are numbers or
   * (potentially multi-dimensional) arrays of numbers.
   *
   * It returns whether the first number is greater than
   * the second number. For arrays, it recursively checks
   * whether ANY element of the first array is greater
   * than the corresponding element of the secon array.
   *
   * @param a - The first value
   * @param b - The second value
   * @returns Whether the first value is greater than the second
   */
  static anyDeepGreaterThan(a: any, b: any): boolean {
    if (Array.isArray(a) && Array.isArray(b)) {
      for (let i = 0; i < a.length; ++i) {
        if (ArrayValues.anyDeepGreaterThan(a[i], b[i])) {
          return true;
        }
      }
      return false;
    }
    return a > b;
  }
}

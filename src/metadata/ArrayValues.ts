import { MetadataError } from "./MetadataError";

/**
 * Type definition for numeric values (number or bigint)
 */
type NumericScalar = number | bigint;

/**
 * Type definition for numeric values or n-dimensional
 * arrays of numeric values.
 */
type NumericND = NumericScalar | NumericND[];

/**
 * A type definition for numbers
 */
type NumberScalar = number;

/**
 * A type definition for numbers or n-dimensional
 * arrays of numbers
 */
type NumberND = NumberScalar | NumberND[];

/**
 * Utility functions for generic operations on values that
 * may be numbers or (potentially multi-dimensional) arrays
 * of numbers.
 *
 * These methods are mainly used for performing operations
 * on metadata values that have been found to be numeric
 * values (i.e. SCALAR values, VECn or MATn values, or
 * arrays thereof)
 *
 * When two values are involved, then the methods assume
 * that the values have the same structure, i.e. they are
 * both numeric/numbers or arrays with the same length. If this
 * is not the case, then a `MetadataError` will be thrown.
 *
 * @internal
 */
export class ArrayValues {
  // Implementation note:
  // The methods here are supposed to be called in a context
  // where no (compile-time) type information is available.
  // Thes are offered to operate on "any" types, but usually
  // delegate to "...Internal" methods with more specific
  // type signatures. This does not imply any compile-time
  // checks, but these specific signatures might be exposed
  // as public methods at some point.

  /**
   * Returns whether the given value is a Numeric scalar
   * (i.e. number or bigint)
   *
   * @param value - The value
   * @returns Whether the value is Numeric
   */
  private static isNumericScalar(value: any): value is NumericScalar {
    if (typeof value === "number") {
      return true;
    }
    if (typeof value === "bigint") {
      return true;
    }
    return true;
  }

  /**
   * Multiplies the given input value with the given factor.
   *
   * @param value - The input value
   * @param factor - The factor
   * @returns The resulting value
   * @throws MetadataError If the parameters have incompatible types
   */
  static deepMultiply(value: any, factor: any): any {
    return ArrayValues.deepMultiplyInternal(value, factor);
  }

  /**
   * Multiplies the given input value with the given factor.
   *
   * @param value - The input value
   * @param factor - The factor
   * @returns The resulting value
   * @throws MetadataError If the parameters have incompatible types
   */
  private static deepMultiplyInternal<T extends NumberND>(
    value: T,
    factor: T
  ): T {
    if (Array.isArray(value) && Array.isArray(factor)) {
      if (value.length != factor.length) {
        throw new MetadataError(
          `Values ${value} and ${factor} have different lengths`
        );
      }
      const result = value.slice();
      for (let i = 0; i < result.length; i++) {
        result[i] = ArrayValues.deepMultiplyInternal(result[i], factor[i]);
      }
      return result as T;
    }
    if (typeof value === "number" && typeof factor === "number") {
      return (value * factor) as T;
    }
    throw new MetadataError(
      `Values ${value} and ${factor} have invalid ` +
        `types ${typeof value} and ${typeof factor}`
    );
  }

  /**
   * Adds the given addend to the given input value.
   *
   * @param value - The input value
   * @param addend - The optional addend
   * @returns The resulting value
   * @throws MetadataError If the parameters have incompatible types
   */
  static deepAdd(value: any, addend: any): any {
    return ArrayValues.deepAddInternal(value, addend);
  }

  /**
   * Adds the given addend to the given input value.
   *
   * @param value - The input value
   * @param addend - The optional addend
   * @returns The resulting value
   * @throws MetadataError If the parameters have incompatible types
   */
  private static deepAddInternal<T extends NumberND>(value: T, addend: T): T {
    if (Array.isArray(value) && Array.isArray(addend)) {
      if (value.length != addend.length) {
        throw new MetadataError(
          `Values ${value} and ${addend} have different lengths`
        );
      }
      const result = value.slice();
      for (let i = 0; i < result.length; i++) {
        result[i] = ArrayValues.deepAddInternal(result[i], addend[i]);
      }
      return result as T;
    }
    if (typeof value === "number" && typeof addend === "number") {
      return (value + addend) as T;
    }
    throw new MetadataError(
      `Values ${value} and ${addend} have invalid ` +
        `types ${typeof value} and ${typeof addend}`
    );
  }

  /**
   * Computes the minimum of the given values.
   *
   * For arrays, it computes the component-wise minimum.
   *
   * @param a - The first value
   * @param b - The second value
   * @returns The mimimum value
   * @throws MetadataError If the parameters have incompatible types
   */
  static deepMin(a: any, b: any): any {
    return ArrayValues.deepMinInternal(a, b);
  }

  /**
   * Computes the minimum of the given values.
   *
   * For arrays, it computes the component-wise minimum.
   *
   * @param a - The first value
   * @param b - The second value
   * @returns The mimimum value
   * @throws MetadataError If the parameters have incompatible types
   */
  private static deepMinInternal<T extends NumericND>(a: T, b: T): T {
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length != b.length) {
        throw new MetadataError(`Values ${a} and ${b} have different lengths`);
      }
      const result = a.slice();
      for (let i = 0; i < a.length; ++i) {
        result[i] = ArrayValues.deepMinInternal(a[i], b[i]);
      }
      return result as T;
    }
    if (ArrayValues.isNumericScalar(a) && ArrayValues.isNumericScalar(b)) {
      return a < b ? a : b;
    }
    throw new MetadataError(
      `Values ${a} and ${b} have invalid ` + `types ${typeof a} and ${typeof b}`
    );
  }

  /**
   * Computes the maximum of the given values.
   *
   * For arrays, it computes the component-wise maximum.
   *
   * @param a - The first value
   * @param b - The second value
   * @returns The maximum value
   * @throws MetadataError If the parameters have incompatible types
   */
  static deepMax(a: any, b: any): any {
    return ArrayValues.deepMaxInternal(a, b);
  }

  /**
   * Computes the maximum of the given values.
   *
   * For arrays, it computes the component-wise maximum.
   *
   * @param a - The first value
   * @param b - The second value
   * @returns The maximum value
   * @throws MetadataError If the parameters have incompatible types
   */
  private static deepMaxInternal<T extends NumericND>(a: T, b: T): T {
    if (Array.isArray(a) && Array.isArray(b)) {
      const result = a.slice();
      for (let i = 0; i < a.length; ++i) {
        result[i] = ArrayValues.deepMaxInternal(a[i], b[i]);
      }
      return result as T;
    }
    if (ArrayValues.isNumericScalar(a) && ArrayValues.isNumericScalar(b)) {
      return a > b ? a : b;
    }
    throw new MetadataError(
      `Values ${a} and ${b} have invalid ` + `types ${typeof a} and ${typeof b}`
    );
  }

  /**
   * Checks whether two values are equal.
   *
   * This is only supposed to be used for scalars (number or bigint)
   * or (potentially multi-dimensional) arrays of scalars.
   *
   * @param a - The first value
   * @param b - The second value
   * @returns Whether the values are equal
   */
  static deepEquals(a: any, b: any): boolean {
    return ArrayValues.deepEqualsInternal(a, b);
  }

  /**
   * Checks whether two values are equal.
   *
   * @param a - The first value
   * @param b - The second value
   * @returns Whether the values are equal
   */
  private static deepEqualsInternal<T extends NumericND>(a: T, b: T): boolean {
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) {
        return false;
      }
      for (let i = 0; i < a.length; i++) {
        if (!ArrayValues.deepEqualsInternal(a[i], b[i])) {
          return false;
        }
      }
      return true;
    }
    // Do a loose comparison, for the case of mixing bigint and number:
    return a == b;
  }

  /**
   * Returns a deep clone of the given value.
   *
   * When the value is an array, then its elements are
   * deep-cloned. Otherwise, the value itself is returned.
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
   * It returns whether the first value is smaller than
   * the second value. For arrays, it recursively checks
   * whether ANY element of the first array is smaller
   * than the corresponding element of the second array.
   *
   * @param a - The first value
   * @param b - The second value
   * @returns Whether the first value is less than the second
   * @throws MetadataError If the parameters have incompatible types
   */
  static anyDeepLessThan(a: any, b: any): boolean {
    return ArrayValues.anyDeepLessThanInternal(a, b);
  }

  /**
   * Returns whether one value is less than another.
   *
   * It returns whether the first value is smaller than
   * the second value. For arrays, it recursively checks
   * whether ANY element of the first array is smaller
   * than the corresponding element of the second array.
   *
   * @param a - The first value
   * @param b - The second value
   * @returns Whether the first value is less than the second
   * @throws MetadataError If the parameters have incompatible types
   */
  private static anyDeepLessThanInternal<T extends NumericND>(
    a: T,
    b: T
  ): boolean {
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length != b.length) {
        throw new MetadataError(`Values ${a} and ${b} have different lengths`);
      }
      for (let i = 0; i < a.length; ++i) {
        if (ArrayValues.anyDeepLessThanInternal(a[i], b[i])) {
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
   * It returns whether the first value is greater than
   * the second value. For arrays, it recursively checks
   * whether ANY element of the first array is greater
   * than the corresponding element of the second array.
   *
   * @param a - The first value
   * @param b - The second value
   * @returns Whether the first value is greater than the second
   * @throws MetadataError If the parameters have incompatible types
   */
  static anyDeepGreaterThan(a: any, b: any): boolean {
    return ArrayValues.anyDeepGreaterThanInternal(a, b);
  }

  /**
   * Returns whether one value is greater than another.
   *
   * It returns whether the first value is greater than
   * the second value. For arrays, it recursively checks
   * whether ANY element of the first array is greater
   * than the corresponding element of the second array.
   *
   * @param a - The first value
   * @param b - The second value
   * @returns Whether the first value is greater than the second
   * @throws MetadataError If the parameters have incompatible types
   */
  private static anyDeepGreaterThanInternal<T extends NumericND>(
    a: T,
    b: T
  ): boolean {
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length != b.length) {
        throw new MetadataError(`Values ${a} and ${b} have different lengths`);
      }
      for (let i = 0; i < a.length; ++i) {
        if (ArrayValues.anyDeepGreaterThanInternal(a[i], b[i])) {
          return true;
        }
      }
      return false;
    }
    return a > b;
  }
}

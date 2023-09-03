import { NumberTypeDescriptions } from "./NumberTypeDescriptions";

/**
 * Methods for detecting the type of values that are obtained
 * from JSON input
 *
 * This is used for detecting the type of values that are given
 * in batch table JSON.
 *
 * @internal
 */
export class TypeDetection {
  /**
   * Returns whether all elements of the given array are arrays
   *
   * @param value - The value
   * @returns Whether all elements are arrays
   */
  static containsOnlyArrays(value: any[]): boolean {
    for (const element of value) {
      if (!Array.isArray(element)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Returns the common length of all elements in the given array,
   * or `undefined` if they have different lengths.
   *
   * @param value - The value
   * @returns The common array length
   */
  static computeCommonArrayLegth(value: any[][]): number | undefined {
    let commonLength: number | undefined = undefined;
    for (const element of value) {
      if (commonLength === undefined) {
        commonLength = element.length;
      } else {
        if (commonLength !== element.length) {
          return undefined;
        }
      }
    }
    return commonLength;
  }

  /**
   * Computes the common ("metadata") component type that can
   * represent the values in the given arrays.
   *
   * This will, for example, be "UINT16" or "FLOAT32".
   *
   * @param array - The array
   * @returns The common component type
   */
  static computeCommonComponentType(
    array: number[] | bigint[] | number[][] | bigint[][]
  ) {
    const commonComponentType =
      NumberTypeDescriptions.computeComponentType(array);
    return commonComponentType;
  }

  /**
   * Computes the common ("metadata") type for the elements
   * in the given array, or `undefined` if they have different
   * types.
   *
   * This may be "STRING", "BOOLEAN", or "SCALAR". The
   * latter is used for all numeric types. There is no
   * way to detect whether something that is given in
   * JSON is supposed to be a "VEC3", or just an arbitrary
   * 3-element array.
   *
   * @param array - The array
   * @returns The common type.
   */
  static computeCommonType(array: any[]) {
    let commonType: string | undefined = undefined;
    for (let i = 0; i < array.length; i++) {
      const element = array[i];
      const elementType = TypeDetection.computeType(element);
      if (commonType === undefined) {
        commonType = elementType;
      } else if (elementType !== commonType) {
        return undefined;
      }
    }
    return commonType;
  }

  /**
   * Computes the ("metadata") type for the given value, or
   * `undefined` if there is no suitable type for the given
   * value.
   *
   * The result will be `STRING`, `BOOLEAN` or `SCALAR`
   * (referring to the element itself, or the array elements
   * if the input was an array)
   *
   * @param value - The value
   * @returns The type
   */
  private static computeType(value: any): string | undefined {
    if (typeof value === "string") {
      return "STRING";
    }
    if (typeof value === "boolean") {
      return "BOOLEAN";
    }
    if (typeof value === "number" || typeof value === "bigint") {
      return "SCALAR";
    }
    if (Array.isArray(value)) {
      const commonElementType =
        TypeDetection.computeCommonArrayElementType(value);
      if (commonElementType === "string") {
        return "STRING";
      }
      if (commonElementType === "boolean") {
        return "BOOLEAN";
      }
      if (commonElementType === "number" || commonElementType === "bigint") {
        return "SCALAR";
      }
    }
    return undefined;
  }

  /**
   * Computes the common (JavaScript) type of the elements
   * in the given array, or `undefined` if they have
   * different types.
   *
   * The result may be `string` or `number` or `object`
   * or `bigint` or so...
   *
   * @param array - The array
   * @returns The common element type
   */
  private static computeCommonArrayElementType(
    array: any[]
  ): string | undefined {
    let commonElementType: string | undefined = undefined;
    for (let i = 0; i < array.length; i++) {
      const element = array[i];
      const elementType = typeof element;
      if (commonElementType === undefined) {
        commonElementType = elementType;
      } else if (elementType !== commonElementType) {
        return undefined;
      }
    }
    return commonElementType;
  }
}

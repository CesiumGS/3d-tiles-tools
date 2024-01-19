import { DracoError } from "./DracoError";

/**
 * Ported from CesiumJS 'ComponentDataType', ONLY for the use
 * in the draco package.
 *
 * @internal
 */
export class ComponentDatatype {
  /**
   * 8-bit signed byte corresponding to <code>gl.BYTE</code> and the type
   * of an element in <code>Int8Array</code>.
   */
  public static readonly BYTE = 0x1400;

  /**
   * 8-bit unsigned byte corresponding to <code>UNSIGNED_BYTE</code> and the type
   * of an element in <code>Uint8Array</code>.
   */
  public static readonly UNSIGNED_BYTE = 0x1401;

  /**
   * 16-bit signed short corresponding to <code>SHORT</code> and the type
   * of an element in <code>Int16Array</code>.
   */
  public static readonly SHORT = 0x1402;

  /**
   * 16-bit unsigned short corresponding to <code>UNSIGNED_SHORT</code> and the type
   * of an element in <code>Uint16Array</code>.
   */
  public static readonly UNSIGNED_SHORT = 0x1403;

  /**
   * 32-bit signed int corresponding to <code>INT</code> and the type
   * of an element in <code>Int32Array</code>.
   */
  public static readonly INT = 0x1404;

  /**
   * 32-bit unsigned int corresponding to <code>UNSIGNED_INT</code> and the type
   * of an element in <code>Uint32Array</code>.
   */
  public static readonly UNSIGNED_INT = 0x1405;

  /**
   * 32-bit floating-point corresponding to <code>FLOAT</code> and the type
   * of an element in <code>Float32Array</code>.
   */
  public static readonly FLOAT = 0x1406;

  /**
   * 64-bit floating-point corresponding to <code>gl.DOUBLE</code> (in Desktop OpenGL;
   * and the type of an element in <code>Float64Array</code>.
   */
  public static readonly DOUBLE = 0x140a;

  /**
   * Returns the size, in bytes, of the corresponding datatype.
   *
   * @param componentDatatype - The component datatype to get the size of.
   * @returns The size in bytes.
   *
   * @throws DracoError when componentDatatype is not a valid value.
   */
  static getSizeInBytes(componentDatatype: number) {
    switch (componentDatatype) {
      case ComponentDatatype.BYTE:
        return Int8Array.BYTES_PER_ELEMENT;
      case ComponentDatatype.UNSIGNED_BYTE:
        return Uint8Array.BYTES_PER_ELEMENT;
      case ComponentDatatype.SHORT:
        return Int16Array.BYTES_PER_ELEMENT;
      case ComponentDatatype.UNSIGNED_SHORT:
        return Uint16Array.BYTES_PER_ELEMENT;
      case ComponentDatatype.INT:
        return Int32Array.BYTES_PER_ELEMENT;
      case ComponentDatatype.UNSIGNED_INT:
        return Uint32Array.BYTES_PER_ELEMENT;
      case ComponentDatatype.FLOAT:
        return Float32Array.BYTES_PER_ELEMENT;
      case ComponentDatatype.DOUBLE:
        return Float64Array.BYTES_PER_ELEMENT;
      default:
        throw new DracoError("componentDatatype is not a valid value.");
    }
  }

  /**
   * Gets the {@link ComponentDatatype} for the provided TypedArray instance.
   *
   * @param array - The typed array.
   * @returns The ComponentDatatype for the provided array, or undefined if the array is not a TypedArray.
   */
  static fromTypedArray(
    array:
      | Int8Array
      | Uint8Array
      | Int16Array
      | Uint16Array
      | Int32Array
      | Uint32Array
      | Float32Array
      | Float64Array
  ): number {
    if (array instanceof Int8Array) {
      return ComponentDatatype.BYTE;
    }
    if (array instanceof Uint8Array) {
      return ComponentDatatype.UNSIGNED_BYTE;
    }
    if (array instanceof Int16Array) {
      return ComponentDatatype.SHORT;
    }
    if (array instanceof Uint16Array) {
      return ComponentDatatype.UNSIGNED_SHORT;
    }
    if (array instanceof Int32Array) {
      return ComponentDatatype.INT;
    }
    if (array instanceof Uint32Array) {
      return ComponentDatatype.UNSIGNED_INT;
    }
    if (array instanceof Float32Array) {
      return ComponentDatatype.FLOAT;
    }
    if (array instanceof Float64Array) {
      return ComponentDatatype.DOUBLE;
    }
    throw new DracoError(
      "array must be an Int8Array, Uint8Array, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, or Float64Array."
    );
  }

  /**
   * Returns the string representation of the given data type.
   *
   * @param componentDatatype - The component datatype
   * @returns The string
   *
   * @throws DracoError when componentDatatype is not a valid value.
   */
  static toString(componentDatatype: number) {
    switch (componentDatatype) {
      case ComponentDatatype.BYTE:
        return "BYTE";
      case ComponentDatatype.UNSIGNED_BYTE:
        return "UNSIGNED_BYTE";
      case ComponentDatatype.SHORT:
        return "SHORT";
      case ComponentDatatype.UNSIGNED_SHORT:
        return "UNSIGNED_SHORT";
      case ComponentDatatype.INT:
        return "INT";
      case ComponentDatatype.UNSIGNED_INT:
        return "UNSIGNED_INT";
      case ComponentDatatype.FLOAT:
        return "FLOAT";
      case ComponentDatatype.DOUBLE:
        return "DOUBLE";
      default:
        throw new DracoError("componentDatatype is not a valid value.");
    }
  }
}

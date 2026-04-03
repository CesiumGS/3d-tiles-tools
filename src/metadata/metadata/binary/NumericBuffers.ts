import { ArrayBuffers } from "./ArrayBuffers";
import { MetadataComponentTypes } from "../MetadataComponentTypes";
import { MetadataError } from "../MetadataError";

/**
 * Methods for extracting `number`- or `bigint` values or arrays thereof
 * from `Buffer` objects
 *
 * @internal
 */
export class NumericBuffers {
  /**
   * Obtains a single number or bigint from the given buffer,
   * at the given index, based on the given component type.
   *
   * @param buffer - The buffer
   * @param index - The index
   * @param componentType - The component type, e.g `FLOAT32` or `UINT16`
   * @returns The number or bigint
   * @throws MetadataError If the given `componentType` is not valid
   */
  static getNumericFromBuffer(
    buffer: Buffer,
    index: number,
    componentType: string
  ): number | bigint {
    const byteSize =
      MetadataComponentTypes.byteSizeForComponentType(componentType);
    const byteOffset = index * byteSize;
    switch (componentType) {
      case "INT8":
        return buffer.readInt8(byteOffset);
      case "UINT8":
        return buffer.readUint8(byteOffset);
      case "INT16":
        return buffer.readInt16LE(byteOffset);
      case "UINT16":
        return buffer.readUInt16LE(byteOffset);
      case "INT32":
        return buffer.readInt32LE(byteOffset);
      case "UINT32":
        return buffer.readUInt32LE(byteOffset);
      case "INT64":
        return buffer.readBigInt64LE(byteOffset);
      case "UINT64":
        return buffer.readBigUInt64LE(byteOffset);
      case "FLOAT32":
        return buffer.readFloatLE(byteOffset);
      case "FLOAT64":
        return buffer.readDoubleLE(byteOffset);
    }
    throw new MetadataError(`Unknown component type: ${componentType}`);
  }

  /**
   * Obtains an array of number or bigint values from the given buffer,
   * starting at the given index, based on the given component type.
   *
   * @param buffer - The buffer
   * @param index - The index
   * @param arrayLength - The length of the array, in number of elements
   * @param componentType - The component type, e.g `FLOAT32` or `UINT16`
   * @returns The number or bigint array
   * @throws MetadataError If the given `componentType` is not valid
   */
  static getNumericArrayFromBuffer(
    buffer: Buffer,
    index: number,
    arrayLength: number,
    componentType: string
  ): (number | bigint)[] {
    const typedArray = NumericBuffers.getTypedArrayFromBuffer(
      buffer,
      index,
      arrayLength,
      componentType
    );
    const array = [...typedArray];
    return array;
  }

  /**
   * Obtains a typed array of number or bigint values from the given buffer,
   * starting at the given index, based on the given component type.
   *
   * @param buffer - The buffer
   * @param index - The index
   * @param arrayLength - The length of the array, in number of elements
   * @param componentType - The component type, e.g `FLOAT32` or `UINT16`
   * @returns The number or bigint typed array
   * @throws MetadataError If the given `componentType` is not valid
   */
  private static getTypedArrayFromBuffer(
    buffer: Buffer,
    index: number,
    arrayLength: number,
    componentType: string
  ) {
    const componentSize =
      MetadataComponentTypes.byteSizeForComponentType(componentType);
    const elementSize = arrayLength * componentSize;
    const byteOffset = index * elementSize;
    const arrayBuffer = ArrayBuffers.fromBuffer(buffer);
    switch (componentType) {
      case "INT8":
        return new Int8Array(arrayBuffer, byteOffset, arrayLength);
      case "UINT8":
        return new Uint8Array(arrayBuffer, byteOffset, arrayLength);
      case "INT16":
        return new Int16Array(arrayBuffer, byteOffset, arrayLength);
      case "UINT16":
        return new Uint16Array(arrayBuffer, byteOffset, arrayLength);
      case "INT32":
        return new Int32Array(arrayBuffer, byteOffset, arrayLength);
      case "UINT32":
        return new Uint32Array(arrayBuffer, byteOffset, arrayLength);
      case "INT64":
        return new BigInt64Array(arrayBuffer, byteOffset, arrayLength);
      case "UINT64":
        return new BigUint64Array(arrayBuffer, byteOffset, arrayLength);
      case "FLOAT32":
        return new Float32Array(arrayBuffer, byteOffset, arrayLength);
      case "FLOAT64":
        return new Float64Array(arrayBuffer, byteOffset, arrayLength);
    }
    throw new MetadataError(`Unknown component type: ${componentType}`);
  }

  /**
   * Returns an array that contains the `number`- or `bigint` values
   * that are stored in the given buffer
   *
   * @param buffer - The buffer
   * @param componentType - The component type
   * @returns The number or bigint array
   * @throws MetadataError If the given `componentType` is not valid
   */
  static getNumericBufferAsArray(buffer: Buffer, componentType: string): any {
    const size = MetadataComponentTypes.byteSizeForComponentType(componentType);
    const arrayLength = buffer.length / size;
    const typedArray = NumericBuffers.getTypedArrayFromBuffer(
      buffer,
      0,
      arrayLength,
      componentType
    );
    const array = [...typedArray];
    return array;
  }

  /**
   * Returns a boolean value from the specified buffer, at the specified
   * bit index
   *
   * @param buffer - The buffer
   * @param index - The bit index
   * @returns The boolean value
   */
  static getBooleanFromBuffer(buffer: Buffer, index: number): boolean {
    const byteIndex = Math.floor(index / 8);
    const bitIndex = index % 8;
    const byte = buffer.readUint8(byteIndex);
    const bit = 1 << bitIndex;
    const result = (byte & bit) !== 0;
    return result;
  }
}

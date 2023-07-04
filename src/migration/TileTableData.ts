import { PropertyModel } from "../metadata/PropertyModel";
import { PropertyModels } from "../metadata/PropertyModels";
import { NumericBuffers } from "../metadata/binary/NumericBuffers";
import { NumericPropertyModel } from "../metadata/binary/NumericPropertyModel";

import { BatchTableBinaryBodyReference } from "../structure/TileFormats/BatchTableBinaryBodyReference";
import { BinaryBodyOffset } from "../structure/TileFormats/BinaryBodyOffset";

import { TileFormatError } from "../tileFormats/TileFormatError";

export class TileTableData {
  /**
   * Obtains the data from a batch- or feature table property,
   * as an array of numbers.
   *
   * @param binary - The binary blob of the table
   * @param property - The property value. If this is a number
   * array, then it is returned directly. Otherwise, if it
   * is a binary body reference, then the corresponding
   * values from the buffer will be read and returned
   * as an array of numbers
   * @param length - The length (in number of elements) of
   * the property
   * @param componentType - The component type, e.g `FLOAT32` or `UINT16`
   * @returns The property values as an array of numbers
   */
  static obtainNumberArray(
    binary: Buffer,
    property: number[] | BinaryBodyOffset,
    length: number,
    componentType: string
  ): number[] {
    let result: number[] | undefined = undefined;
    if (TileTableData.isBinaryBodyOffset(property)) {
      const byteOffset = property.byteOffset;
      const resultValues = NumericBuffers.getNumericArrayFromBuffer(
        binary,
        byteOffset,
        length,
        componentType
      );
      result = resultValues.map((n) => Number(n));
    } else {
      result = property;
    }
    return result;
  }

  /**
   * Returns whether the given object is a `BinaryBodyOffset`
   *
   * @param p - The object
   * @returns Whether it is a `BinaryBodyOffset`
   */
  private static isBinaryBodyOffset(
    p: BinaryBodyOffset | number[]
  ): p is BinaryBodyOffset {
    return (p as BinaryBodyOffset).byteOffset !== undefined;
  }

  /**
   * Returns whether the given object is a `BatchTableBinaryBodyReference`
   *
   * @param p - The object
   * @returns Whether it is a `BatchTableBinaryBodyReference`
   */
  static isBatchTableBinaryBodyReference(
    p: any
  ): p is BatchTableBinaryBodyReference {
    const r = p as BatchTableBinaryBodyReference;
    return (
      r.byteOffset !== undefined &&
      r.componentType !== undefined &&
      r.type !== undefined
    );
  }

  /**
   * Creates an iterable over the values that are stored in the
   * given batch- or feature table data, assuming that they are
   * numeric arrays
   *
   * @param binary - The binary blob of the table
   * @param byteOffset - The offset inside the binary blob
   * where the values start
   * @param numElements - The number of elements
   * @param legacyType - The legacy type, e.g. `VEC2`
   * @param legacyComponentType - The legacy component type,
   * e.g. `UNSIGNED_SHORT`
   * @returns The iterable
   */
  static createNumericArrayIterable(
    binary: Buffer,
    byteOffset: number,
    numElements: number,
    legacyType: string,
    legacyComponentType: string
  ): Iterable<number[]> {
    const propertyModel = TileTableData.createNumericPropertyModel(
      legacyType,
      legacyComponentType,
      byteOffset,
      binary
    );
    return PropertyModels.createNumericArrayIterable(
      propertyModel,
      numElements
    );
  }

  /**
   * Creates an iterable over the values that are stored in the
   * given batch- or feature table data, assuming that they are
   * numeric scalars
   *
   * @param binary - The binary blob of the table
   * @param byteOffset - The offset inside the binary blob
   * where the values start
   * @param numElements - The number of elements
   * @param legacyType - The legacy type, e.g. `SCALAR`
   * @param legacyComponentType - The legacy component type,
   * e.g. `UNSIGNED_SHORT`
   * @returns The iterable
   */
  static createNumericScalarIterable(
    binary: Buffer,
    byteOffset: number,
    numElements: number,
    legacyType: string,
    legacyComponentType: string
  ): Iterable<number> {
    const propertyModel = TileTableData.createNumericPropertyModel(
      legacyType,
      legacyComponentType,
      byteOffset,
      binary
    );
    return PropertyModels.createNumericScalarIterable(
      propertyModel,
      numElements
    );
  }


  /**
   * Createa a `PropertyModel` instance that is backed by
   * the numeric data of a batch- or feature table
   *
   * @param legacyType - The legacy type, e.g. `VEC2`
   * @param legacyComponentType - The legacy component type,
   * e.g. `UNSIGNED_SHORT`
   * @param byteOffset - The byte offset
   * @param binary - The binary blob of the table
   * @returns The property model
   */
  static createNumericPropertyModel(
    legacyType: string,
    legacyComponentType: string,
    byteOffset: number,
    binary: Buffer
  ): PropertyModel {
    const type = TileTableData.convertLegacyTypeToType(legacyType);
    const componentType =
      TileTableData.convertLegacyComponentTypeToComponentType(
        legacyComponentType
      );
    const valuesBuffer = binary.subarray(byteOffset);
    const propertyModel = new NumericPropertyModel(
      type,
      valuesBuffer,
      componentType
    );
    return propertyModel;
  }

  /**
   * Converts the given "legacy" type to a metadata type.
   *
   * Note that this is usually a no-op, but clearly separating
   * between the "legacy" type and the "new" type is important,
   * e.g. when the "new" types are represented as an `enum` in
   * the future.
   *
   * @param legacyType - The legacy type (e.g. `VEC2`)
   * @returns The type (e.g. `VEC2`)
   * @throws TileFormatError If the input type is invalid
   */
  static convertLegacyTypeToType(legacyType: string) {
    switch (legacyType) {
      case "SCALAR":
      case "VEC2":
      case "VEC3":
      case "VEC4":
        return legacyType;
    }
    throw new TileFormatError(
      `Table contains property with unknown type ${legacyType}`
    );
  }

  /**
   * Converts the given "legacy" component type to a metadata component type.
   *
   * This will do the standard conversions, e.g. of
   * - `BYTE` to `INT8`
   * - `FLOAT` to `FLOAT32`
   * - `UNSIGNED_SHORT` to `UINT16`
   * - etc
   *
   * @param legacyType - The legacy component type
   * @returns The component type
   * @throws TileFormatError If the input type is invalid
   */
  static convertLegacyComponentTypeToComponentType(
    legacyComponentType: string
  ) {
    switch (legacyComponentType) {
      case "BYTE":
        return "INT8";
      case "UNSIGNED_BYTE":
        return "UINT8";
      case "SHORT":
        return "INT16";
      case "UNSIGNED_SHORT":
        return "UINT16";
      case "INT":
        return "INT32";
      case "UNSIGNED_INT":
        return "UINT32";
      case "FLOAT":
        return "FLOAT32";
      case "DOUBLE":
        return "FLOAT64";
    }
    throw new TileFormatError(
      `Table contains property with unknown component type ${legacyComponentType}`
    );
  }
}

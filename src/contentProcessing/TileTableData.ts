import { PropertyModel } from "../metadata/PropertyModel";
import { NumericBuffers } from "../metadata/binary/NumericBuffers";
import { NumericPropertyModel } from "../metadata/binary/NumericPropertyModel";
import { BinaryBodyOffset } from "../structure/TileFormats/BinaryBodyOffset";
import { TileFormatError } from "../tileFormats/TileFormatError";

export class TileTableData {
  static obtainNumberArray(
    binary: Buffer,
    property: number[] | BinaryBodyOffset,
    length: number,
    componentType: string
  ) {
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

  private static isBinaryBodyOffset(
    p: BinaryBodyOffset | number[]
  ): p is BinaryBodyOffset {
    return (p as BinaryBodyOffset).byteOffset !== undefined;
  }

  static createArrayIterable(
    propertyModel: PropertyModel,
    numElements: number
  ): Iterable<number[]> {
    const iterable = {
      [Symbol.iterator]: function* (): Iterator<number[]> {
        for (let index = 0; index < numElements; index++) {
          const value = propertyModel.getPropertyValue(index);
          yield value;
        }
      },
    };
    return iterable;
  }

  static createScalarIterable(
    propertyModel: PropertyModel,
    numElements: number
  ): Iterable<number> {
    const iterable = {
      [Symbol.iterator]: function* (): Iterator<number> {
        for (let index = 0; index < numElements; index++) {
          const value = propertyModel.getPropertyValue(index);
          yield value;
        }
      },
    };
    return iterable;
  }

  static createPropertyModel(
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

  private static convertLegacyTypeToType(legacyType: string) {
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

  private static convertLegacyComponentTypeToComponentType(
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
        return "UINT21";
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

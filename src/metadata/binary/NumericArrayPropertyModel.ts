import { PropertyModel } from "../PropertyModel";
import { MetadataTypes } from "../MetadataTypes";

import { NumericBuffers } from "./NumericBuffers";
import { BinaryPropertyModels } from "./BinaryPropertyModels";

/**
 * Implementation of a `PropertyModel` for numeric array types.
 *
 * This includes all types that have numeric component types,
 * i.e. the `SCALAR`, `VECn` and `MATn` types, and the
 * (binary, and therefore numeric) representation of `ENUM`.
 *
 * @internal
 */
export class NumericArrayPropertyModel implements PropertyModel {
  private readonly _type: string;
  private readonly _valuesBuffer: Buffer;
  private readonly _componentType: string;
  private readonly _arrayOffsetsBuffer: Buffer | undefined;
  private readonly _arrayOffsetType: string;
  private readonly _count: number | undefined;

  constructor(
    type: string,
    valuesBuffer: Buffer,
    componentType: string,
    arrayOffsetsBuffer: Buffer | undefined,
    arrayOffsetType: string,
    count: number | undefined
  ) {
    this._type = type;
    this._valuesBuffer = valuesBuffer;
    this._componentType = componentType;
    this._arrayOffsetsBuffer = arrayOffsetsBuffer;
    this._arrayOffsetType = arrayOffsetType;
    this._count = count;
  }

  /** {@inheritDoc PropertyModel.getPropertyValue} */
  getPropertyValue(index: number): any {
    const type = this._type;
    const valuesBuffer = this._valuesBuffer;
    const componentType = this._componentType;
    const arrayOffsetsBuffer = this._arrayOffsetsBuffer;
    const arrayOffsetType = this._arrayOffsetType;
    const count = this._count;
    const componentCount = MetadataTypes.componentCountForType(type);

    const arraySlice = BinaryPropertyModels.computeSlice(
      index,
      arrayOffsetsBuffer,
      arrayOffsetType,
      count
    );
    const arrayOffset = arraySlice.offset;
    const arrayLength = arraySlice.length;

    const result = new Array(arrayLength);
    for (let i = 0; i < arrayLength; i++) {
      const n = arrayOffset + i;

      let element = undefined;
      if (type === "SCALAR" || type === "ENUM") {
        element = NumericBuffers.getNumericFromBuffer(
          valuesBuffer,
          n,
          componentType
        );
      } else {
        element = NumericBuffers.getNumericArrayFromBuffer(
          valuesBuffer,
          n,
          componentCount,
          componentType
        );
      }
      result[i] = element;
    }
    return result;
  }
}

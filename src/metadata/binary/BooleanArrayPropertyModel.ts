import { PropertyModel } from "../PropertyModel";

import { BinaryPropertyModels } from "./BinaryPropertyModels";
import { BooleanPropertyModel } from "./BooleanPropertyModel";

/**
 * Implementation of a `PropertyModel` for boolean arrays
 *
 * @internal
 */
export class BooleanArrayPropertyModel implements PropertyModel {
  private readonly _valuesBuffer: Buffer;
  private readonly _arrayOffsetsBuffer: Buffer | undefined;
  private readonly _arrayOffsetType: string;
  private readonly _count: number | undefined;

  constructor(
    valuesBuffer: Buffer,
    arrayOffsetsBuffer: Buffer | undefined,
    arrayOffsetType: string,
    count: number | undefined
  ) {
    this._valuesBuffer = valuesBuffer;
    this._arrayOffsetsBuffer = arrayOffsetsBuffer;
    this._arrayOffsetType = arrayOffsetType;
    this._count = count;
  }

  /** {@inheritDoc PropertyModel.getPropertyValue} */
  getPropertyValue(index: number): any {
    const valuesBuffer = this._valuesBuffer;
    const arrayOffsetsBuffer = this._arrayOffsetsBuffer;
    const arrayOffsetType = this._arrayOffsetType;
    const count = this._count;

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
      const element = BooleanPropertyModel.getBooleanFromBuffer(
        valuesBuffer,
        n
      );
      result[i] = element;
    }
    return result;
  }
}

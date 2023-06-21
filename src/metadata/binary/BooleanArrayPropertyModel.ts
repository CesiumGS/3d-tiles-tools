import { PropertyModel } from "../PropertyModel";

import { BinaryPropertyModels } from "./BinaryPropertyModels";
import { BooleanPropertyModel } from "./BooleanPropertyModel";

/**
 * Implementation of a `PropertyModel` for boolean arrays
 *
 * @internal
 */
export class BooleanArrayPropertyModel implements PropertyModel {
  private readonly valuesBuffer: Buffer;
  private readonly arrayOffsetsBuffer: Buffer | undefined;
  private readonly arrayOffsetType: string;
  private readonly count: number | undefined;

  constructor(
    valuesBuffer: Buffer,
    arrayOffsetsBuffer: Buffer | undefined,
    arrayOffsetType: string,
    count: number | undefined
  ) {
    this.valuesBuffer = valuesBuffer;
    this.arrayOffsetsBuffer = arrayOffsetsBuffer;
    this.arrayOffsetType = arrayOffsetType;
    this.count = count;
  }

  /** {@inheritDoc PropertyModel.getPropertyValue} */
  getPropertyValue(index: number): boolean[] {
    const valuesBuffer = this.valuesBuffer;
    const arrayOffsetsBuffer = this.arrayOffsetsBuffer;
    const arrayOffsetType = this.arrayOffsetType;
    const count = this.count;

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

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
  private readonly type: string;
  private readonly valuesBuffer: Buffer;
  private readonly componentType: string;
  private readonly arrayOffsetsBuffer: Buffer | undefined;
  private readonly arrayOffsetType: string;
  private readonly count: number | undefined;

  constructor(
    type: string,
    valuesBuffer: Buffer,
    componentType: string,
    arrayOffsetsBuffer: Buffer | undefined,
    arrayOffsetType: string,
    count: number | undefined
  ) {
    this.type = type;
    this.valuesBuffer = valuesBuffer;
    this.componentType = componentType;
    this.arrayOffsetsBuffer = arrayOffsetsBuffer;
    this.arrayOffsetType = arrayOffsetType;
    this.count = count;
  }

  /** {@inheritDoc PropertyModel.getPropertyValue} */
  getPropertyValue(index: number): (number | bigint | (number | bigint)[])[] {
    const type = this.type;
    const valuesBuffer = this.valuesBuffer;
    const componentType = this.componentType;
    const arrayOffsetsBuffer = this.arrayOffsetsBuffer;
    const arrayOffsetType = this.arrayOffsetType;
    const count = this.count;
    const componentCount = MetadataTypes.componentCountForType(type);

    const arraySlice = BinaryPropertyModels.computeSlice(
      index,
      arrayOffsetsBuffer,
      arrayOffsetType,
      count
    );
    const arrayOffset = arraySlice.offset;
    const arrayLength = arraySlice.length;

    const result = Array<number | bigint | (number | bigint)[]>(arrayLength);
    for (let i = 0; i < arrayLength; i++) {
      const n = arrayOffset + i;

      let element: number | bigint | (number | bigint)[] | undefined =
        undefined;
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

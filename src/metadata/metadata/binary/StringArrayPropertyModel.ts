import { PropertyModel } from "../PropertyModel";
import { BinaryPropertyModels } from "./BinaryPropertyModels";
import { ArrayBuffers } from "./ArrayBuffers";

/**
 * Implementation of a `PropertyModel` for string arrays
 *
 * @internal
 */
export class StringArrayPropertyModel implements PropertyModel {
  // Implementation note:
  // Either the `arrayOffsetsBuffer` or the `count` may be undefined.
  // When `arrayOffsetsBuffer` is defined, then this indicates a
  // variable-length array. When the `count` is defined, then this
  // indicates a fixed-length array.

  private static readonly decoder = new TextDecoder();

  private readonly valuesBuffer: Buffer;
  private readonly arrayOffsetsBuffer: Buffer | undefined;
  private readonly arrayOffsetType: string;
  private readonly stringOffsetsBuffer: Buffer;
  private readonly stringOffsetType: string;
  private readonly count: number | undefined;

  constructor(
    valuesBuffer: Buffer,
    arrayOffsetsBuffer: Buffer | undefined,
    arrayOffsetType: string,
    stringOffsetsBuffer: Buffer,
    stringOffsetType: string,
    count: number | undefined
  ) {
    this.valuesBuffer = valuesBuffer;
    this.arrayOffsetsBuffer = arrayOffsetsBuffer;
    this.arrayOffsetType = arrayOffsetType;
    this.stringOffsetsBuffer = stringOffsetsBuffer;
    this.stringOffsetType = stringOffsetType;
    this.count = count;
  }

  /** {@inheritDoc PropertyModel.getPropertyValue} */
  getPropertyValue(index: number): string[] {
    const valuesBuffer = this.valuesBuffer;
    const arrayOffsetsBuffer = this.arrayOffsetsBuffer;
    const arrayOffsetType = this.arrayOffsetType;
    const stringOffsetsBuffer = this.stringOffsetsBuffer;
    const stringOffsetType = this.stringOffsetType;
    const count = this.count;

    const arraySlice = BinaryPropertyModels.computeSlice(
      index,
      arrayOffsetsBuffer,
      arrayOffsetType,
      count
    );
    const arrayOffset = arraySlice.offset;
    const arrayLength = arraySlice.length;

    const result = Array<string>(arrayLength);
    for (let i = 0; i < arrayLength; i++) {
      const n = arrayOffset + i;

      const stringSlice = BinaryPropertyModels.computeSlice(
        n,
        stringOffsetsBuffer,
        stringOffsetType,
        undefined
      );
      const stringOffset = stringSlice.offset;
      const stringLength = stringSlice.length;
      const arrayBuffer = ArrayBuffers.fromBuffer(valuesBuffer);
      const element = StringArrayPropertyModel.decoder.decode(
        arrayBuffer.slice(stringOffset, stringOffset + stringLength)
      );
      result[i] = element;
    }
    return result;
  }
}

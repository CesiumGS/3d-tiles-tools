import { PropertyModel } from "../PropertyModel";
import { BinaryPropertyModels } from "./BinaryPropertyModels";
import { ArrayBuffers } from "./ArrayBuffers";

/**
 * Implementation of a `PropertyModel` for strings
 *
 * @internal
 */
export class StringPropertyModel implements PropertyModel {
  private static readonly decoder = new TextDecoder();

  private readonly valuesBuffer: Buffer;
  private readonly stringOffsetsBuffer: Buffer;
  private readonly stringOffsetType: string;

  constructor(
    valuesBuffer: Buffer,
    stringOffsetsBuffer: Buffer,
    stringOffsetType: string
  ) {
    this.valuesBuffer = valuesBuffer;
    this.stringOffsetsBuffer = stringOffsetsBuffer;
    this.stringOffsetType = stringOffsetType;
  }

  /** {@inheritDoc PropertyModel.getPropertyValue} */
  getPropertyValue(index: number): string {
    const valuesBuffer = this.valuesBuffer;
    const stringOffsetsBuffer = this.stringOffsetsBuffer;
    const stringOffsetType = this.stringOffsetType;

    const stringSlice = BinaryPropertyModels.computeSlice(
      index,
      stringOffsetsBuffer,
      stringOffsetType,
      undefined
    );
    const stringOffset = stringSlice.offset;
    const stringLength = stringSlice.length;

    const arrayBuffer = ArrayBuffers.fromBuffer(valuesBuffer);
    const result = StringPropertyModel.decoder.decode(
      arrayBuffer.slice(stringOffset, stringOffset + stringLength)
    );
    return result;
  }
}

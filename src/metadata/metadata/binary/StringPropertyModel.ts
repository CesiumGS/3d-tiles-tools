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
  private readonly stringOffsetType: string | undefined;

  constructor(
    valuesBuffer: Buffer,
    stringOffsetsBuffer: Buffer,
    stringOffsetType: string | undefined
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

    const localStringOffsetType = stringOffsetType ?? "UINT32";
    const stringSlice = BinaryPropertyModels.computeSlice(
      index,
      stringOffsetsBuffer,
      localStringOffsetType,
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

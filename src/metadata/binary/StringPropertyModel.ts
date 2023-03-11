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

  private readonly _valuesBuffer: Buffer;
  private readonly _stringOffsetsBuffer: Buffer;
  private readonly _stringOffsetType: string;

  constructor(
    valuesBuffer: Buffer,
    stringOffsetsBuffer: Buffer,
    stringOffsetType: string
  ) {
    this._valuesBuffer = valuesBuffer;
    this._stringOffsetsBuffer = stringOffsetsBuffer;
    this._stringOffsetType = stringOffsetType;
  }

  /** {@inheritDoc PropertyModel.getPropertyValue} */
  getPropertyValue(index: number): any {
    const valuesBuffer = this._valuesBuffer;
    const stringOffsetsBuffer = this._stringOffsetsBuffer;
    const stringOffsetType = this._stringOffsetType;

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

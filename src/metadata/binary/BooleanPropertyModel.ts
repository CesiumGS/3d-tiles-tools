import { PropertyModel } from "../PropertyModel";

import { NumericBuffers } from "./NumericBuffers";

/**
 * Implementation of a `PropertyModel` for booleans
 *
 * @internal
 */
export class BooleanPropertyModel implements PropertyModel {
  private readonly _valuesBuffer: Buffer;

  constructor(valuesBuffer: Buffer) {
    this._valuesBuffer = valuesBuffer;
  }

  /** {@inheritDoc PropertyModel.getPropertyValue} */
  getPropertyValue(index: number): any {
    const valuesBuffer = this._valuesBuffer;
    const result = BooleanPropertyModel.getBooleanFromBuffer(
      valuesBuffer,
      index
    );
    return result;
  }

  static getBooleanFromBuffer(buffer: Buffer, index: number): boolean {
    const byteIndex = Math.floor(index / 8);
    const bitIndex = index % 8;
    const byte = NumericBuffers.getNumericFromBuffer(
      buffer,
      byteIndex,
      "UINT8"
    );
    const bit = 1 << bitIndex;
    const result = (byte & bit) !== 0;
    return result;
  }
}

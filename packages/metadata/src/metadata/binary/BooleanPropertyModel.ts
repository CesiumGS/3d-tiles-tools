import { PropertyModel } from "../PropertyModel";
import { NumericBuffers } from "./NumericBuffers";

/**
 * Implementation of a `PropertyModel` for booleans
 *
 * @internal
 */
export class BooleanPropertyModel implements PropertyModel {
  private readonly valuesBuffer: Buffer;

  constructor(valuesBuffer: Buffer) {
    this.valuesBuffer = valuesBuffer;
  }

  /** {@inheritDoc PropertyModel.getPropertyValue} */
  getPropertyValue(index: number): boolean {
    const valuesBuffer = this.valuesBuffer;
    const result = NumericBuffers.getBooleanFromBuffer(valuesBuffer, index);
    return result;
  }
}

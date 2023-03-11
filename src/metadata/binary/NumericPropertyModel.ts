import { NumericBuffers } from "./NumericBuffers";

import { PropertyModel } from "../PropertyModel";
import { MetadataTypes } from "../MetadataTypes";

/**
 * Implementation of a `PropertyModel` for numeric types.
 *
 * This includes all types that have numeric component types,
 * i.e. the `SCALAR`, `VECn` and `MATn` types, and the
 * (binary, and therefore numeric) representation of `ENUM`.
 *
 * @internal
 */
export class NumericPropertyModel implements PropertyModel {
  private readonly _type: string;
  private readonly _valuesBuffer: Buffer;
  private readonly _componentType: string;

  constructor(type: string, valuesBuffer: Buffer, componentType: string) {
    this._type = type;
    this._valuesBuffer = valuesBuffer;
    this._componentType = componentType;
  }

  /** {@inheritDoc PropertyModel.getPropertyValue} */
  getPropertyValue(index: number): any {
    const valuesBuffer = this._valuesBuffer;
    const componentType = this._componentType;
    const type = this._type;

    if (type === "SCALAR" || type === "ENUM") {
      return NumericBuffers.getNumericFromBuffer(
        valuesBuffer,
        index,
        componentType
      );
    }
    const componentCount = MetadataTypes.componentCountForType(type);
    return NumericBuffers.getNumericArrayFromBuffer(
      valuesBuffer,
      index,
      componentCount,
      componentType
    );
  }
}

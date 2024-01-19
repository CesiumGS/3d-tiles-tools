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
  private readonly type: string;
  private readonly valuesBuffer: Buffer;
  private readonly componentType: string;

  constructor(type: string, valuesBuffer: Buffer, componentType: string) {
    this.type = type;
    this.valuesBuffer = valuesBuffer;
    this.componentType = componentType;
  }

  /** {@inheritDoc PropertyModel.getPropertyValue} */
  getPropertyValue(index: number): number | bigint | (number | bigint)[] {
    const valuesBuffer = this.valuesBuffer;
    const componentType = this.componentType;
    const type = this.type;

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

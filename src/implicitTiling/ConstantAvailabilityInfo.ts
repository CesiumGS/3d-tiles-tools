import { AvailabilityInfo } from "./AvailabilityInfo";

/**
 * Implementation of an `AvailabilityInfo` that has a constant value.
 */
export class ConstantAvailabilityInfo implements AvailabilityInfo {
  private readonly _available: boolean;
  private readonly _length: number;

  constructor(available: boolean, length: number) {
    this._available = available;
    this._length = length;
  }

  get length(): number {
    return this._length;
  }

  isAvailable(index: number): boolean {
    if (index < 0 || index >= this.length) {
      throw new RangeError(
        `Index must be in [0,${this.length}), but is ${index}`
      );
    }
    return this._available;
  }
}

import { AvailabilityInfo } from "./AvailabilityInfo";

/**
 * Implementation of an `AvailabilityInfo` that has a constant value.
 *
 * @internal
 */
export class ConstantAvailabilityInfo implements AvailabilityInfo {
  private readonly _available: boolean;
  private readonly _length: number;

  constructor(available: boolean, length: number) {
    this._available = available;
    this._length = length;
  }

  /** {@inheritDoc AvailabilityInfo.length} */
  get length(): number {
    return this._length;
  }

  /** {@inheritDoc AvailabilityInfo.isAvailable} */
  isAvailable(index: number): boolean {
    if (index < 0 || index >= this.length) {
      throw new RangeError(
        `Index must be in [0,${this.length}), but is ${index}`
      );
    }
    return this._available;
  }
}

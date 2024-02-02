import { AvailabilityInfo } from "./AvailabilityInfo";

/**
 * Implementation of an `AvailabilityInfo` that is backed by
 * a Buffer.
 *
 * @internal
 */
export class BufferAvailabilityInfo implements AvailabilityInfo {
  private readonly _buffer: Buffer;
  private readonly _length: number;

  constructor(buffer: Buffer, length: number) {
    this._buffer = buffer;
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
    const byteIndex = index >> 3;
    const bitIndex = index % 8;
    const b = this._buffer[byteIndex];
    const bit = 1 << bitIndex;
    const result = (b & bit) != 0;
    return result;
  }
}

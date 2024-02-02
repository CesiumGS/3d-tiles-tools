/**
 * Utility methods for buffer handling
 *
 * @internal
 */
export class ArrayBuffers {
  /**
   * Returns an `ArrayBuffer` that corresponds to the given buffer.
   *
   * @param buffer - The `Buffer`
   * @returns The `ArrayBuffer`
   */
  static fromBuffer(buffer: Buffer): ArrayBuffer {
    // NOTE: The `buffer.buffer` may be totally unrelated to
    // the `buffer` itself, because the buffer might have been
    // allocated with one of the "unsafe" methods that use
    // the internal buffer pool. This obscure line makes sure
    // that the result is an `ArrayBuffer` that actually
    // has the same contents as the `buffer`....
    return buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    );
  }
}

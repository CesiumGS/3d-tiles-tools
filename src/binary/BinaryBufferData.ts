/**
 * A basic structure holding binary data that consists of
 * buffers that are split into buffer views. This is the
 * actual data that corresponds to a `BinaryBufferStructure`
 *
 * @internal
 */
export interface BinaryBufferData {
  /**
   * An array of buffers that contain the data that correspond
   * to `BufferView` objects.
   *
   * These are usually (but not necessarily) slices of
   * the 'buffersData' elements.
   */
  bufferViewsData: Buffer[];

  /**
   * An array of buffers that contain the data that correspond
   * to `BufferObject` objects.
   */
  buffersData: Buffer[];
}

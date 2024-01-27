import { RootProperty } from "./RootProperty";

/**
 * A contiguous subset of a buffer
 * @internal
 */
export interface BufferView extends RootProperty {
  /**
   * The index of the buffer.
   */
  buffer: number;

  /**
   * The offset into the buffer in bytes.
   */
  byteOffset: number;

  /**
   * The total byte length of the buffer view.
   */
  byteLength: number;

  /**
   * The name of the `bufferView`.
   */
  name?: string;
}

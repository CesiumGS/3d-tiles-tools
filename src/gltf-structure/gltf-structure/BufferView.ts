import { GlTFChildOfRootProperty } from "./GlTFChildOfRootProperty";
import { GlTFid } from "./GlTFid";

/**
 * A view into a buffer generally representing a subset of the buffer.
 * @internal
 */
export interface BufferView extends GlTFChildOfRootProperty {
  /**
   * The index of the buffer.
   */
  buffer: GlTFid;

  /**
   * The offset into the buffer in bytes.
   */
  byteOffset?: number;

  /**
   * The length of the bufferView in bytes.
   */
  byteLength: number;

  /**
   * The stride in bytes.
   */
  byteStride?: number;

  /**
   * The hint representing the intended GPU buffer type to use with this
   * buffer view.
   */
  target?: number;
}

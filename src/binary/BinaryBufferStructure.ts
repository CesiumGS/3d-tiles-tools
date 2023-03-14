import { BufferObject } from "../structure/BufferObject";
import { BufferView } from "../structure/BufferView";

/**
 * A basic class holding information about the structure of
 * buffers that are split into buffer views, for example,
 * from a `Subtree` object.
 *
 * @internal
 */
export interface BinaryBufferStructure {
  buffers: BufferObject[];
  bufferViews: BufferView[];
}

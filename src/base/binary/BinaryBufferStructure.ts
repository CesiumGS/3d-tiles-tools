import { BufferObject } from "../../structure";
import { BufferView } from "../../structure";

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

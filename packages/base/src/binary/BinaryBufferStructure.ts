import { BufferObject } from "@3d-tiles-tools/structure"; 
import { BufferView } from "@3d-tiles-tools/structure";

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

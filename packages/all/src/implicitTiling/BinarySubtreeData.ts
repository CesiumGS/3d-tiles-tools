import { BinaryBufferData } from "@3d-tiles-tools/base";
import { BinaryBufferStructure } from "@3d-tiles-tools/base";

import { Subtree } from "@3d-tiles-tools/structure";

/**
 * An interface summarizing the binary data that is associated
 * with a subtree.
 *
 * Instances of this interface are created with the
 * `BinarySubtreeDataResolver`, which will resolve
 * the URIs of external buffers, and create an instance
 * of this class that combines all the resolved binary
 * buffer data.
 *
 * @internal
 */
export interface BinarySubtreeData {
  /**
   * The `Subtree` that this data belongs to
   */
  subtree: Subtree;

  /**
   * The structure of the binary buffers. These are
   * the buffers and buffer views from the subtree.
   */
  binaryBufferStructure: BinaryBufferStructure;

  /**
   * The resolved binary buffer data.
   */
  binaryBufferData: BinaryBufferData;
}

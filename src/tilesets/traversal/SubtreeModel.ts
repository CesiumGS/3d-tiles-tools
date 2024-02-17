import { SubtreeInfo } from "../implicitTiling/SubtreeInfo";

import { SubtreeMetadataModel } from "./SubtreeMetadataModel";

/**
 * An interface that summarizes the information for a subtree.
 *
 * @internal
 */
export interface SubtreeModel {
  /**
   * The `SubtreeInfo` that summarizes the availability information
   */
  subtreeInfo: SubtreeInfo;

  /**
   * The optional `SubtreeMetadataModel` that contains the metadata
   * associated with this subtree.
   */
  subtreeMetadataModel: SubtreeMetadataModel | undefined;
}

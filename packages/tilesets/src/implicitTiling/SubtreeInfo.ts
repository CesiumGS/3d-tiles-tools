import { AvailabilityInfo } from "./AvailabilityInfo";

/**
 * Summarizes the information about the elements that are
 * available in a subtree.
 *
 * It offers the availability information for tiles, child
 * subtrees, and contents, as `AvailabilityInfo` objects.
 *
 * @internal
 */
export interface SubtreeInfo {
  /**
   * The AvailabilityInfo for the tiles
   */
  tileAvailabilityInfo: AvailabilityInfo;

  /**
   * The AvailabilityInfo for the content
   */
  contentAvailabilityInfos: AvailabilityInfo[];

  /**
   * The AvailabilityInfo for the child subtrees
   */
  childSubtreeAvailabilityInfo: AvailabilityInfo;
}

import { AvailabilityInfo } from "./AvailabilityInfo";

/**
 * Summarizes the information about a subtree.
 *
 * It offers the availability information for tiles, child
 * subtrees, and contents, as `AvailabilityInfo` objects.
 */
export class SubtreeInfo {
  private readonly _tileAvailabilityInfo: AvailabilityInfo;
  private readonly _contentAvailabilityInfos: AvailabilityInfo[];
  private readonly _childSubtreeAvailabilityInfo: AvailabilityInfo;

  constructor(
    tileAvailabilityInfo: AvailabilityInfo,
    contentAvailabilityInfos: AvailabilityInfo[],
    childSubtreeAvailabilityInfo: AvailabilityInfo
  ) {
    (this._tileAvailabilityInfo = tileAvailabilityInfo),
      (this._contentAvailabilityInfos = contentAvailabilityInfos),
      (this._childSubtreeAvailabilityInfo = childSubtreeAvailabilityInfo);
  }

  getTileAvailabilityInfo(): AvailabilityInfo {
    return this._tileAvailabilityInfo;
  }
  getContentAvailabilityInfos(): AvailabilityInfo[] {
    return this._contentAvailabilityInfos;
  }
  getChildSubtreeAvailabilityInfo(): AvailabilityInfo {
    return this._childSubtreeAvailabilityInfo;
  }
}

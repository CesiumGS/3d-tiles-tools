import { Iterables } from "../base/Iterables";

import { TilesetSource } from "../tilesetData/TilesetSource";
import { TilesetTarget } from "../tilesetData/TilesetTarget";
import { TilesetSources } from "../tilesetData/TilesetSources";
import { TilesetTargets } from "../tilesetData/TilesetTargets";

import { TilesetEntryPredicate } from "./TilesetEntryPredicate";
import { TilesetEntryTransform } from "./TilesetEntryTransform";

export class TilesetOps {
  static transform(
    tilesetSource: TilesetSource,
    tilesetTarget: TilesetTarget,
    tilesetEntryPredicate: TilesetEntryPredicate | undefined,
    tilesetEntryTransform: TilesetEntryTransform | undefined
  ): void {
    const entries = TilesetSources.getEntries(tilesetSource);
    let resultEntries = entries;
    if (tilesetEntryPredicate) {
      resultEntries = Iterables.filter(resultEntries, tilesetEntryPredicate);
    }
    if (tilesetEntryTransform) {
      resultEntries = Iterables.map(resultEntries, tilesetEntryTransform);
    }
    TilesetTargets.putEntries(tilesetTarget, resultEntries);
  }
}

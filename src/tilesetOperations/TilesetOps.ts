import { Iterables } from "../base/Iterables";

import { TilesetSource } from "../tilesetData/TilesetSource";
import { TilesetTarget } from "../tilesetData/TilesetTarget";
import { TilesetSources } from "../tilesetData/TilesetSources";
import { TilesetTargets } from "../tilesetData/TilesetTargets";
import { TilesetEntry } from "../tilesetData/TilesetEntry";

import { PredicateAsync } from "./PredicateAsync";
import { TransformAsync } from "./TransformAsync";
import { Predicate } from "./Predicate";
import { Transform } from "./Transform";

export class TilesetOps {
  static async transformAsync(
    tilesetSource: TilesetSource,
    tilesetTarget: TilesetTarget,
    predicate: PredicateAsync<TilesetEntry> | undefined,
    transform: TransformAsync<TilesetEntry> | undefined
  ): Promise<void> {
    const inputEntries = TilesetSources.getEntries(tilesetSource);
    for (const inputEntry of inputEntries) {
      let included = true;
      if (predicate) {
        included = await predicate(inputEntry);
      }
      //console.log("Condition for "+inputEntry.key+" is "+included+" based on condition "+predicate);
      if (included) {
        let outputEntry = inputEntry;
        if (transform) {
          outputEntry = await transform(inputEntry);
        }
        tilesetTarget.addEntry(outputEntry.key, outputEntry.value);
      }
    }
  }

  static transformSync(
    tilesetSource: TilesetSource,
    tilesetTarget: TilesetTarget,
    predicate: Predicate<TilesetEntry> | undefined,
    transform: Transform<TilesetEntry> | undefined
  ): void {
    const entries = TilesetSources.getEntries(tilesetSource);
    let resultEntries = entries;
    if (predicate) {
      resultEntries = Iterables.filter(resultEntries, predicate);
    }
    if (transform) {
      resultEntries = Iterables.map(resultEntries, transform);
    }
    TilesetTargets.putEntries(tilesetTarget, resultEntries);
  }
}

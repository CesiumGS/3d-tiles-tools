import { TilesetEntry } from "../tilesetData/TilesetEntry";
import { TilesetSource } from "../tilesetData/TilesetSource";
import { TilesetTarget } from "../tilesetData/TilesetTarget";

import { TilesetEntries } from "../tilesetOperations/TilesetEntries";
import { TilesetOps } from "../tilesetOperations/TilesetOps";

import { ContentStage } from "./ContentStage";

export class ContentStageExecutor {
  static async executeContentStage(
    tilesetSource: TilesetSource,
    tilesetTarget: TilesetTarget,
    contentStage: ContentStage
  ) {
    if (contentStage.name === "gzip") {
      await TilesetOps.transformAsync(
        tilesetSource,
        tilesetTarget,
        contentStage.condition,
        async (e: TilesetEntry) => {
          return TilesetEntries.gzip(e);
        }
      );
    } else if (contentStage.name === "ungzip") {
      await TilesetOps.transformAsync(
        tilesetSource,
        tilesetTarget,
        contentStage.condition,
        async (e: TilesetEntry) => {
          return TilesetEntries.gunzip(e);
        }
      );
    } else {
      // TODO Handle this...
      console.log(
        "    Unknown contentStage name: " +
          contentStage.name +
          " performing no-op"
      );
      TilesetOps.transformSync(
        tilesetSource,
        tilesetTarget,
        undefined,
        undefined
      );
    }
  }
}

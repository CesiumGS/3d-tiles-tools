import { TilesetEntry } from "../tilesetData/TilesetEntry";
import { TilesetSource } from "../tilesetData/TilesetSource";
import { TilesetSources } from "../tilesetData/TilesetSources";
import { TilesetTarget } from "../tilesetData/TilesetTarget";
import { TilesetTargets } from "../tilesetData/TilesetTargets";

import { ContentStage } from "./ContentStage";
import { TilesetEntries } from "./TilesetEntries";

export class ContentStageExecutor {
  static async executeContentStage(
    tilesetSource: TilesetSource,
    tilesetTarget: TilesetTarget,
    contentStage: ContentStage
  ) {
    if (contentStage.name === "gzip") {
      await ContentStageExecutor.executeGzip(
        tilesetSource,
        tilesetTarget,
        contentStage.condition
      );
    } else if (contentStage.name === "ungzip") {
      await ContentStageExecutor.executeGunzip(tilesetSource, tilesetTarget);
    } else {
      // TODO Review and document this
      const message =
        `    Unknown contentStage name: ${contentStage.name} ` +
        `- performing no-op`;
      console.log(message);
      await ContentStageExecutor.executeNoOp(tilesetSource, tilesetTarget);
    }
  }

  private static async executeGzip(
    tilesetSource: TilesetSource,
    tilesetTarget: TilesetTarget,
    condition: ((e: TilesetEntry) => Promise<boolean>) | undefined
  ): Promise<void> {
    const inputEntries = TilesetSources.getEntries(tilesetSource);
    for (const inputEntry of inputEntries) {
      let included = true;
      if (condition) {
        included = await condition(inputEntry);
      }
      let outputEntry = inputEntry;
      if (included) {
        outputEntry = TilesetEntries.gzip(inputEntry);
      }
      tilesetTarget.addEntry(outputEntry.key, outputEntry.value);
    }
  }

  private static async executeGunzip(
    tilesetSource: TilesetSource,
    tilesetTarget: TilesetTarget
  ): Promise<void> {
    const inputEntries = TilesetSources.getEntries(tilesetSource);
    for (const inputEntry of inputEntries) {
      const outputEntry = TilesetEntries.gunzip(inputEntry);
      tilesetTarget.addEntry(outputEntry.key, outputEntry.value);
    }
  }

  private static async executeNoOp(
    tilesetSource: TilesetSource,
    tilesetTarget: TilesetTarget
  ): Promise<void> {
    const inputEntries = TilesetSources.getEntries(tilesetSource);
    TilesetTargets.putEntries(tilesetTarget, inputEntries);
  }
}

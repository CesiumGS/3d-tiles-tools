import { TilesetSource } from "../tilesetData/TilesetSource";
import { TilesetSources } from "../tilesetData/TilesetSources";
import { TilesetTarget } from "../tilesetData/TilesetTarget";
import { TilesetTargets } from "../tilesetData/TilesetTargets";

import { TilesetStage } from "./TilesetStage";
import { ContentStageExecutor } from "./ContentStageExecutor";

export class TilesetStageExecutor {
  static async executeTilesetStageInternal(
    tilesetSource: TilesetSource,
    tilesetTarget: TilesetTarget,
    tilesetStage: TilesetStage
  ) {
    const contentStages = tilesetStage.contentStages;

    if (contentStages.length === 0) {
      // TODO This should probably not cause a message.
      // A TilesetStage might be something like `databaseToTileset`
      // that is self-contained and "atomic", and does not have
      // any content stages.
      const message = `    No contentStages - performing no-op`;
      console.log(message);
      const inputEntries = TilesetSources.getEntries(tilesetSource);
      TilesetTargets.putEntries(tilesetTarget, inputEntries);
      return;
    }

    for (let c = 0; c < contentStages.length; c++) {
      const contentStage = contentStages[c];

      const message =
        `    Executing contentStage ${c} of ` +
        `${contentStages.length}: ${contentStage.name}`;
      console.log(message);

      await ContentStageExecutor.executeContentStage(
        tilesetSource,
        tilesetTarget,
        contentStage
      );
    }
  }

  static async executeTilesetStage(
    tilesetStage: TilesetStage,
    currentInput: string,
    currentOutput: string,
    overwrite: boolean
  ) {
    console.log(`  Executing tilesetStage : ${tilesetStage.name}`);
    console.log(`    currentInput:  ${currentInput}`);
    console.log(`    currentOutput: ${currentOutput}`);

    let tilesetSource;
    let tilesetTarget;
    try {
      tilesetSource = TilesetSources.createAndOpen(currentInput);
      tilesetTarget = TilesetTargets.createAndBegin(currentOutput, overwrite);

      await TilesetStageExecutor.executeTilesetStageInternal(
        tilesetSource,
        tilesetTarget,
        tilesetStage
      );

      tilesetSource.close();
      await tilesetTarget.end();
    } catch (error) {
      if (tilesetSource) {
        tilesetSource.close();
      }
      if (tilesetTarget) {
        await tilesetTarget.end();
      }
      throw error;
    }
  }
}

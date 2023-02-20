import path from "path";

import { TilesetSource } from "../tilesetData/TilesetSource";
import { TilesetSources } from "../tilesetData/TilesetSources";
import { TilesetTarget } from "../tilesetData/TilesetTarget";
import { TilesetTargets } from "../tilesetData/TilesetTargets";

import { TilesetOps } from "../tilesetOperations/TilesetOps";

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
      // TODO Handle this...
      console.log("    No contentStages - performing no-op");
      TilesetOps.transformSync(
        tilesetSource,
        tilesetTarget,
        undefined,
        undefined
      );
      return;
    }

    for (let c = 0; c < contentStages.length; c++) {
      const contentStage = contentStages[c];
      console.log(
        "    Executing contentStage " +
          c +
          " of " +
          contentStages.length +
          ": " +
          contentStage.name
      );
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
    currentOutput: string
  ) {
    console.log("  Executing tilesetStage : " + tilesetStage.name);
    console.log("    currentInput:  " + currentInput);
    console.log("    currentOutput: " + currentOutput);

    // TODO Handle overwrite.
    // TODO Handle errors.
    // TODO Ensure "close/end" calls.
    const inputExtension = path.extname(currentInput);
    const tilesetSource = TilesetSources.create(inputExtension)!; // XXX Asserting existance!
    tilesetSource.open(currentInput);
    const outputExtension = path.extname(currentOutput);
    const tilesetTarget = TilesetTargets.create(outputExtension)!; // XXX Asserting existance!
    const forceOverwrite = true;
    tilesetTarget.begin(currentOutput, forceOverwrite);

    await TilesetStageExecutor.executeTilesetStageInternal(
      tilesetSource,
      tilesetTarget,
      tilesetStage
    );

    tilesetSource.close();
    await tilesetTarget.end();
  }
}

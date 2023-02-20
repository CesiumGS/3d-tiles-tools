import { defined } from "../base/defined";
import { DeveloperError } from "../base/DeveloperError";

import { ContentStage } from "./ContentStage";
import { TilesetStage } from "./TilesetStage";
import { ContentStages } from "./ContentStages";

export class TilesetStages {
  static createTilesetStage(tilesetStageJson: any): TilesetStage {
    const contentStages: ContentStage[] = [];
    if (typeof tilesetStageJson === "string") {
      const tilesetStage: TilesetStage = {
        name: tilesetStageJson,
        contentStages: contentStages,
      };
      return tilesetStage;
    }
    if (!defined(tilesetStageJson.name)) {
      throw new DeveloperError("The tilesetStage JSON does not define a name");
    }
    if (defined(tilesetStageJson.contentStages)) {
      for (const contentStageJson of tilesetStageJson.contentStages) {
        const contentStage = ContentStages.createContentStage(contentStageJson);
        contentStages.push(contentStage);
      }
    }
    const tilesetStage: TilesetStage = {
      name: tilesetStageJson.name,
      contentStages: contentStages,
    };
    return tilesetStage;
  }
}

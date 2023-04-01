import { defined } from "../base/defined";
import { DeveloperError } from "../base/DeveloperError";

import { ContentStage } from "./ContentStage";
import { TilesetStage } from "./TilesetStage";
import { ContentStages } from "./ContentStages";

/**
 * Methods to create `TilesetStage` objects from JSON input.
 */
export class TilesetStages {
  /**
   * Creates a `TilesetStage` object from the given (untyped) JSON.
   *
   * @param tilesetStageJson - The JSON object
   * @returns The `TilesetStage` object
   * @throws DeveloperError When the input was not valid
   */
  static createTilesetStage(tilesetStageJson: any): TilesetStage {
    if (typeof tilesetStageJson === "string") {
      const tilesetStage: TilesetStage = {
        name: tilesetStageJson,
        contentStages: [],
      };
      return tilesetStage;
    }

    if (!defined(tilesetStageJson.name)) {
      throw new DeveloperError("The tilesetStage JSON does not define a name");
    }

    // The contentStages may be undefined, resulting
    // in an empty array here:
    const contentStages: ContentStage[] = [];
    if (tilesetStageJson.contentStages) {
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

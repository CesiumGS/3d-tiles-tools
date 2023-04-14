import { defined } from "../base/defined";
import { DeveloperError } from "../base/DeveloperError";

import { ContentStage } from "./ContentStage";
import { TilesetStage } from "./TilesetStage";
import { ContentStages } from "./ContentStages";

/**
 * Methods to create `TilesetStage` objects.
 */
export class TilesetStages {
  /**
   * The `name` that identifies the "upgrade" tileset stage
   */
  public static readonly TILESET_STAGE_UPGRADE = "upgrade";

  /**
   * The `name` that identifies the "combine" tileset stage
   */
  public static readonly TILESET_STAGE_COMBINE = "combine";

  /**
   * Creates a tileset stage that performs the "upgrade" operation
   *
   * @returns The tileset stage
   */
  public static createUpgrade(): TilesetStage {
    const tilesetStage: TilesetStage = {
      name: TilesetStages.TILESET_STAGE_UPGRADE,
      description: "Upgrade the input tileset to the latest version",
    };
    return tilesetStage;
  }

  /**
   * Creates a tileset stage that performs the "combine" operation
   *
   * @returns The tileset stage
   */
  public static createCombine(): TilesetStage {
    const tilesetStage: TilesetStage = {
      name: TilesetStages.TILESET_STAGE_COMBINE,
      description: "Combine all external tilesets into one",
    };
    return tilesetStage;
  }

  /**
   * Creates a tileset stage from the given parameters.
   *
   * @param name - The `name` of the tileset stage
   * @param description - The `description` of the tileset stage
   * @param contentStages - The content stages
   * @returns The tileset stage
   */
  public static create(
    name: string,
    description: string,
    contentStages: ContentStage[]
  ): TilesetStage {
    const tilesetStage: TilesetStage = {
      name: name,
      description: description,
      contentStages: contentStages,
    };
    return tilesetStage;
  }

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

    let contentStages: ContentStage[] | undefined = undefined;
    if (tilesetStageJson.contentStages) {
      contentStages = [];
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

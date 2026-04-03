import { defined } from "../../base";
import { DeveloperError } from "../../base";
import { ContentDataTypes } from "../../base";

import { ContentStage } from "./ContentStage";
import { TilesetStage } from "./TilesetStage";
import { ContentStages } from "./ContentStages";

/**
 * Methods to create `TilesetStage` objects.
 *
 * @internal
 */
export class TilesetStages {
  /**
   * The `name` that identifies the "gzip" tileset stage
   */
  public static readonly TILESET_STAGE_GZIP = "gzip";

  /**
   * The `name` that identifies the "ungzip" tileset stage
   */
  public static readonly TILESET_STAGE_UNGZIP = "ungzip";

  /**
   * The `name` that identifies the "combine" tileset stage
   */
  public static readonly TILESET_STAGE_COMBINE = "combine";

  /**
   * The `name` that identifies the "upgrade" tileset stage
   */
  public static readonly TILESET_STAGE_UPGRADE = "upgrade";

  /**
   * Creates a tileset stage that performs the "gzip" operation
   *
   * @param includedContentTypes - The array of `ContentDataType` strings
   * that the operation should be applied to (or `undefined` if it should
   * be applied to all data types)
   * @returns The tileset stage
   */
  public static createGzip(
    includedContentTypes: string[] | undefined
  ): TilesetStage {
    const tilesetStage: TilesetStage = {
      name: TilesetStages.TILESET_STAGE_GZIP,
      description: "Compresses each entry with GZIP",
      includedContentTypes: includedContentTypes,
    };
    return tilesetStage;
  }

  /**
   * Creates a content stage that performs the "ungzip" operation
   *
   * @returns The content stage
   */
  public static createUngzip(): ContentStage {
    const contentStage: ContentStage = {
      name: TilesetStages.TILESET_STAGE_UNGZIP,
      description: "Uncompress each entry that was compressed with GZIP",
    };
    return contentStage;
  }

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
      includedContentTypes: tilesetStageJson.includedContentTypes,
      excludedContentTypes: tilesetStageJson.excludedContentTypes,
    };

    // Convert the (legacy) "tilesOnly" flag into
    // a set of included content types
    if (tilesetStageJson.tilesOnly === true) {
      tilesetStage.includedContentTypes = [
        ContentDataTypes.CONTENT_TYPE_B3DM,
        ContentDataTypes.CONTENT_TYPE_I3DM,
        ContentDataTypes.CONTENT_TYPE_PNTS,
        ContentDataTypes.CONTENT_TYPE_CMPT,
        ContentDataTypes.CONTENT_TYPE_VCTR,
        ContentDataTypes.CONTENT_TYPE_GEOM,
        ContentDataTypes.CONTENT_TYPE_GLB,
        ContentDataTypes.CONTENT_TYPE_GLTF,
      ];
    }
    return tilesetStage;
  }
}

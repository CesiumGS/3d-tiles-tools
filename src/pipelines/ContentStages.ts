import { defined } from "../base/defined";
import { DeveloperError } from "../base/DeveloperError";

import { TilesetEntry } from "../tilesetData/TilesetEntry";
import { PredicateAsync } from "../tilesetOperations/PredicateAsync";

import { ContentDataTypeChecks } from "../contentTypes/ContentDataTypeChecks";
import { BufferedContentData } from "../contentTypes/BufferedContentData";

import { ContentStage } from "./ContentStage";

export class ContentStages {
  static createContentStage(contentStageJson: any): ContentStage {
    if (typeof contentStageJson === "string") {
      const contentStage: ContentStage = {
        name: contentStageJson,
        condition: undefined,
      };
      return contentStage;
    }

    const contentStage: ContentStage = contentStageJson;
    if (!defined(contentStage.name)) {
      throw new DeveloperError("The contentStage JSON does not define a name");
    }
    contentStage.condition =
      ContentStages.createContentStageCondition(contentStageJson);
    return contentStage;
  }

  static createContentStageCondition(
    contentStageJson: any
  ): PredicateAsync<TilesetEntry> | undefined {
    if (contentStageJson.includedContentTypes) {
      const contentDataCheck = ContentDataTypeChecks.createCheck(
        ...contentStageJson.includedContentTypes
      );
      const condition = async (entry: TilesetEntry) => {
        const contentData = new BufferedContentData(entry.key, entry.value);
        const matches = await contentDataCheck(contentData);
        return matches;
      };
      return condition;
    }
    return undefined;
  }
}

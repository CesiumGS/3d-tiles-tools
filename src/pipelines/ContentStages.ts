import { defined } from "../base/defined";
import { DeveloperError } from "../base/DeveloperError";

import { ContentStage } from "./ContentStage";

/**
 * Methods to create `ContentStage` objects from JSON input.
 */
export class ContentStages {
  public static readonly CONTENT_STAGE_GZIP = "gzip";
  public static readonly CONTENT_STAGE_UNGZIP = "ungzip";
  public static readonly CONTENT_STAGE_B3DM_TO_GLB = "b3dmToGlb";
  public static readonly CONTENT_STAGE_OPTIMIZE_GLB = "optimizeGlb";
  public static readonly CONTENT_STAGE_SEPARATE_GLTF = "separateGltf";

  public static createGzip(
    includedContentTypes: string[] | undefined
  ): ContentStage {
    const contentStage: ContentStage = {
      name: ContentStages.CONTENT_STAGE_GZIP,
      description: "Compresses each entry with GZIP",
      includedContentTypes: includedContentTypes,
    };
    return contentStage;
  }

  public static createUngzip(): ContentStage {
    const contentStage: ContentStage = {
      name: ContentStages.CONTENT_STAGE_UNGZIP,
      description: "Uncompress each entry that was compressed with GZIP",
    };
    return contentStage;
  }

  public static createB3dmToGlb(): ContentStage {
    const contentStage: ContentStage = {
      name: ContentStages.CONTENT_STAGE_B3DM_TO_GLB,
      description: "Convert each B3DM content into GLB",
    };
    return contentStage;
  }

  public static createOptimizeGlb(options: any): ContentStage {
    const contentStage: ContentStage = {
      name: ContentStages.CONTENT_STAGE_OPTIMIZE_GLB,
      description:
        "Apply gltf-pipeline to each GLB content, with the given options",
      options: options,
    };
    return contentStage;
  }

  public static createSeparateGltf(): ContentStage {
    const contentStage: ContentStage = {
      name: ContentStages.CONTENT_STAGE_SEPARATE_GLTF,
      description:
        "Convert each GLB content into a .gltf file with separate resources",
    };
    return contentStage;
  }

  /**
   * Creates a `ContentStage` object from the given (untyped) JSON.
   *
   * @param contentStageJson - The JSON object
   * @returns The `ContentStage` object
   * @throws DeveloperError When the input was not valid
   */
  static createContentStage(contentStageJson: any): ContentStage {
    if (typeof contentStageJson === "string") {
      const contentStage: ContentStage = {
        name: contentStageJson,
      };
      return contentStage;
    }

    const contentStage: ContentStage = contentStageJson;
    if (!defined(contentStage.name)) {
      throw new DeveloperError("The contentStage JSON does not define a name");
    }
    return contentStage;
  }
}

import { defined } from "../../base";
import { DeveloperError } from "../../base";

import { ContentStage } from "./ContentStage";

/**
 * Methods to create `ContentStage` objects
 *
 * @internal
 */
export class ContentStages {
  /**
   * The `name` that identifies the "glbToB3dm" content stage
   */
  public static readonly CONTENT_STAGE_GLB_TO_B3DM = "glbToB3dm";

  /**
   * The `name` that identifies the "glbToI3dm" content stage
   */
  public static readonly CONTENT_STAGE_GLB_TO_I3DM = "glbToI3dm";

  /**
   * The `name` that identifies the "b3dmToGlb" content stage
   */
  public static readonly CONTENT_STAGE_B3DM_TO_GLB = "b3dmToGlb";

  /**
   * The `name` that identifies the "convertB3dmToGlb" content stage
   */
  public static readonly CONTENT_STAGE_CONVERT_B3DM_TO_GLB = "convertB3dmToGlb";

  /**
   * The `name` that identifies the "convertB3dmToGlb" content stage
   */
  public static readonly CONTENT_STAGE_CONVERT_PNTS_TO_GLB = "convertPntsToGlb";

  /**
   * The `name` that identifies the "i3dmToGlb" content stage
   */
  public static readonly CONTENT_STAGE_I3DM_TO_GLB = "i3dmToGlb";

  /**
   * The `name` that identifies the "optimizeB3dm" content stage
   */
  public static readonly CONTENT_STAGE_OPTIMIZE_B3DM = "optimizeB3dm";

  /**
   * The `name` that identifies the "optimizeI3dm" content stage
   */
  public static readonly CONTENT_STAGE_OPTIMIZE_I3DM = "optimizeI3dm";

  /**
   * The `name` that identifies the "optimizeGlb" content stage
   */
  public static readonly CONTENT_STAGE_OPTIMIZE_GLB = "optimizeGlb";

  /**
   * The `name` that identifies the "separateGltf" content stage
   */
  public static readonly CONTENT_STAGE_SEPARATE_GLTF = "separateGltf";

  /**
   * Creates a content stage that performs the "glbToB3dm" operation
   *
   * @returns The content stage
   */
  public static createGlbToB3dm(): ContentStage {
    const contentStage: ContentStage = {
      name: ContentStages.CONTENT_STAGE_GLB_TO_B3DM,
      description: "Convert each GLB into a default B3DM",
    };
    return contentStage;
  }

  /**
   * Creates a content stage that performs the "glbToI3dm" operation
   *
   * @returns The content stage
   */
  public static createGlbToI3dm(): ContentStage {
    const contentStage: ContentStage = {
      name: ContentStages.CONTENT_STAGE_GLB_TO_I3DM,
      description: "Convert each GLB into a default I3DM",
    };
    return contentStage;
  }

  /**
   * Creates a content stage that performs the "b3dmToGlb" operation
   *
   * @returns The content stage
   */
  public static createB3dmToGlb(): ContentStage {
    const contentStage: ContentStage = {
      name: ContentStages.CONTENT_STAGE_B3DM_TO_GLB,
      description: "Extract the GLB payload from B3DM",
    };
    return contentStage;
  }

  /**
   * Creates a content stage that performs the "convertB3dmToGlb" operation
   *
   * @returns The content stage
   */
  public static createConvertB3dmToGlb(): ContentStage {
    const contentStage: ContentStage = {
      name: ContentStages.CONTENT_STAGE_CONVERT_B3DM_TO_GLB,
      description: "Convert each B3DM content into GLB",
    };
    return contentStage;
  }

  /**
   * Creates a content stage that performs the "convertB3dmToGlb" operation
   *
   * @returns The content stage
   */
  public static createConvertPntsToGlb(): ContentStage {
    const contentStage: ContentStage = {
      name: ContentStages.CONTENT_STAGE_CONVERT_PNTS_TO_GLB,
      description: "Convert each PNTS content into GLB",
    };
    return contentStage;
  }

  /**
   * Creates a content stage that performs the "i3dmToGlb" operation
   *
   * @returns The content stage
   */
  public static createI3dmToGlb(): ContentStage {
    const contentStage: ContentStage = {
      name: ContentStages.CONTENT_STAGE_I3DM_TO_GLB,
      description: "Extract the GLB payload from I3DM",
    };
    return contentStage;
  }

  /**
   * Creates a content stage that performs the "optimizeGlb" operation
   *
   * @returns The content stage
   */
  public static createOptimizeB3dm(options: any): ContentStage {
    const contentStage: ContentStage = {
      name: ContentStages.CONTENT_STAGE_OPTIMIZE_B3DM,
      description:
        "Apply gltf-pipeline to the GLB part of each B3DM content, with the given options",
      options: options,
    };
    return contentStage;
  }

  /**
   * Creates a content stage that performs the "optimizeI3dm" operation
   *
   * @returns The content stage
   */
  public static createOptimizeI3dm(options: any): ContentStage {
    const contentStage: ContentStage = {
      name: ContentStages.CONTENT_STAGE_OPTIMIZE_B3DM,
      description:
        "Apply gltf-pipeline to the GLB part of each I3DM content, with the given options",
      options: options,
    };
    return contentStage;
  }

  /**
   * Creates a content stage that performs the "optimizeGlb" operation
   *
   * @returns The content stage
   */
  public static createOptimizeGlb(options: any): ContentStage {
    const contentStage: ContentStage = {
      name: ContentStages.CONTENT_STAGE_OPTIMIZE_GLB,
      description:
        "Apply gltf-pipeline to each GLB content, with the given options",
      options: options,
    };
    return contentStage;
  }

  /**
   * Creates a content stage that performs the "separateGlb" operation
   *
   * @returns The content stage
   */
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

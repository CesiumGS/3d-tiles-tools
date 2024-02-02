import { ContentStage } from "./ContentStage";
import { Stage } from "./Stage";

/**
 * Interface for a stage within a `Pipeline` of
 * operations that should be applied to tileset data.
 *
 * Instances of this class are created with `TilesetStages`
 * and executed with a `TilesetStageExecutor`.
 *
 * @internal
 */
export interface TilesetStage extends Stage {
  /**
   * The `ContentStage` steps representing the sequence of
   * operations that should be applied to content.
   */
  contentStages?: ContentStage[];

  /**
   * An optional array of `ContentDataType` strings that
   * indicates which content types this stage should be
   * applied to.
   *
   * The stage will be applied to types that are contained
   * in the `includedContentTypes`, but NOT contained in
   * the `excludedContentTypes`
   */
  includedContentTypes?: string[];

  /**
   * An optional array of `ContentDataType` strings that
   * indicates which content types this stage should be
   * applied to.
   *
   * The stage will be applied to types that are contained
   * in the `includedContentTypes`, but NOT contained in
   * the `excludedContentTypes`
   */
  excludedContentTypes?: string[];
}

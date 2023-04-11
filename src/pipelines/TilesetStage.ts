import { ContentStage } from "./ContentStage";
import { Stage } from "./Stage";

/**
 * Interface for a stage within a `Pipeline` of
 * operations that should be applied to tileset data.
 *
 * Instances of this class are created with `TilesetStages`
 * and executed with a `TilesetStageExecutor`.
 */
export interface TilesetStage extends Stage {
  /**
   * The `ContentStage` steps representing the sequence of
   * operations that should be applied to content.
   */
  contentStages?: ContentStage[];
}

/**
 * Common base interface for a stage in a pipeline.
 *
 * Specializations are `TilesetStage` and `ContentStage`.
 */
export interface Stage {
  /**
   * The name of this stage.
   */
  name: string;
}

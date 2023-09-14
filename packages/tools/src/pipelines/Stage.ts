/**
 * Common base interface for a stage in a pipeline.
 *
 * Specializations are `TilesetStage` and `ContentStage`.
 *
 * @internal
 */
export interface Stage {
  /**
   * The name of this stage.
   */
  name: string;

  /**
   * An optional description.
   *
   * This should be a single-line, human-readable description that
   * summarizes what the stage is doing.
   */
  description?: string;
}

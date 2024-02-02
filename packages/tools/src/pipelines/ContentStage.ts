import { Stage } from "./Stage";

/**
 * An interface that describes an operation that may be
 * applied to one `TilesetEntry` during the execution
 * of a pipeline.
 *
 * Instances of this are created with the `ContentStages`
 * class, and contained within a `TilesetStage`.
 *
 * @internal
 */
export interface ContentStage extends Stage {
  /**
   * Arbitrary options that may have been given in the
   * input JSON, and will be passed to implementations
   * that may support these options (e.g. `gltf-pipeline`).
   */
  options?: any;
}

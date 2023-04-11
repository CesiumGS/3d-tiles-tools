import { Stage } from "./Stage";

/**
 * An interface that describes an operation that may be
 * applied to one `TilesetEntry` during the execution
 * of a pipeline.
 *
 * Instances of this are created with the `ContentStages`
 * class, and contained within a `TilesetStage`.
 */
export interface ContentStage extends Stage {
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

  /**
   * Arbitrary options that may have been given in the
   * input JSON, and will be passed to implementations
   * that may support these options (e.g. `gltf-pipeline`).
   */
  options?: any;
}

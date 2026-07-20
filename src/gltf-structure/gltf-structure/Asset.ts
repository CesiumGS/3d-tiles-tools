import { GlTFProperty } from "./GlTFProperty";

/**
 * Metadata about the glTF asset.
 * @internal
 */
export interface Asset extends GlTFProperty {
  /**
   * A copyright message suitable for display to credit the content
   * creator.
   */
  copyright?: string;

  /**
   * Tool that generated this glTF model. Useful for debugging.
   */
  generator?: string;

  /**
   * The glTF version in the form of `<major>.<minor>` that this asset
   * targets.
   */
  version: string;

  /**
   * The minimum glTF version in the form of `<major>.<minor>` that this
   * asset targets. This property **MUST NOT** be greater than the asset
   * version.
   */
  minVersion?: string;
}

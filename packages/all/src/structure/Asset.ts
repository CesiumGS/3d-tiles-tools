import { RootProperty } from "./RootProperty";

/**
 * Metadata about the entire tileset.
 * @internal
 */
export interface Asset extends RootProperty {
  /**
   * The 3D Tiles version. The version defines the JSON schema for the
   * tileset JSON and the base set of tile formats.
   */
  version: string;

  /**
   * Application-specific version of this tileset e.g. for when an existing
   * tileset is updated.
   */
  tilesetVersion?: string;
}

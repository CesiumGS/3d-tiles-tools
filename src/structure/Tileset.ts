import { RootProperty } from "./RootProperty";
import { Asset } from "./Asset";
import { Properties } from "./Properties";
import { Schema } from "./Metadata/Schema";
import { Statistics } from "./Statistics";
import { Group } from "./Group";
import { MetadataEntity } from "./MetadataEntity";
import { Tile } from "./Tile";

/**
 * A 3D Tiles tileset.
 * @internal
 */
export interface Tileset extends RootProperty {
  /**
   * Metadata about the entire tileset.
   */
  asset: Asset;

  /**
   * A dictionary object of metadata about per-feature properties.
   */
  properties?: { [key: string]: Properties };

  /**
   * An object defining the structure of metadata classes and enums. When
   * this is defined then `schemaUri` shall be undefined.
   */
  schema?: Schema;

  /**
   * The URI (or IRI) of the external schema file. When this is defined
   * then `schema` shall be undefined.
   */
  schemaUri?: string;

  /**
   * An object containing statistics about metadata entities.
   */
  statistics?: Statistics;

  /**
   * An array of groups that tile content may belong to. Each element of
   * this array is a metadata entity that describes the group. The tile
   * content `group` property is an index into this array.
   */
  groups?: Group[];

  /**
   * A metadata entity that is associated with this tileset.
   */
  metadata?: MetadataEntity;

  /**
   * The error in meters introduced if this tileset is not rendered. At
   * runtime the geometric error is used to compute screen space error
   * (SSE) i.e. the error measured in pixels.
   */
  geometricError: number;

  /**
   * The root tile.
   */
  root: Tile;

  /**
   * Names of 3D Tiles extensions used somewhere in this tileset.
   */
  extensionsUsed?: string[];

  /**
   * Names of 3D Tiles extensions required to properly load this tileset.
   * Each element of this array shall also be contained in
   * `extensionsUsed`.
   */
  extensionsRequired?: string[];
}

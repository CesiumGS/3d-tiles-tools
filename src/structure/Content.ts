import { RootProperty } from "./RootProperty";
import { BoundingVolume } from "./BoundingVolume";
import { MetadataEntity } from "./MetadataEntity";

/**
 * Metadata about the tile's content and a link to the content.
 * @internal
 */
export interface Content extends RootProperty {
  /**
   * An optional bounding volume that tightly encloses tile content.
   * tile.boundingVolume provides spatial coherence and
   * tile.content.boundingVolume enables tight view frustum culling. When
   * this is omitted tile.boundingVolume is used.
   */
  boundingVolume?: BoundingVolume;

  /**
   * A uri that points to tile content. When the uri is relative it is
   * relative to the referring tileset JSON file.
   */
  uri: string;

  /**
   * Metadata that is associated with this content.
   */
  metadata?: MetadataEntity;

  /**
   * The group this content belongs to. The value is an index into the
   * array of `groups` that is defined for the containing tileset.
   */
  group?: number;
}

import { Tile } from "../structure/Tile";
import { Content } from "../structure/Content";
import { MetadataEntity } from "../structure/MetadataEntity";
import { TileImplicitTiling } from "../structure/TileImplicitTiling";

/**
 * An interface that summarizes context information for
 * a tile during traversal.
 *
 * @internal
 */
export interface TraversedTile {
  /**
   * Returns a `Tile` object that contains the "JSON"-representation
   * of the tile. This is just a plain data structure corresponding
   * the tile.
   *
   * Values that may be overridden (for example, via metadata semantics)
   * are already substituted in the returned object.
   *
   * This means that the return value of this method reflects the
   * actual tile if and only if the underlying metadata was valid.
   *
   * @returns A `Tile` with information about this traversed tile
   * @throws ImplicitTilingError If the representation of this traversed
   * tile could not be created due to invalid input structures.
   */
  asTile(): Tile;

  /**
   * Returns the level of the tile in the traversed hierarchy, with
   * 0 being the root tile.
   *
   * @returns The level
   */
  get level(): number;

  /**
   * Returns a path that identifies this tile within the hierarchy.
   *
   * This resembles a JSON path. But for cases like implicit tilesets,
   * it may contain elements that are not part of the JSONPath format.
   * It may therefore only be used as a semi-human-readable identifier.
   *
   * @returns The path
   */
  get path(): string;

  /**
   * Returns the parent of this tile, or `undefined` if this is the
   * root tile.
   *
   * @returns The parent tile
   */
  getParent(): TraversedTile | undefined;

  /**
   * Returns the children of this tile.
   *
   * For external tilesets or implicit tiling, this may have to
   * resolve external resources, and therefore, returns a promise
   * that is resolved when the required child tiles are available.
   *
   * @returns The children
   * @throws ImplicitTilingError When there was an error while
   * trying to obtain the traversed children. This may be caused
   * by invalid input structures, or when a required resource
   * (like a subtree file or one of its buffers) could not
   * be resolved.
   */
  getChildren(): Promise<TraversedTile[]>;

  /**
   * Returns the `Content` objects of the tile.
   *
   * This is either an empty array (when the tile does not have
   * content), or a single-element array (when the tile has a
   * single `tile.content` object), or an array that resembles
   * the `tile.contents` array.
   *
   * @returns The contents
   */
  getContents(): Content[];

  // TODO Some information has to be exposed here solely
  // for the validation. This should preferably not be
  // visible in this interface. The traversal might be
  // refactored to hide this information here.
  getSubtreeUri(): string | undefined;
  getImplicitTiling(): TileImplicitTiling | undefined;
  getMetadata(): MetadataEntity | undefined;
}

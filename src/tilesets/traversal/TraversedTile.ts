import { ResourceResolver } from "../../base";

import { Tile } from "../../structure";
import { Content } from "../../structure";

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
   * to the tile.
   *
   * The returned object reflects the "raw" state of the object that
   * is either contained in the tileset JSON, or derived from the
   * subdivision rules of implicit tiles. Specifically: This is the
   * state BEFORE any semantic-based overrides have been applied.
   * When there is metadata associated with the object, and this
   * metadata has semantics that override certain properties, then
   * these overrides are NOT reflected in the returned object.
   *
   * In order to obtain a tile where the semantic-based overrides
   * are applied, `asFinalTile` can be used.
   *
   * Note that there are no guarantees about identities for the
   * returned object. This means that callers should NOT modify
   * the returned object or any of its properties, because they
   * may be the actual objects that are stored in the tileset
   * JSON.
   *
   * @returns A `Tile` with information about this traversed tile
   * @throws ImplicitTilingError If the representation of this traversed
   * tile could not be created due to invalid input structures.
   */
  asRawTile(): Tile;

  /**
   * Returns a `Tile` object that contains the "JSON"-representation
   * of the tile. This is just a plain data structure corresponding
   * to the tile.
   *
   * In contrast to `asRawTile`, this method returns a `Tile` object
   * where semantic-based overrides have already been applied. When
   * there is metadata associated with the tile, and this metadata
   * has semantics that override certain tile properties, then these
   * overrides ARE reflected in the returned tile.
   *
   * @returns A `Tile` with information about this traversed tile
   * @throws ImplicitTilingError If the representation of this traversed
   * tile could not be created due to invalid input structures.
   */
  asFinalTile(): Tile;

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
   * The exact format is not specified. Callers should not rely on
   * the format.
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
   * Note that the returned content objects may contain
   * template URIs for tiles that are roots of implicit
   * tilesets. Use `isImplicitTilesetRoot` to detect
   * whether this tile is the root of an implicit tileset,
   * and the content URIs may be template URIs.
   *
   * The returned content objects reflect the state BEFORE
   * any semantic-based overrides have been applied.
   * See `asRawTile` for details about the semantic-based
   * overrides.
   *
   * @returns The contents
   */
  getRawContents(): Content[];

  /**
   * Returns the `Content` objects of the tile.
   *
   * The returned objects correspond to the ones returned by
   * `getRawContents`, but in a state where semantic-based
   * overrides have been applied.
   *
   * See `asRawTile` and `asFinalTile` for details about the
   * semantic-based overrides.
   *
   * @returns The contents
   */
  getFinalContents(): Content[];

  /**
   * Returns the `ResourceResolver` that can be used for
   * resolving the data that appears as `content.uri` in
   * this tile.
   *
   * @returns The `ResourceResolver`
   */
  getResourceResolver(): ResourceResolver;

  /**
   * Returns whether this tile is the root of an implicit tileset.
   *
   * This is `true` for tiles that appear in the explicit
   * tile hierarchy of a tileset JSON, and which have a
   * `tile.implicitTiling` property.
   *
   * For these tiles, the `content.uri` properties do not define
   * actual URIs, but *template* URIs.
   *
   * @returns Whether this is an implicit tileset root
   */
  isImplicitTilesetRoot(): boolean;

  /**
   * Returns the URI of the subtree file for this tile, or
   * `undefined` if this is not the root of a subtree.
   *
   * If this tile is the root of a subtree in an implicit tileset, then
   * the returned URI will contain the actual subtree URI that was
   * created by substituting the coordinates of this tile into the
   * `implicitTiling.subtrees.uri` template URI.
   *
   * @returns The subtree URI, or `undefined`
   */
  getSubtreeUri(): string | undefined;
}

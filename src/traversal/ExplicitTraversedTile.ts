import { ResourceResolver } from "../io/ResourceResolver";

import { TraversedTile } from "./TraversedTile";
import { ExplicitTraversedTiles } from "./ExplicitTraversedTiles";
import { MetadataSemanticOverrides } from "./MetadataSemanticOverrides";

import { Tile } from "../structure/Tile";
import { Content } from "../structure/Content";
import { TileImplicitTiling } from "../structure/TileImplicitTiling";
import { MetadataEntity } from "../structure/MetadataEntity";
import { Schema } from "../structure/Metadata/Schema";

import { ImplicitTilingError } from "../implicitTiling/ImplicitTilingError";
import { ImplicitTilings } from "../implicitTiling/ImplicitTilings";

import { MetadataEntityModels } from "../metadata/MetadataEntityModels";

/**
 * An implementation of a `TraversedTile` that reflects a tile
 * that actually appears as a JSON representation in the tileset.
 *
 * @internal
 */
export class ExplicitTraversedTile implements TraversedTile {
  /**
   * The parent tile, or `undefined` if this is the root
   */
  private readonly _parent: TraversedTile | undefined;

  /**
   * The `Tile` object that this traversed tile was created for
   */
  private readonly _tile: Tile;

  /**
   * A JSON-path like path identifying this tile
   */
  private readonly _path: string;

  /**
   * The global level. This is the level starting at the
   * root of the tileset.
   */
  private readonly _level: number;

  /**
   * The metadata schema in the context of which this tile
   * is created. This is the schema that was obtained from
   * the `tileset.schema` or `tileset.schemaUri`. If this
   * is defined, it is assumed to be valid. If it is
   * undefined and a tile with metadata is encountered,
   * then an error will be thrown in `asTile`.
   */
  private readonly _schema: Schema | undefined;

  /**
   * The `ResourceResolver` that will resolve resources
   * that may be required if this is the root of an
   * implicit tileset (e.g. the subtree files).
   */
  private readonly _resourceResolver;

  constructor(
    tile: Tile,
    path: string,
    level: number,
    parent: TraversedTile | undefined,
    schema: Schema | undefined,
    resourceResolver: ResourceResolver
  ) {
    this._tile = tile;
    this._path = path;
    this._level = level;
    this._parent = parent;
    this._schema = schema;
    this._resourceResolver = resourceResolver;
  }

  asRawTile(): Tile {
    return this._tile;
  }

  asFinalTile(): Tile {
    const tile = this._tile;

    const finalTile = {
      boundingVolume: tile.boundingVolume,
      viewerRequestVolume: tile.viewerRequestVolume,
      geometricError: tile.geometricError,
      refine: tile.refine,
      transform: tile.transform,
      content: tile.content,
      contents: tile.contents,
      children: tile.children,
      metadata: tile.metadata,
      implicitTiling: tile.implicitTiling,
      extensions: tile.extensions,
      extras: tile.extras,
    };

    const schema = this._schema;
    const metadata = tile.metadata;
    if (metadata && schema) {
      this.applyMetadataSemanticOverrides(finalTile);
    }
    return finalTile;
  }

  /**
   * Perform the overrides of the properties of the given tile that
   * are given by metadata semantics.
   *
   * If this instance contains a `Schema` and a `MetadataEntity`,
   * then the property values of that metadata entity are examined.
   * The property values that have a semantic will be used to
   * override the corresponding values in the given tile.
   *
   * For example, when the metadata entity has a property with the
   * semantic `TILE_GEOMETRIC_ERROR`, then the `geometricError` in
   * the given tile will be replaced with the corresponding value
   * from the metadata entity.
   *
   * @param finalTile - The tile
   * @throws ImplicitTilingError If the input (for example, the
   * schema and the metadata entity) are not structurally valid.
   */
  private applyMetadataSemanticOverrides(finalTile: Tile) {
    const schema = this._schema;
    const metadata = this._tile.metadata;
    if (!metadata || !schema) {
      return;
    }

    let metadataEntityModel = undefined;
    try {
      metadataEntityModel = MetadataEntityModels.create(schema, metadata);
    } catch (error) {
      const message = `Error while traversing tileset: ${error}`;
      throw new ImplicitTilingError(message);
    }
    MetadataSemanticOverrides.applyToTile(finalTile, metadataEntityModel);
  }

  get path(): string {
    return this._path;
  }
  get level(): number {
    return this._level;
  }

  getParent(): TraversedTile | undefined {
    return this._parent;
  }

  async getChildren(): Promise<TraversedTile[]> {
    const implicitTiling = this._tile.implicitTiling;
    const schema = this._schema;
    if (implicitTiling) {
      const children = await ExplicitTraversedTiles.createTraversedChildren(
        implicitTiling,
        schema,
        this,
        this._resourceResolver
      );
      return children;
    }

    if (!this._tile.children) {
      return [];
    }
    const children = this._tile.children;
    const childLevel = this._level + 1;
    const traversedChildren = [];
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const childPath = this.path + "/children/" + i;
      const traversedChild = new ExplicitTraversedTile(
        child,
        childPath,
        childLevel,
        this,
        this._schema,
        this._resourceResolver
      );
      traversedChildren.push(traversedChild);
    }
    return traversedChildren;
  }

  getContents(): Content[] {
    if (this._tile.content) {
      return [this._tile.content];
    }
    if (this._tile.contents) {
      return this._tile.contents;
    }
    return [];
  }

  getSubtreeUri(): string | undefined {
    const implicitTiling = this._tile.implicitTiling;
    if (implicitTiling) {
      const rootCoordinates =
        ImplicitTilings.createRootCoordinates(implicitTiling);
      const subtreeUri = ImplicitTilings.substituteTemplateUri(
        implicitTiling.subdivisionScheme,
        implicitTiling.subtrees.uri,
        rootCoordinates
      );
      return subtreeUri;
    }
    return undefined;
  }

  getImplicitTiling(): TileImplicitTiling | undefined {
    return this._tile.implicitTiling;
  }

  getMetadata(): MetadataEntity | undefined {
    return this._tile.metadata;
  }

  // TODO For debugging
  toString = (): string => {
    return `ExplicitTraversedTile, level ${this.level}, path ${this.path}`;
  };
}

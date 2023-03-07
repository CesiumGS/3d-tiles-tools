import { defined } from "../base/defined";

import { ResourceResolver } from "../io/ResourceResolver";

import { TraversedTile } from "./TraversedTile";
import { ImplicitTileTraversal } from "./ImplicitTileTraversal";

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

  asTile(): Tile {
    const tile = this._tile;

    const schema = this._schema;
    const metadata = tile.metadata;

    const boundingVolume = tile.boundingVolume;
    let transform = tile.transform;
    let refine = tile.refine;
    let geometricError = tile.geometricError;

    if (metadata && schema) {
      let metadataEntityModel = undefined;
      try {
        metadataEntityModel = MetadataEntityModels.create(schema, metadata);
      } catch (error) {
        // Errors from creating the entity model should have been
        // prevented by the metadata- and schema validation:
        const message = `Error while traversing tileset: ${error}`;
        throw new ImplicitTilingError(message);
      }
      if (metadataEntityModel) {
        // Apply the semantic-based overrides from the metadata
        const semanticBoundingBox =
          metadataEntityModel.getPropertyValueBySemantic("TILE_BOUNDING_BOX");
        if (semanticBoundingBox) {
          boundingVolume.box = semanticBoundingBox;
        }

        const semanticBoundingRegion =
          metadataEntityModel.getPropertyValueBySemantic(
            "TILE_BOUNDING_REGION"
          );
        if (semanticBoundingRegion) {
          boundingVolume.region = semanticBoundingRegion;
        }

        const semanticBoundingSphere =
          metadataEntityModel.getPropertyValueBySemantic(
            "TILE_BOUNDING_SPHERE"
          );
        if (semanticBoundingSphere) {
          boundingVolume.sphere = semanticBoundingSphere;
        }

        const semanticGeometricError =
          metadataEntityModel.getPropertyValueBySemantic(
            "TILE_GEOMETRIC_ERROR"
          );
        if (defined(semanticGeometricError)) {
          geometricError = semanticGeometricError as number;
        }

        const semanticRefine =
          metadataEntityModel.getPropertyValueBySemantic("TILE_REFINE");
        if (semanticRefine === 0) {
          refine = "ADD";
        } else if (semanticRefine === 1) {
          refine = "REPLACE";
        }

        const semanticTransform =
          metadataEntityModel.getPropertyValueBySemantic("TILE_TRANSFORM");
        if (semanticTransform) {
          transform = semanticTransform;
        }
      }
    }

    const viewerRequestVolume = tile.viewerRequestVolume;
    const content = tile.content;
    const contents = tile.contents;
    const children = tile.children;
    const implicitTiling = tile.implicitTiling;
    const extensions = tile.extensions;
    const extras = tile.extras;

    return {
      boundingVolume: boundingVolume,
      viewerRequestVolume: viewerRequestVolume,
      geometricError: geometricError,
      refine: refine,
      transform: transform,
      content: content,
      contents: contents,
      children: children,
      metadata: metadata,
      implicitTiling: implicitTiling,
      extensions: extensions,
      extras: extras,
    };
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
    if (implicitTiling) {
      const children = await ImplicitTileTraversal.createTraversedChildren(
        implicitTiling,
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

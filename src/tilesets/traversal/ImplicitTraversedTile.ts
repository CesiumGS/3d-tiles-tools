import { defined } from "../../base";
import { ResourceResolver } from "../../base";
import { TreeCoordinates } from "../../base";

import { Tile } from "../../structure";
import { Content } from "../../structure";
import { TileImplicitTiling } from "../../structure";

import { TraversedTile } from "./TraversedTile";
import { SubtreeModel } from "./SubtreeModel";
import { SubtreeModels } from "./SubtreeModels";

import { ImplicitTilingError } from "../implicitTiling/ImplicitTilingError";
import { ImplicitTilings } from "../implicitTiling/ImplicitTilings";

import { BoundingVolumeDerivation } from "./cesium/BoundingVolumeDerivation";
import { MetadataSemanticOverrides } from "./MetadataSemanticOverrides";

import { Tiles } from "../tilesets/Tiles";

/**
 * An implementation of a `TraversedTile` that represents a tile
 * within an implicit tileset during its traversal.
 *
 * @internal
 */
export class ImplicitTraversedTile implements TraversedTile {
  /**
   * The `TileImplicitTiling` that this tile belongs to
   */
  private readonly _implicitTiling: TileImplicitTiling;

  /**
   * The `ResourceResolver` that will be used for loading
   * subtree files.
   */
  private readonly _resourceResolver: ResourceResolver;

  /**
   * The tile that corresponds to the root tile from the
   * tileset JSON (i.e. the one that contained the
   * `TileImplicitTiling` object)
   */
  private readonly _root: TraversedTile;

  /**
   * A JSON-path like path identifying this tile
   */
  private readonly _path: string;

  /**
   * The `SubtreeModel` object that will be used for accessing
   * the availability information and metadata for the subtree
   * that this tile belongs to.
   */
  private readonly _subtreeModel: SubtreeModel;

  /**
   * The global level of this tile. This refers to the
   * root of the tileset.
   */
  private readonly _globalLevel: number;

  /**
   * The global coordinate of this tile within the implicit tileset.
   */
  private readonly _globalCoordinate: TreeCoordinates;

  /**
   * The root coordinate of the subtree that this tile belongs
   * to, within the whole implicit tileset.
   */
  private readonly _rootCoordinate: TreeCoordinates;

  /**
   * The local coordinate of this tile within the subtree that
   * starts at the `_rootCoordinate`
   */
  private readonly _localCoordinate: TreeCoordinates;

  /**
   * The parent tile
   */
  private readonly _parent: TraversedTile;

  constructor(
    implicitTiling: TileImplicitTiling,
    resourceResolver: ResourceResolver,
    root: TraversedTile,
    path: string,
    subtreeModel: SubtreeModel,
    globalLevel: number,
    globalCoordinate: TreeCoordinates,
    rootCoordinate: TreeCoordinates,
    localCoordinate: TreeCoordinates,
    parent: TraversedTile
  ) {
    this._implicitTiling = implicitTiling;
    this._resourceResolver = resourceResolver;
    this._root = root;
    this._path = path;
    this._subtreeModel = subtreeModel;
    this._globalLevel = globalLevel;
    this._globalCoordinate = globalCoordinate;
    this._rootCoordinate = rootCoordinate;
    this._localCoordinate = localCoordinate;
    this._parent = parent;
  }

  /** {@inheritDoc TraversedTile.asRawTile} */
  asRawTile(): Tile {
    const rootTile = this._root.asFinalTile();

    const boundingVolume = BoundingVolumeDerivation.deriveBoundingVolume(
      rootTile.boundingVolume,
      this._globalCoordinate.toArray()
    );
    if (!boundingVolume) {
      // The bounding volume was not a region, box, or S2 Cell.
      throw new ImplicitTilingError("Could not subdivide bounding volume");
    }
    const level = this._globalCoordinate.level;
    const geometricError = rootTile.geometricError / Math.pow(2, level);

    const viewerRequestVolume = rootTile.viewerRequestVolume;
    const refine = rootTile.refine;
    const transform = undefined;
    const metadata = undefined;
    const implicitTiling = undefined;
    const extensions = undefined;
    const extras = undefined;

    const tile = {
      boundingVolume: boundingVolume,
      viewerRequestVolume: viewerRequestVolume,
      geometricError: geometricError,
      refine: refine,
      transform: transform,
      metadata: metadata,
      implicitTiling: implicitTiling,
      extensions: extensions,
      extras: extras,
    };
    Tiles.setContents(tile, this.getRawContents());
    return tile;
  }

  /** {@inheritDoc TraversedTile.asFinalTile} */
  asFinalTile(): Tile {
    const tile = this.asRawTile();
    Tiles.setContents(tile, this.getFinalContents());

    const subtreeMetadataModel = this._subtreeModel.subtreeMetadataModel;
    if (subtreeMetadataModel) {
      const tileIndex = this._localCoordinate.toIndex();
      MetadataSemanticOverrides.applyImplicitTileMetadataSemanticOverrides(
        tile,
        tileIndex,
        subtreeMetadataModel
      );
    }
    return tile;
  }

  /** {@inheritDoc TraversedTile.path} */
  get path(): string {
    return this._path;
  }

  /** {@inheritDoc TraversedTile.level} */
  get level(): number {
    return this._globalLevel;
  }

  /**
   * Returns the local coordinate of this implicit tile.
   *
   * This is the coordinate referring to the nearest subtree root.
   *
   * @returns The local coordinate
   */
  getLocalCoordinate(): TreeCoordinates {
    return this._localCoordinate;
  }

  /**
   * Returns the global coordinate of this implicit tile.
   *
   * This is the coordinate referring to the root of the
   * implicit tile hierarchy.
   *
   * @returns The global coordinate
   */
  getGlobalCoordinate(): TreeCoordinates {
    return this._globalCoordinate;
  }

  /** {@inheritDoc TraversedTile.getParent} */
  getParent(): TraversedTile | undefined {
    return this._parent;
  }

  /** {@inheritDoc TraversedTile.getChildren} */
  async getChildren(): Promise<TraversedTile[]> {
    const localLevel = this._localCoordinate.level;
    if (localLevel === this._implicitTiling.subtreeLevels - 1) {
      const children = await this.createNextSubtreeLevelChildren();
      return children;
    }
    const children = await this.createDirectChildren();
    return children;
  }

  /**
   * Creates the children for this tile at which a new subtree starts.
   *
   * This assumes that this tile is in the last level of the subtree
   * that it belongs to. This method will create one child tile for
   * each available child subtree. These children will be the "local
   * roots" of their respective subtree.
   *
   * @returns The children
   * @throws ImplicitTilingError If the input data was invalid
   */
  private async createNextSubtreeLevelChildren(): Promise<TraversedTile[]> {
    const subtreeInfo = this._subtreeModel.subtreeInfo;
    const traversedChildren: TraversedTile[] = [];
    const localChildCoordinates = this._localCoordinate.children();
    for (const localChildCoordinate of localChildCoordinates) {
      const globalChildCoordinate = ImplicitTilings.globalizeCoordinates(
        this._implicitTiling,
        this._rootCoordinate,
        localChildCoordinate
      );
      const childSubtreeAvailability = subtreeInfo.childSubtreeAvailabilityInfo;
      const childSubtreeAvailable = childSubtreeAvailability.isAvailable(
        localChildCoordinate.toIndexInLevel()
      );
      if (childSubtreeAvailable) {
        const schema = this._subtreeModel.subtreeMetadataModel?.schema;

        const childSubtreeModel = await SubtreeModels.resolve(
          this._implicitTiling,
          schema,
          this._resourceResolver,
          globalChildCoordinate
        );

        const childLocalCoordinate = ImplicitTilings.createRootCoordinates(
          this._implicitTiling
        );
        // The path is composed from the path of the root and the string
        // representation of the global coordinates of the child
        const coordinateString = ImplicitTilings.createString(
          globalChildCoordinate
        );
        const childPath = `${this._root.path}/${coordinateString}`;

        const traversedChild = new ImplicitTraversedTile(
          this._implicitTiling,
          this._resourceResolver,
          this._root,
          childPath,
          childSubtreeModel,
          this._globalLevel + 1,
          globalChildCoordinate,
          globalChildCoordinate,
          childLocalCoordinate,
          this
        );
        traversedChildren.push(traversedChild);
      }
    }
    return traversedChildren;
  }

  /**
   * Creates the children for this tile that are still within the same subtree.
   *
   * This assumes that this tile is **NOT** in the last level of the subtree.
   * It will return all children that are marked as available, via the
   * tile availability information in the subtree that this tile belongs to.
   *
   * @returns The children
   * @throws ImplicitTilingError If the input data was invalid
   */
  private async createDirectChildren(): Promise<TraversedTile[]> {
    const subtreeInfo = this._subtreeModel.subtreeInfo;
    const tileAvailabilityInfo = subtreeInfo.tileAvailabilityInfo;
    const localChildCoordinates = this._localCoordinate.children();
    const traversedChildren: TraversedTile[] = [];
    for (const localChildCoordinate of localChildCoordinates) {
      const available = tileAvailabilityInfo.isAvailable(
        localChildCoordinate.toIndex()
      );
      if (available) {
        const globalChildCoordinate = ImplicitTilings.globalizeCoordinates(
          this._implicitTiling,
          this._rootCoordinate,
          localChildCoordinate
        );

        // The path is composed from the path of the root and the string
        // representation of the global coordinates of the child
        const coordinateString = ImplicitTilings.createString(
          globalChildCoordinate
        );
        const childPath = `${this._root.path}/${coordinateString}`;

        const traversedChild = new ImplicitTraversedTile(
          this._implicitTiling,
          this._resourceResolver,
          this._root,
          childPath,
          this._subtreeModel,
          this._globalLevel + 1,
          globalChildCoordinate,
          this._rootCoordinate,
          localChildCoordinate,
          this
        );
        traversedChildren.push(traversedChild);
      }
    }
    return traversedChildren;
  }

  /** {@inheritDoc TraversedTile.getRawContents} */
  getRawContents(): Content[] {
    const contents: Content[] = [];
    const subtreeInfo = this._subtreeModel.subtreeInfo;
    const contentAvailabilityInfos = subtreeInfo.contentAvailabilityInfos;
    const tileIndex = this._localCoordinate.toIndex();
    for (const contentAvailabilityInfo of contentAvailabilityInfos) {
      const available = contentAvailabilityInfo.isAvailable(tileIndex);
      if (available) {
        const templateUri = this._root.asRawTile().content?.uri;
        if (defined(templateUri)) {
          const contentUri = ImplicitTilings.substituteTemplateUri(
            this._implicitTiling.subdivisionScheme,
            templateUri,
            this._globalCoordinate
          );
          const content: Content = {
            boundingVolume: undefined,
            uri: contentUri,
            metadata: undefined,
            group: undefined,
          };
          contents.push(content);
        } else {
          throw new ImplicitTilingError(
            "The root of the implicit tileset did not define a template URI"
          );
        }
      }
    }
    return contents;
  }

  /** {@inheritDoc TraversedTile.getFinalContents} */
  getFinalContents(): Content[] {
    const contents = this.getRawContents();
    const subtreeMetadataModel = this._subtreeModel.subtreeMetadataModel;
    if (!subtreeMetadataModel) {
      return contents;
    }
    const tileIndex = this._localCoordinate.toIndex();
    for (let i = 0; i < contents.length; i++) {
      const content = contents[i];
      MetadataSemanticOverrides.applyImplicitContentMetadataSemanticOverrides(
        content,
        i,
        tileIndex,
        subtreeMetadataModel
      );
    }
    return contents;
  }

  /** {@inheritDoc TraversedTile.getResourceResolver} */
  getResourceResolver(): ResourceResolver {
    return this._resourceResolver;
  }

  /** {@inheritDoc TraversedTile.isImplicitTilesetRoot} */
  isImplicitTilesetRoot(): boolean {
    return false;
  }

  /** {@inheritDoc TraversedTile.getSubtreeUri} */
  getSubtreeUri(): string | undefined {
    const localCoordinate = this._localCoordinate;
    if (localCoordinate.level === 0) {
      const globalCoordinate = this._globalCoordinate;
      const implicitTiling = this._implicitTiling;
      const subtreeUri = ImplicitTilings.substituteTemplateUri(
        implicitTiling.subdivisionScheme,
        implicitTiling.subtrees.uri,
        globalCoordinate
      );
      return subtreeUri;
    }
    return undefined;
  }

  /**
   * Creates a string representation of this tile.
   *
   * The exact format is not specified, but it will contain information
   * that is suitable for identifying this tile within a tile hierarchy.
   *
   * @returns The string
   */
  toString = (): string => {
    return (
      `ImplicitTraversedTile[` +
      `level=${this._globalLevel}, ` +
      `global=${this._globalCoordinate}, ` +
      `root=${this._rootCoordinate}, ` +
      `local=${this._localCoordinate}]`
    );
  };
}

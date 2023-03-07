import path from "path";

import { defined } from "../base/defined";
import { Buffers } from "../base/Buffers";

import { ResourceResolver } from "../io/ResourceResolver";

import { TraversedTile } from "./TraversedTile";
import { ExplicitTraversedTile } from "./ExplicitTraversedTile";
import { ImplicitTraversedTile } from "./ImplicitTraversedTile";

import { Subtree } from "../structure/Subtree";
import { TileImplicitTiling } from "../structure/TileImplicitTiling";

import { SubtreeInfos } from "../implicitTiling/SubtreeInfos";
import { TreeCoordinates } from "../implicitTiling/TreeCoordinates";
import { SubtreeInfo } from "../implicitTiling/SubtreeInfo";
import { ImplicitTilingError } from "../implicitTiling/ImplicitTilingError";
import { ImplicitTilings } from "../implicitTiling/ImplicitTilings";

/**
 * Methods related to the traversal of implicit tilesets.
 *
 * @internal
 */
export class ImplicitTileTraversal {
  /**
   * Create the traversed children for the given explicit traversed tile.
   *
   * This method will be called from `ExplicitTraversedTile` instances
   * when the contain `implicitTiling` information, in order to create
   * the traversed children.
   *
   * The children will then be a single-element array that contains the
   * root node of the implicit tileset, as an `ImplicitTraversedTile`.
   *
   * @param implicitTiling - The `TileImplicitTiling`
   * @param parent - The `ExplicitTraversedTile`
   * @param resourceResolver - The `ResourceResolver` that
   * will be used e.g. for subtree files
   * @returns The traversed children
   * @throws ImplicitTilingError If the input was structurally invalid
   */
  static async createTraversedChildren(
    implicitTiling: TileImplicitTiling,
    parent: ExplicitTraversedTile,
    resourceResolver: ResourceResolver
  ): Promise<TraversedTile[]> {
    const subdivisionScheme = implicitTiling.subdivisionScheme;
    if (subdivisionScheme === "QUADTREE") {
      const child = await ImplicitTileTraversal.createImplicitQuadtreeRoot(
        implicitTiling,
        parent,
        resourceResolver
      );
      return [child];
    }
    if (subdivisionScheme === "OCTREE") {
      const child = await ImplicitTileTraversal.createImplicitOctreeRoot(
        implicitTiling,
        parent,
        resourceResolver
      );
      return [child];
    }
    throw new ImplicitTilingError(
      "Invalid subdivisionScheme: " + subdivisionScheme
    );
  }

  /**
   * Creates the root node for the traversal of an implicit quadtree.
   *
   * @param implicitTiling - The `TileImplicitTiling`
   * @param parent - The `ExplicitTraversedTile`
   * @param resourceResolver - The `ResourceResolver` that
   * will be used e.g. for subtree files
   * @returns The root of an implicit quadtree
   * @throws ImplicitTilingError If the input was structurally invalid
   */
  private static async createImplicitQuadtreeRoot(
    implicitTiling: TileImplicitTiling,
    parent: ExplicitTraversedTile,
    resourceResolver: ResourceResolver
  ): Promise<TraversedTile> {
    const rootCoordinates =
      ImplicitTilings.createRootCoordinates(implicitTiling);
    const subtreeInfo = await ImplicitTileTraversal.resolveSubtreeInfo(
      implicitTiling,
      resourceResolver,
      rootCoordinates
    );
    // The path is composed from the path of the parent and the string
    // representation of the root coordinates
    const coordinateString = ImplicitTilings.createString(rootCoordinates);
    const path = `${parent.path}/${coordinateString}`;
    const root = new ImplicitTraversedTile(
      implicitTiling,
      resourceResolver,
      parent,
      path,
      subtreeInfo,
      parent.level + 1,
      rootCoordinates,
      rootCoordinates,
      rootCoordinates,
      parent
    );
    return root;
  }

  /**
   * Creates the root node for the traversal of an implicit octree.
   *
   * @param implicitTiling - The `TileImplicitTiling`
   * @param parent - The `ExplicitTraversedTile`
   * @param resourceResolver - The `ResourceResolver` that
   * will be used e.g. for subtree files
   * @returns The root of an implicit octree
   * @throws ImplicitTilingError If the input was structurally invalid
   */
  private static async createImplicitOctreeRoot(
    implicitTiling: TileImplicitTiling,
    parent: ExplicitTraversedTile,
    resourceResolver: ResourceResolver
  ): Promise<TraversedTile> {
    const rootCoordinates =
      ImplicitTilings.createRootCoordinates(implicitTiling);
    const subtreeInfo = await ImplicitTileTraversal.resolveSubtreeInfo(
      implicitTiling,
      resourceResolver,
      rootCoordinates
    );
    // The path is composed from the path of the parent and the string
    // representation of the root coordinates
    const coordinateString = ImplicitTilings.createString(rootCoordinates);
    const path = `${parent.path}/${coordinateString}`;
    const root = new ImplicitTraversedTile(
      implicitTiling,
      resourceResolver,
      parent,
      path,
      subtreeInfo,
      parent.level + 1,
      rootCoordinates,
      rootCoordinates,
      rootCoordinates,
      parent
    );
    return root;
  }

  /**
   * Resolve the `SubtreeInfo` for the subtree with the given root coordinates.
   *
   * This will substitute the given coordinates into the subtree template
   * URI from the given implicit tiling object. Then it will attempt to load
   * the subtree data from this URI. The resulting data will be used to
   * construct the `SubtreeInfo` object.
   *
   * @param implicitTiling - The `TileImplicitTiling`
   * @param resourceResolver - The `ResourceResolver` for the subtree
   * files and buffers
   * @param coordinates - The root coordinates of the subtree
   * @returns The `SubtreeInfo`
   * @throws ImplicitTilingError If the input was structurally invalid
   */
  static async resolveSubtreeInfo(
    implicitTiling: TileImplicitTiling,
    resourceResolver: ResourceResolver,
    coordinates: TreeCoordinates
  ): Promise<SubtreeInfo> {
    const subtreeUri = ImplicitTilings.substituteTemplateUri(
      implicitTiling.subdivisionScheme,
      implicitTiling.subtrees.uri,
      coordinates
    );
    if (!defined(subtreeUri)) {
      const message =
        `Could not substitute coordinates ${coordinates} in ` +
        `template URI ${implicitTiling.subtrees.uri}`;
      throw new ImplicitTilingError(message);
    }
    const subtreeData = await resourceResolver.resolveData(subtreeUri);
    if (!subtreeData) {
      const message =
        `Could not resolve subtree URI ${subtreeUri} that was ` +
        `created from template URI ${implicitTiling.subtrees.uri} ` +
        `for coordinates ${coordinates}`;
      throw new ImplicitTilingError(message);
    }

    const subtreeDirectory = path.dirname(subtreeUri);
    const subtreeResourceResolver = resourceResolver.derive(subtreeDirectory);

    // If the subtree data was JSON, just parse it and
    // create a SubtreeInfo without an internal buffer
    const isJson = Buffers.isProbablyJson(subtreeData);
    if (isJson) {
      let subtreeJson: any;
      let subtree: Subtree;
      try {
        subtreeJson = Buffers.getJson(subtreeData);
        subtree = subtreeJson;
      } catch (error) {
        const message =
          `Could not parse subtree JSON from URI ${subtreeUri} that was ` +
          `created from template URI ${implicitTiling.subtrees.uri} ` +
          `for coordinates ${coordinates}`;
        throw new ImplicitTilingError(message);
      }
      return SubtreeInfos.create(
        subtree,
        undefined,
        implicitTiling,
        subtreeResourceResolver
      );
    }

    // For SUBT (binary subtree data), create the SubtreeInfo
    // from the whole buffer
    const isSubt = Buffers.getMagic(subtreeData) === "subt";
    if (isSubt) {
      const subtreeInfo = await SubtreeInfos.createFromBuffer(
        subtreeData,
        implicitTiling,
        subtreeResourceResolver
      );
      return subtreeInfo;
    }

    const message =
      `Subtree data from URI ${subtreeUri} that was created from ` +
      `template URI ${implicitTiling.subtrees.uri} for coordinates ` +
      `${coordinates} did neither contain JSON nor binary subtree data`;
    throw new ImplicitTilingError(message);
  }
}

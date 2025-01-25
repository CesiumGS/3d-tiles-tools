import { ResourceResolver } from "../../base";

import { Tileset } from "../../structure";
import { TileImplicitTiling } from "../../structure";
import { Schema } from "../../structure";

import { TraversedTile } from "./TraversedTile";
import { ExplicitTraversedTile } from "./ExplicitTraversedTile";
import { ImplicitTraversedTile } from "./ImplicitTraversedTile";
import { SubtreeModels } from "./SubtreeModels";

import { ImplicitTilingError } from "../implicitTiling/ImplicitTilingError";
import { ImplicitTilings } from "../implicitTiling/ImplicitTilings";

/**
 * Internal methods used in the `ExplicitTraversedTile` class.
 *
 * (Specifically: Methods to create the children of explicit
 * tiles, when these explicit tiles define the root of an
 * implicit tileset)
 *
 * @internal
 */
export class ExplicitTraversedTiles {
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
   * @param tileset - The tileset
   * @param implicitTiling - The `TileImplicitTiling`
   * @param parent - The `ExplicitTraversedTile`
   * @param schema - The optional metadata schema
   * @param resourceResolver - The `ResourceResolver` that
   * will be used e.g. for subtree files
   * @returns The traversed children
   * @throws ImplicitTilingError If the input was structurally invalid
   */
  static async createTraversedChildren(
    tileset: Tileset,
    implicitTiling: TileImplicitTiling,
    schema: Schema | undefined,
    parent: ExplicitTraversedTile,
    resourceResolver: ResourceResolver
  ): Promise<TraversedTile[]> {
    const subdivisionScheme = implicitTiling.subdivisionScheme;
    if (subdivisionScheme === "QUADTREE") {
      const child = await ExplicitTraversedTiles.createImplicitQuadtreeRoot(
        tileset,
        implicitTiling,
        schema,
        parent,
        resourceResolver
      );
      return [child];
    }
    if (subdivisionScheme === "OCTREE") {
      const child = await ExplicitTraversedTiles.createImplicitOctreeRoot(
        tileset,
        implicitTiling,
        schema,
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
   * @param tileset - The tileset
   * @param implicitTiling - The `TileImplicitTiling`
   * @param schema - The optional metadata schema
   * @param parent - The `ExplicitTraversedTile`
   * @param resourceResolver - The `ResourceResolver` that
   * will be used e.g. for subtree files
   * @returns The root of an implicit quadtree
   * @throws ImplicitTilingError If the input was structurally invalid
   */
  private static async createImplicitQuadtreeRoot(
    tileset: Tileset,
    implicitTiling: TileImplicitTiling,
    schema: Schema | undefined,
    parent: ExplicitTraversedTile,
    resourceResolver: ResourceResolver
  ): Promise<TraversedTile> {
    const rootCoordinates =
      ImplicitTilings.createRootCoordinates(implicitTiling);

    const subtreeModel = await SubtreeModels.resolve(
      implicitTiling,
      schema,
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
      tileset,
      parent,
      path,
      subtreeModel,
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
   * @param tileset - The tileset
   * @param implicitTiling - The `TileImplicitTiling`
   * @param schema - The optional metadata schema
   * @param parent - The `ExplicitTraversedTile`
   * @param resourceResolver - The `ResourceResolver` that
   * will be used e.g. for subtree files
   * @returns The root of an implicit octree
   * @throws ImplicitTilingError If the input was structurally invalid
   */
  private static async createImplicitOctreeRoot(
    tileset: Tileset,
    implicitTiling: TileImplicitTiling,
    schema: Schema | undefined,
    parent: ExplicitTraversedTile,
    resourceResolver: ResourceResolver
  ): Promise<TraversedTile> {
    const rootCoordinates =
      ImplicitTilings.createRootCoordinates(implicitTiling);

    const subtreeModel = await SubtreeModels.resolve(
      implicitTiling,
      schema,
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
      tileset,
      parent,
      path,
      subtreeModel,
      parent.level + 1,
      rootCoordinates,
      rootCoordinates,
      rootCoordinates,
      parent
    );
    return root;
  }
}

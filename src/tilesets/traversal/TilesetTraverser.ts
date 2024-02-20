import { ResourceResolver } from "../../base";
import { DeveloperError } from "../../base";

import { Tile } from "../../structure";
import { Tileset } from "../../structure";
import { Schema } from "../../structure";

import { TraversedTile } from "./TraversedTile";
import { ExplicitTraversedTile } from "./ExplicitTraversedTile";
import { TraversalCallback } from "./TraversalCallback";
import { TilesetTraversers } from "./TilesetTraversers";

/**
 * A collection of configuration options for the traversal.
 *
 * @internal
 */
export type TraversalOptions = {
  /**
   * Whether the traversal should be depth-first (in contrast
   * to the default breadth-first order)
   */
  depthFirst?: boolean;

  /**
   * Whether external tilesets should be traversed
   */
  traverseExternalTilesets?: boolean;
};

/**
 * A class that can traverse the tiles of a tileset.
 *
 * @internal
 */
export class TilesetTraverser {
  /**
   * The base URI against which content URIs are resolved
   * when they refer to 3D Tiles Packages.
   * (The current implementations of 3D Tiles Package based
   * `TilesetSource`, specifically `TilesetSource3tz`,
   * require an absolute URI)
   */
  private readonly baseUri: string;

  /**
   * The `ResourceResolver` that is used to resolve resources like
   * external metadata schema files, subtree files for implicit
   * tilesets, or external tilesets.
   */
  private readonly resourceResolver: ResourceResolver;

  /**
   * The `TraversalOptions`
   */
  private readonly options: TraversalOptions;

  /**
   * Creates a new instance.
   *
   * NOTE: The exact set of traversal options is not yet specified.
   *
   * @param baseUri - The URI against which content URI are resolved
   * in order to obtain an absolute URI. This is only used for traversing
   * package (3TZ or 3DTILES) content
   * @param resourceResolver - The `ResourceResolver` that is used to
   * resolve resources like external metadata schema files, subtree
   * files for implicit tilesets, or external tilesets.
   * @param options - Options for the traveral process.
   */
  constructor(
    baseUri: string,
    resourceResolver: ResourceResolver,
    options?: TraversalOptions
  ) {
    this.baseUri = baseUri;
    this.resourceResolver = resourceResolver;
    this.options = {
      depthFirst: options?.depthFirst === true,
      traverseExternalTilesets: options?.traverseExternalTilesets === true,
    };
  }

  /**
   * Traverses the tiles in the given tileset.
   *
   * This will traverse the tiles of the given tileset, starting
   * at the root. It will pass all tiles to the given callback,
   * as `TraversedTile` instances.
   *
   * @param tileset - The `Tileset`
   * @param traversalCallback - The `TraversalCallback`
   * @returns A Promise that resolves when the traversal finished
   */
  async traverse(
    tileset: Tileset,
    traversalCallback: TraversalCallback
  ): Promise<void> {
    const schema = await TilesetTraversers.resolveSchema(
      tileset,
      this.resourceResolver
    );
    return this.traverseWithSchema(tileset, schema, traversalCallback);
  }

  /**
   * Traverses the tiles in the given tileset.
   *
   * This is only the implementation of `traverse`, with the
   * option to pass in a `Schema` object that already has
   * been resolved.
   *
   * @param tileset - The `Tileset`
   * @param schema - The schema from the `tileset.schema` or the
   * `tileset.schemaUri`, or `undefined` if the tileset does
   * not have an associated schema.
   * @param traversalCallback - The `TraversalCallback`
   * @returns A Promise that resolves when the traversal finished
   */
  async traverseWithSchema(
    tileset: Tileset,
    schema: Schema | undefined,
    traversalCallback: TraversalCallback
  ): Promise<void> {
    await this.traverseInternal(tileset.root, schema, traversalCallback);
  }

  /**
   * Traverses the hierarchy of tiles, starting at the
   * given tile.
   *
   * @param tile - The `Tile` where the traversal should start
   * @param schema - The schema from the `tileset.schema` or the
   * `tileset.schemaUri`, or `undefined` if the tileset does
   * not have an associated schema.
   * @param traversalCallback - The `TraversalCallback`
   * @returns A Promise that resolves when the traversal finished
   */
  async traverseWithSchemaAt(
    tile: Tile,
    schema: Schema | undefined,
    traversalCallback: TraversalCallback
  ): Promise<void> {
    await this.traverseInternal(tile, schema, traversalCallback);
  }

  /**
   * Actual implementation of the traversal.
   *
   * @param tile - The `Tile` where to start the traversal
   * @param tileset - The `Tileset`
   * @param traversalCallback - The `TraversalCallback`
   * @returns A Promise that resolves when the traversal finished
   */
  private async traverseInternal(
    tile: Tile,
    schema: Schema | undefined,
    traversalCallback: TraversalCallback
  ) {
    const depthFirst = this.options.depthFirst;

    const stack: TraversedTile[] = [];

    const traversalRoot = ExplicitTraversedTile.createRoot(
      tile,
      schema,
      this.resourceResolver
    );
    stack.push(traversalRoot);

    while (stack.length > 0) {
      const traversedTile = depthFirst ? stack.pop() : stack.shift();
      if (!traversedTile) {
        // This cannot happen, but TypeScript does not know this:
        throw new DeveloperError("Empty stack during traversal");
      }
      const traverseChildren = await traversalCallback(traversedTile);

      if (traverseChildren) {
        const children = await this.createChildren(traversedTile);
        stack.push(...children);
      }
    }
  }

  /**
   * Create the children for the traversal for the given tile.
   *
   * If the given `TraversedTile` has children, then they will
   * be returned.
   * Otherwise, if `options.traverseExternalTilesets` was set,
   * then this will be the roots of external tilesets.
   * Otherwise, it will be the empty array.
   *
   * @param traversedTile - The `TraversedTile`
   * @returns The children
   */
  private async createChildren(
    traversedTile: TraversedTile
  ): Promise<TraversedTile[]> {
    const traverseExternalTilesets = this.options.traverseExternalTilesets;
    const children = await traversedTile.getChildren();
    const length = children.length;

    if (length !== 0) {
      return children;
    }
    if (traverseExternalTilesets) {
      // When there are no children, but external tilesets should
      // be traversed, determine the roots of external tilesets
      // and put them on the traversal stack
      const externalRoots = await TilesetTraversers.createExternalTilesetRoots(
        this.baseUri,
        traversedTile
      );
      return externalRoots;
    }
    return [];
  }
}

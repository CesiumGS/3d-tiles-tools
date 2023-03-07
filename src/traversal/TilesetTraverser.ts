import { ResourceResolver } from "../io/ResourceResolver";

import { Tileset } from "../structure/Tileset";
import { Schema } from "../structure/Metadata/Schema";

import { TraversedTile } from "./TraversedTile";
import { ExplicitTraversedTile } from "./ExplicitTraversedTile";
import { TraversalCallback } from "./TraversalCallback";
import { DeveloperError } from "../base/DeveloperError";

/**
 * A class that can traverse the tiles of a tileset.
 *
 * @internal
 */
export class TilesetTraverser {
  /**
   * Traverses the tiles in the given tileset.
   *
   * This will traverse the tiles of the given tileset, starting
   * at the root. It will pass all tiles to the given callback,
   * as `TraversedTile` instances.
   *
   * @param tileset - The `Tileset`
   * @param schema - The schema from the `tileset.schema` or the
   * `tileset.schemaUri`. If this is defined, then it is assumed
   * to be a valid schema definition.
   * @param resourceResolver - The `ResourceResolver` that is used to
   * resolve resources for implicit tilesets (subtree files)
   * @param traversalCallback - The `TraversalCallback`
   * @param depthFirst - Whether the traversal should be depth-first
   * @returns A Promise that resolves when the traversal finished
   */
  static async traverse(
    tileset: Tileset,
    schema: Schema | undefined,
    resourceResolver: ResourceResolver,
    traversalCallback: TraversalCallback,
    depthFirst: boolean
  ): Promise<void> {
    const root = tileset.root;
    if (!root) {
      return;
    }
    const stack: TraversedTile[] = [];

    const traversedRoot = new ExplicitTraversedTile(
      root,
      "/root",
      0,
      undefined,
      schema,
      resourceResolver
    );
    stack.push(traversedRoot);

    while (stack.length > 0) {
      const traversedTile = depthFirst ? stack.pop() : stack.shift();
      if (!traversedTile) {
        // This cannot happen, but TypeScript does not know this:
        throw new DeveloperError("Empty stack during traversal");
      }
      const traverseChildren = await traversalCallback(traversedTile);

      if (traverseChildren) {
        const children = await traversedTile.getChildren();
        const length = children.length;
        for (let i = 0; i < length; i++) {
          const traversedChild = children[i];
          stack.push(traversedChild);
        }
      }
    }
  }
}

import { TraversedTile } from "./TraversedTile";

/**
 * An interface with a function that will be called by
 * a `TilesetTraverser`
 *
 * @internal
 */
export interface TraversalCallback {
  /**
   * Will be called with each traversed tile during the
   * traversal process.
   *
   * @param traversedTile - The `TraversedTile` instance
   * @returns A promise that resolves to `true` if the
   * traversal should continue, and to `false` if the
   * traversal should stop.
   */
  (traversedTile: TraversedTile): Promise<boolean>;
}

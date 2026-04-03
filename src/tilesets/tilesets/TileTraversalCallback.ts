import { Tile } from "../../structure";

/**
 * A function that can be passed to `Tiles.traverseExplicit`.
 * It will receive the stack of tiles during the traversal.
 * The return value indicates whether the traversal should
 * continue.
 *
 * @internal
 */
export type TileTraversalCallback = (tilePath: Tile[]) => Promise<boolean>;

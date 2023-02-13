import { Tile } from "../structure/Tile";

/**
 * A function that can be passed to `Tiles.traverseExplicit`.
 * It will receive the stack of tiles during the traversal.
 * The return value indicates whether the traversal should
 * continue.
 */
export type TileTraversalCallback = (tilePath: Tile[]) => Promise<boolean>;

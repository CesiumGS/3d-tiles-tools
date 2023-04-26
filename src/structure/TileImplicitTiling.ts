import { RootProperty } from "./RootProperty";
import { Subtrees } from "./Subtrees";

/**
 * This object allows a tile to be implicitly subdivided. Tile and
 * content availability and metadata is stored in subtrees which are
 * referenced externally.
 * @internal
 */
export interface TileImplicitTiling extends RootProperty {
  /**
   * A string describing the subdivision scheme used within the tileset.
   */
  subdivisionScheme: string;

  /**
   * The number of distinct levels in each subtree. For example a quadtree
   * with `subtreeLevels = 2` will have subtrees with 5 nodes (one root and
   * 4 children).
   */
  subtreeLevels: number;

  /**
   * The numbers of the levels in the tree with available tiles.
   */
  availableLevels: number;

  /**
   * An object describing the location of subtree files.
   */
  subtrees: Subtrees;
}

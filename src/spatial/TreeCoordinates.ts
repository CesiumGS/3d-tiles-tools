/**
 * An interface for coordinates within a tree structure.
 *
 * @internal
 */
export interface TreeCoordinates {
  /**
   * Returns the level of the coordinates, with 0 being
   * the root node.
   *
   * @returns The level
   */
  get level(): number;

  /**
   * Returns the parent coordinates of these coordinates,
   * or `null` if this is the root.
   *
   * @returns The parent coordinates
   */
  parent(): TreeCoordinates | null;

  /**
   * Returns a generator for the child coordinates of these coordinates
   *
   * @returns The child coordinates
   */
  children(): Iterable<TreeCoordinates>;

  /**
   * Returns a generator for all coordinates that are descendants
   * of these coordinates, up to the given level, **inclusive!**.
   *
   * @param maxLevelInclusive - The maximum level, **inclusive**
   * @param depthFirst - Whether the traversal should be depth first
   * @returns The child coordinates
   */
  descendants(
    maxLevelInclusive: number,
    depthFirst: boolean
  ): Iterable<TreeCoordinates>;

  /**
   * Preliminary:
   *
   * Returns these coordinates as an array. This returns the
   * level, x, and y coordinates (and z for octrees) in one
   * array.
   *
   * @returns The coordinates as an array
   */
  toArray(): number[];

  /**
   * Preliminary:
   *
   * Returns the index that corresponds to these coordinates.
   *
   * This returns the (stacked) Morton index. This could be considered
   * as an implementation detail, but is frequently used in implicit
   * tiling, and therefore, part of this interface.
   *
   * @returns The coordinates as an index
   */
  toIndex(): number;

  /**
   * Preliminary:
   *
   * Returns the index that corresponds to these coordinates, within
   * their level.
   *
   * This returns the local Morton index. This could be considered
   * as an implementation detail, but is frequently used in implicit
   * tiling, and therefore, part of this interface.
   *
   * @returns The index of these coordinates within their level
   */
  toIndexInLevel(): number;
}

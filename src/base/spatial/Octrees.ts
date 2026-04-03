import { OctreeCoordinates } from "./OctreeCoordinates";

/**
 * Methods related to octrees
 *
 * @internal
 */
export class Octrees {
  /**
   * Computes the number of nodes of an octree with the given number of
   * levels.
   *
   * @param levels - The number of levels
   * @returns The number of nodes
   */
  static computeNumberOfNodesForLevels(levels: number) {
    return ((1 << (levels * 3)) - 1) / (8 - 1);
  }

  /**
   * Returns a generator over all coordinates in the given level.
   *
   * @param level - The level
   * @returns The coordinates
   */
  static *coordinatesForLevel(level: number) {
    const size = 1 << level;
    for (let z = 0; z < size; z++) {
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          yield new OctreeCoordinates(level, x, y, z);
        }
      }
    }
  }

  /**
   * Returns whether the given coordinates are valid. This means
   * that the x, y, and z components are in the range that is
   * determined by the level of the coordinates.
   *
   * @param c - The coordinates
   * @returns Whether the coordinates are valid
   */
  static isValid(c: OctreeCoordinates) {
    const level = c.level;
    const x = c.x;
    const y = c.y;
    const z = c.z;
    if (level < 0) {
      return false;
    }
    const size = 1 << level;
    if (x < 0 || x >= size) {
      return false;
    }
    if (y < 0 || y >= size) {
      return false;
    }
    if (z < 0 || z >= size) {
      return false;
    }
    return true;
  }
}

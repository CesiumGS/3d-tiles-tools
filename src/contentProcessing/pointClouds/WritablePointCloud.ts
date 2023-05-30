/**
 * An interface for classes that can receive and collect
 * raw data for a point cloud.
 */
export interface WritablePointCloud {
  /**
   * Adds the given position to the `POSITION` attribute
   * of the point cloud.
   *
   * @param x - The x component
   * @param y - The y component
   * @param z - The z component
   */
  addPosition(x: number, y: number, z: number): void;

  /**
   * Adds the given normal to the `NORMAL` attribute
   * of the point cloud.
   *
   * @param x - The x component
   * @param y - The y component
   * @param z - The z component
   */
  addNormal(x: number, y: number, z: number): void;

  /**
   * Adds the given color to the `COLOR_0` attribute
   * of the point cloud.
   *
   * This is assumed to be a linear RGBA color with
   * values in [0.0, 1.0].
   *
   * @param r - The r component
   * @param g - The g component
   * @param b - The b component
   * @param a - The a component
   */
  addNormalizedLinearColor(r: number, g: number, b: number, a: number): void;

  /**
   * Set the given color as the global color of the point cloud.
   *
   * This is assumed to be a linear RGBA color with
   * values in [0.0, 1.0].
   *
   * @param r - The r component
   * @param g - The g component
   * @param b - The b component
   * @param a - The a component
   */
  setNormalizedLinearGlobalColor(
    r: number,
    g: number,
    b: number,
    a: number
  ): void;
}

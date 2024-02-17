/**
 * An interface for point cloud data.
 *
 * This data is only readable, meaning that it may be accessed,
 * but not modified.
 *
 * There are some implicit conventions for this interface. These
 * might be made explicit at some point, with proper type
 * information. But for now, the conventions are
 *
 * - Positions are 3D floating point values, and are relative
 *   to the "global position" of the point cloud
 * - Normals are 3D floating point values
 * - Colors are 4D floating point values (linear RGBA, in [0.0, 1.0])
 *
 * When directly accessing generic attributes, then the attribute
 * data is provided as "flat" iterables over `number`.
 *
 * The `getPositions`/`getNormals`/`getNormalizedLinearColors`
 * methods are only convenience wrappers around the low-level
 * `getAttributeValues` method, implementing the conversion
 * into `number[]` arrays as stated above.
 *
 * @internal
 */
export interface ReadablePointCloud {
  /**
   * Returns the positions, as 3D floating point arrays.
   *
   * These positions are _relative_ to the `getGlobalPosition`
   *
   * @returns The positions
   */
  getPositions(): Iterable<number[]>;

  /**
   * Returns the "global" position. All positions that
   * are returned by the `getPositions` functions are
   * _relative_ to this position.
   *
   * @returns The global position
   */
  getGlobalPosition(): [number, number, number] | undefined;

  /**
   * Returns the normals, as 3D floating point arrays
   *
   * @returns The normals
   */
  getNormals(): Iterable<number[]> | undefined;

  /**
   * Returns the colors, as 4D arrays containing the linear RGBA
   * components, in the range [0.0, 1.0]
   *
   * @returns The colors
   */
  getNormalizedLinearColors(): Iterable<number[]> | undefined;

  /**
   * Returns the "global" color for all points.
   *
   * This is a linear RGBA color with components in [0.0, 1.0],
   * or `undefined` if no global color was assigned.
   *
   * @returns The global color
   */
  getNormalizedLinearGlobalColor():
    | [number, number, number, number]
    | undefined;

  /**
   * Returns the attributes that are present in this point cloud.
   * These will be strings like `POSITION` or `COLOR_0`.
   *
   * @returns The attributes
   */
  getAttributes(): string[];

  /**
   * Obtains the raw, flat values of the attribute with the
   * given name.
   *
   * @param name - The name of the attribute
   * @returns The attribute values
   */
  getAttributeValues(name: string): Iterable<number> | undefined;

  /**
   * Obtains the type of the attribute with the given name.
   *
   * This will be a string that (for now) corresponds to the
   * `MetadataTypes`, e.g. a string like `SCALAR` or `VEC3`.
   *
   * @param name - The name of the attribute
   * @returns The attribute type
   */
  getAttributeType(name: string): string | undefined;

  /**
   * Obtains the component type of the attribute with the given name.
   *
   * This will be a string that (for now) corresponds to the
   * `MetadataComponentTypes`, e.g. a string like `UINT8` or
   * `FLOAT32`.
   *
   * @param name - The name of the attribute
   * @returns The attribute component type
   */
  getAttributeComponentType(name: string): string | undefined;
}

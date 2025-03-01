/**
 * An interface for classes that can receive tileset data.
 *
 * Note that all methods defined by this interface are *asynchronous*.
 * Callers will usually have to `await` the result when calling them.
 *
 * @internal
 */
export interface TilesetTarget {
  /**
   * Start the creation of a tileset data set with the given
   * output file name.
   *
   * @param fullOutputName - The name of the output file or directory
   * @param overwrite - Whether output files should be overwritten
   * when they already exists
   *
   * @throws {@link TilesetError} If the output is a file that already
   * exists, and `overwrite` was not true.
   */
  begin(fullOutputName: string, overwrite: boolean): Promise<void>;

  /**
   * Add the given entry to the output.
   *
   * @param key - The key for the entry
   * @param content - The value for the entry
   * @throws {@link TilesetError} If `begin` was not called yet
   */
  addEntry(key: string, content: Buffer): Promise<void>;

  /**
   * Finalize the creation of the tileset data.
   *
   * @throws {@link TilesetError} If `begin` was not called yet
   */
  end(): Promise<void>;
}

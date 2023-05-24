/**
 * An interface for a 3D Tiles tileset source
 *
 * @internal
 */
export interface TilesetSource {
  /**
   * Open a tileset from the given file or directory
   *
   * @param fullInputName - The full input file- or directory name
   *
   * @throws {@link TilesetError} If the input cannot be opened
   */
  open(fullInputName: string): void;

  /**
   * Returns an iterable over all keys of this soruce
   *
   * @returns The iterable
   * @throws {@link TilesetError} If `open` was not called yet
   */
  getKeys(): Iterable<string>;

  /**
   * Returns the value that is identified by the given key.
   *
   * @param key - The key for the entry
   * @returns A buffer containing the data for the specified key, or
   * `undefined` if there is no entry for the given key
   * @throws {@link TilesetError} If `open` was not called yet
   */
  getValue(key: string): Buffer | undefined;

  /**
   * Close this source
   *
   * @throws {@link TilesetError} If `open` was not called yet
   */
  close(): void;
}

/**
 * A class representing a single entry in a tileset data set, consisting
 * of the key (file name) and the data
 *
 * @internal
 */
export interface TilesetEntry {
  /**
   * The key (file name) of the entry
   */
  key: string;

  /**
   * The value (data) of the entry
   */
  value: Buffer;
}

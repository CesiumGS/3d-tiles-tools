/**
 * Interface for a feature- or batch table that is
 * part of `TileData`.
 *
 * @internal
 */
export interface Table {
  /**
   * The parsed representation of the JSON part of the table
   */
  json: any;

  /**
   * The buffer that contains the binary data of the table,
   * and which is referred to with a `BinaryBodyReference`
   * from the JSON part.
   */
  binary: Buffer;
}

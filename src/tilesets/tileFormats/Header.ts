/**
 * An interface that describes the information that is
 * read from the binary header of tile data.
 *
 * This may be used for B3DM, I3DM or PNTS `TileData`, or
 * for CMPT `CompositeTileData`.
 *
 * @internal
 */
export interface Header {
  /**
   * The magic header.
   *
   * This is a string representation of the first 4 bytes
   * of the tile header.
   */
  magic: string;

  /**
   * The version number of the tile data.
   *
   * This is always 1.
   */
  version: number;

  /**
   * The glTF format indicator.
   *
   * This is only defined for I3DM data, where ...
   * - a value of 0 indicates that the payload of the tile data
   *   is a URI string that refers to the glTF file
   * - a value of 1 indicates that the payload directly contains
   *   binary glTF (GLB) data.
   */
  gltfFormat?: number;
}

import { Header } from "./Header";

/**
 * A representation of composite (CMPT) tile data.
 *
 * Instances of this interface can be read from
 * buffers with methods in the `TileFormats` class.
 *
 * @internal
 */
export interface CompositeTileData {
  /**
   * The header of the tile data
   */
  header: Header;

  /**
   * One buffer for each inner tile
   */
  innerTileBuffers: Buffer[];
}

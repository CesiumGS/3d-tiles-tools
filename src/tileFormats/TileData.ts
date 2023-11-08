import { Header } from "./Header";
import { Table } from "./Table";

/**
 * A representation of tile data.
 *
 * This interface covers Batched 3D Model (B3DM), Instanced
 * 3D Model (I3DM), and Point Cloud (PNTS) data.
 *
 * Instances of this interface can be read from buffers
 * with methods in the `TileFormats` class.
 *
 * @internal
 */
export interface TileData {
  /**
   * The header of the tile data
   */
  header: Header;

  /**
   * Feature table
   */
  featureTable: Table;

  /**
   * Batch table
   */
  batchTable: Table;

  /**
   * The payload.
   *
   * For B3DM tile data, this will contain binary glTF (GLB) data.
   * For I3DM tile data, this will contain either a string (if
   * `header.gltfFormat===0`, or binary glTF (GLB) data (if
   * `header.gltfFormat===1`.
   * For PNTS tile data, this will be an empty buffer.
   *
   * When the payload is GLB data, then it may include padding bytes
   * that have been inserted to satisfy the alignment requirements
   * of the tile data. The actual GLB data (without padding) may
   * be obtained with the `TileFormats.extractGlbPayload` or
   * `TileFormats.obtainGlbPayload` method.
   */
  payload: Buffer;
}

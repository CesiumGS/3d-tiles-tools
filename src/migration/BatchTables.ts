import { BatchTable } from "../structure/TileFormats/BatchTable";

/**
 * Internal uutility methods related to the migration of batch tables
 */
export class BatchTables {
  /**
   * Obtain the names of all properties that appear in the
   * `3DTILES_draco_point_compression` extension of the
   * given batch table (or the empty array if the extension
   * is not present)
   *
   * @param batchTable - The batch table
   * @returns The draco property names
   */
  static obtainDracoPropertyNames(batchTable: BatchTable): string[] {
    if (!batchTable.extensions) {
      return [];
    }
    const batchTableExtension =
      batchTable.extensions["3DTILES_draco_point_compression"];
    if (!batchTableExtension) {
      return [];
    }
    return Object.keys(batchTableExtension.properties);
  }
}

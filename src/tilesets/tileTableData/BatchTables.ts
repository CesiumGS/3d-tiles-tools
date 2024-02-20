import { BatchTable } from "../../structure";

/**
 * Internal uutility methods related to the migration of batch tables
 *
 * @internal
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
    return Object.keys(BatchTables.obtainDracoProperties(batchTable));
  }
  /**
   * Obtain all properties that appear in the`3DTILES_draco_point_compression`
   * extension of the given batch table (or the empty object if the extension
   * is not present)
   *
   * @param batchTable - The batch table
   * @returns The draco properties
   */
  static obtainDracoProperties(batchTable: BatchTable): {
    [key: string]: number;
  } {
    if (!batchTable.extensions) {
      return {};
    }
    const batchTableExtension =
      batchTable.extensions["3DTILES_draco_point_compression"];
    if (!batchTableExtension) {
      return {};
    }
    return batchTableExtension.properties;
  }
}

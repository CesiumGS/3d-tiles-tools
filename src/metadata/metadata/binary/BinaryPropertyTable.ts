import { PropertyTable } from "../../../structure";

import { BinaryMetadata } from "./BinaryMetadata";

/**
 * A basic structure summarizing the (raw) elements of a binary
 * property table.
 *
 * @internal
 */
export interface BinaryPropertyTable {
  /**
   * The actual property table
   */
  propertyTable: PropertyTable;

  /**
   * The binary metadata that is backing the property table
   */
  binaryMetadata: BinaryMetadata;
}

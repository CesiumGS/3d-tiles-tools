import { TileTableData } from "../contentProcessing/TileTableData";
import { BatchTableClassProperties } from "./BatchTableClassProperties";
import { TilePropertyTableModel } from "./TilePropertyTableModel";

/**
 * Methods to create `PropertyTableModel` instances for batch- or
 * feature table data.
 */
export class TilePropertyTableModels {
  /**
   * Creates a `PropertyTableModel` for the given batch- or feature
   * table data.
   *
   * @param table - The table
   * @param binary - The binary data
   * @param numRows - The number of rows (POINTS_LENGTH or BATCH_LENGTH)
   * @returns The property table model
   */
  static create(
    table: { [key: string]: any },
    binary: Buffer,
    numRows: number
  ): TilePropertyTableModel {
    const propertyTableModel = new TilePropertyTableModel(binary, numRows);
    const properties = Object.keys(table);
    for (const propertyId of properties) {
      if (propertyId === "extensions" || propertyId === "extras") {
        continue;
      }
      const propertyValue = table[propertyId];
      const classProperty = BatchTableClassProperties.createClassProperty(
        propertyId,
        propertyValue
      );
      propertyTableModel.addClassProperty(propertyId, classProperty);

      if (TileTableData.isBatchTableBinaryBodyReference(propertyValue)) {
        const legacyType = propertyValue.type;
        const legacyComponentType = propertyValue.componentType;
        const byteOffset = propertyValue.byteOffset;
        propertyTableModel.addPropertyModelFromBinary(
          propertyId,
          byteOffset,
          legacyType,
          legacyComponentType
        );
      } else if (Array.isArray(propertyValue)) {
        propertyTableModel.addPropertyModelFromArray(propertyId, propertyValue);
      } else {
        console.log(
          `Property ${propertyId} was neither a binary body ` +
            `reference nor an array - skipping`
        );
      }
    }
    return propertyTableModel;
  }
}
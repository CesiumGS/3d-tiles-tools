import { TileTableData } from "./TileTableData";
import { BatchTableClassProperties } from "./BatchTableClassProperties";
import { DefaultPropertyTableModel } from "../metadata/DefaultPropertyTableModel";

import { PropertyTableModel } from "../metadata/PropertyTableModel";
import { PropertyModel } from "../metadata/PropertyModel";

import { TileFormatError } from "../tileFormats/TileFormatError";
import { DefaultPropertyModel } from "../metadata/DefaultPropertyModel";

/**
 * Methods to create `PropertyTableModel` instances for batch table data
 */
export class BatchTablePropertyTableModels {
  /**
   * Creates a `PropertyTableModel` for the given batch table data.
   *
   * @param table - The table
   * @param binary - The binary data
   * @param externalProperties - External properties, i.e. property model
   * instances for properties of the batch table that are not stored in
   * the batch table binary. This is only required for the properties that
   * are encoded with the `3DTILES_draco_point_compression` extension,
   * where the actual data is stored in the feature table binary.
   * @param numRows - The number of rows of the table
   * @returns The property table model
   * @throws TileFormatError If the table contained a property
   * that was neither found in the 'externalProperties', nor has
   * been a BatchTableBinaryBodyReference nor an array
   */
  static create(
    table: { [key: string]: any },
    binary: Buffer,
    externalProperties: { [key: string]: PropertyModel },
    numRows: number
  ): PropertyTableModel {
    const propertyTableModel = new DefaultPropertyTableModel(numRows);
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

      const externalProperty = externalProperties[propertyId];
      if (externalProperty) {
        propertyTableModel.addPropertyModel(propertyId, externalProperty);
      } else if (TileTableData.isBatchTableBinaryBodyReference(propertyValue)) {
        const legacyType = propertyValue.type;
        const legacyComponentType = propertyValue.componentType;
        const byteOffset = propertyValue.byteOffset;
        const propertyModel = TileTableData.createNumericPropertyModel(
          legacyType,
          legacyComponentType,
          binary,
          byteOffset
        );
        propertyTableModel.addPropertyModel(propertyId, propertyModel);
      } else if (Array.isArray(propertyValue)) {
        const propertyModel = new DefaultPropertyModel(propertyValue);
        propertyTableModel.addPropertyModel(propertyId, propertyModel);
      } else {
        throw new TileFormatError(
          `Property ${propertyId} was neither a binary body ` +
            `reference nor an array`
        );
      }
    }
    return propertyTableModel;
  }
}

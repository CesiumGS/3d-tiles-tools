import { ClassProperty } from "../../../structure";
import { PropertyTableProperty } from "../../../structure";

import { BinaryPropertyModels } from "./BinaryPropertyModels";
import { TableMetadataEntityModel } from "../TableMetadataEntityModel";

import { MetadataEntityModel } from "../MetadataEntityModel";
import { MetadataEntityModels } from "../MetadataEntityModels";
import { MetadataError } from "../MetadataError";
import { PropertyModel } from "../PropertyModel";
import { PropertyTableModel } from "../PropertyTableModel";
import { BinaryPropertyTable } from "./BinaryPropertyTable";

/**
 * Implementation of the `PropertyTableModel` interface that is backed
 * by binary data.
 *
 * @internal
 */
export class BinaryPropertyTableModel implements PropertyTableModel {
  /**
   * The structure containing the raw PropertyTable JSON object
   * and binary data of the property table
   */
  private readonly binaryPropertyTable: BinaryPropertyTable;

  /**
   * A mapping from property IDs to the `PropertyModel`
   * instances that provide the property values. These
   * are the "columns" of the table
   */
  private readonly propertyIdToModel: { [key: string]: PropertyModel } = {};

  /**
   * A mapping from 'semantic' strings to the 'propertyId'
   * strings of the properties that have the respective
   * semantic
   */
  private readonly semanticToPropertyId: { [key: string]: string };

  constructor(binaryPropertyTable: BinaryPropertyTable) {
    this.binaryPropertyTable = binaryPropertyTable;

    // Initialize the `PropertyModel` instances for
    // the property table properties
    const propertyTable = binaryPropertyTable.propertyTable;
    const propertyTableProperties = propertyTable.properties;
    if (propertyTableProperties) {
      for (const propertyId of Object.keys(propertyTableProperties)) {
        const propertyModel = BinaryPropertyModels.createPropertyModel(
          binaryPropertyTable,
          propertyId
        );
        this.propertyIdToModel[propertyId] = propertyModel;
      }
    }

    const binaryMetadata = binaryPropertyTable.binaryMetadata;
    const metadataClass = binaryMetadata.metadataClass;
    this.semanticToPropertyId =
      MetadataEntityModels.computeSemanticToPropertyIdMapping(metadataClass);
  }

  /** {@inheritDoc PropertyTableModel.getMetadataEntityModel} */
  getMetadataEntityModel(index: number): MetadataEntityModel {
    const binaryPropertyTable = this.binaryPropertyTable;
    const propertyTable = binaryPropertyTable.propertyTable;
    const count = propertyTable.count;
    if (index < 0 || index >= count) {
      const message = `The index must be in [0,${count}), but is ${index}`;
      throw new MetadataError(message);
    }
    const semanticToPropertyId = this.semanticToPropertyId;
    const binaryMetadata = binaryPropertyTable.binaryMetadata;
    const binaryEnumInfo = binaryMetadata.binaryEnumInfo;
    const enumValueValueNames = binaryEnumInfo.enumValueValueNames;
    const metadataEntityModel = new TableMetadataEntityModel(
      this,
      index,
      semanticToPropertyId,
      enumValueValueNames
    );
    return metadataEntityModel;
  }

  /** {@inheritDoc PropertyTableModel.getPropertyModel} */
  getPropertyModel(propertyId: string): PropertyModel | undefined {
    return this.propertyIdToModel[propertyId];
  }

  /** {@inheritDoc PropertyTableModel.getClassProperty} */
  getClassProperty(propertyId: string): ClassProperty | undefined {
    const binaryPropertyTable = this.binaryPropertyTable;
    const binaryMetadata = binaryPropertyTable.binaryMetadata;
    const metadataClass = binaryMetadata.metadataClass;
    const classProperties = metadataClass.properties;
    if (!classProperties) {
      return undefined;
    }
    return classProperties[propertyId];
  }

  /** {@inheritDoc PropertyTableModel.getPropertyTableProperty} */
  getPropertyTableProperty(
    propertyId: string
  ): PropertyTableProperty | undefined {
    const binaryPropertyTable = this.binaryPropertyTable;
    const propertyTable = binaryPropertyTable.propertyTable;
    const propertyTableProperties = propertyTable.properties;
    if (!propertyTableProperties) {
      return undefined;
    }
    return propertyTableProperties[propertyId];
  }

  getPropertyNames(): string[] {
    return Object.keys(this.propertyIdToModel);
  }

  getCount(): number {
    const binaryPropertyTable = this.binaryPropertyTable;
    const propertyTable = binaryPropertyTable.propertyTable;
    return propertyTable.count;
  }
}

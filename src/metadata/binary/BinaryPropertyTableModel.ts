import { BinaryPropertyModels } from "./BinaryPropertyModels";
import { BinaryPropertyTable } from "./BinaryPropertyTable";
import { BinaryMetadataEntityModel } from "./BinaryMetadataEntityModel";

import { MetadataEntityModel } from "../MetadataEntityModel";
import { MetadataEntityModels } from "../MetadataEntityModels";
import { MetadataError } from "../MetadataError";
import { PropertyModel } from "../PropertyModel";
import { PropertyTableModel } from "../PropertyTableModel";

import { ClassProperty } from "../../structure/Metadata/ClassProperty";
import { PropertyTableProperty } from "../../structure/PropertyTableProperty";

/**
 * Implementation of the `PropertyTableModel` interface that is backed
 * by binary data.
 *
 * @internal
 */
export class BinaryPropertyTableModel implements PropertyTableModel {
  /**
   * The structure containing the raw data of the binary
   * property table
   */
  private readonly _binaryPropertyTable: BinaryPropertyTable;

  /**
   * A mapping from property IDs to the `PropertyModel`
   * instances that provide the property values. These
   * are the "columns" of the table
   */
  private readonly _propertyIdToModel: { [key: string]: PropertyModel } = {};

  /**
   * A mapping from 'semantic' strings to the 'propertyId'
   * strings of the properties that have the respective
   * semantic
   */
  private readonly _semanticToPropertyId: { [key: string]: string };

  constructor(binaryPropertyTable: BinaryPropertyTable) {
    this._binaryPropertyTable = binaryPropertyTable;

    // Initialize the `PropertyModel` instances for
    // the property table properties
    const propertyTable = this._binaryPropertyTable.propertyTable;
    const propertyTableProperties = propertyTable.properties;
    if (propertyTableProperties) {
      for (const propertyId of Object.keys(propertyTableProperties)) {
        const propertyModel = BinaryPropertyModels.createPropertyModel(
          this._binaryPropertyTable,
          propertyId
        );
        this._propertyIdToModel[propertyId] = propertyModel;
      }
    }

    const metadataClass = binaryPropertyTable.metadataClass;
    this._semanticToPropertyId =
      MetadataEntityModels.computeSemanticToPropertyIdMapping(metadataClass);
  }

  /** {@inheritDoc PropertyTableModel.getMetadataEntityModel} */
  getMetadataEntityModel(index: number): MetadataEntityModel {
    const propertyTable = this._binaryPropertyTable.propertyTable;
    const count = propertyTable.count;
    if (index < 0 || index >= count) {
      const message = `The index must be in [0,${count}), but is ${index}`;
      throw new MetadataError(message);
    }
    const semanticToPropertyId = this._semanticToPropertyId;
    const metadataEntityModel = new BinaryMetadataEntityModel(
      this,
      index,
      semanticToPropertyId
    );
    return metadataEntityModel;
  }

  /** {@inheritDoc PropertyTableModel.getPropertyModel} */
  getPropertyModel(propertyId: string): PropertyModel | undefined {
    return this._propertyIdToModel[propertyId];
  }

  /** {@inheritDoc PropertyTableModel.getClassProperty} */
  getClassProperty(propertyId: string): ClassProperty | undefined {
    const binaryPropertyTable = this._binaryPropertyTable;
    const metadataClass = binaryPropertyTable.metadataClass;
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
    const binaryPropertyTable = this._binaryPropertyTable;
    const propertyTable = binaryPropertyTable.propertyTable;
    const propertyTableProperties = propertyTable.properties;
    if (!propertyTableProperties) {
      return undefined;
    }
    return propertyTableProperties[propertyId];
  }
}

import { BinaryMetadataEntityModel } from "./BinaryMetadataEntityModel";
import { BinaryPropertyTable } from "./BinaryPropertyTable";
import { PropertyModel } from "./PropertyModel";
import { PropertyModels } from "./PropertyModels";

import { MetadataEntityModel } from "../MetadataEntityModel";
import { MetadataEntityModels } from "../MetadataEntityModels";
import { MetadataError } from "../MetadataError";

import { ClassProperty } from "../../structure/Metadata/ClassProperty";
import { PropertyTableProperty } from "../../structure/PropertyTableProperty";

/**
 * Implementation of a model for a property table that is backed
 * by binary data.
 *
 * @internal
 */
export class PropertyTableModel {
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
        const propertyModel = PropertyModels.createPropertyModel(
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

  /**
   * Returns the `MetadataEntityModel` that corresponds to the
   * row of the table with the given index.
   *
   * @param index - The index (i.e. the table row)
   * @returns The `MetdataEntityModel`
   * @throws MetadataError If the index is out of range
   */
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

  /**
   * Returns the `ClassProperty` that defines the structure of the
   * property with the given ID, or `undefined` if this table was
   * created for a `MetadataClass` that does not define this property.
   *
   * @param propertyId - The property ID
   * @returns The `ClassProperty`
   */
  getClassProperty(propertyId: string): ClassProperty | undefined {
    const binaryPropertyTable = this._binaryPropertyTable;
    const metadataClass = binaryPropertyTable.metadataClass;
    const classProperties = metadataClass.properties;
    if (!classProperties) {
      return undefined;
    }
    return classProperties[propertyId];
  }

  /**
   * Returns the `PropertyTableProperty` that defines the structure of the
   * property with the given ID, or `undefined` if this table was
   * created for a `PropertyTable` that does not define this property.
   *
   * @param propertyId - The property ID
   * @returns The `PropertyTableProperty`
   */
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

  /**
   * Returns the `PropertyModel` for the property with the given ID.
   * This is the "column" of the table that contains the property
   * data. Returns `undefined` if this table was created for
   * a `MetadataClass` that does not define this property.
   *
   * @param propertyId - The property ID
   * @returns The `PropertyModel`
   */
  getPropertyModel(propertyId: string): PropertyModel | undefined {
    return this._propertyIdToModel[propertyId];
  }
}

import { TileTableData } from "../contentProcessing/TileTableData";

import { DefaultPropertyModel } from "../metadata/DefaultPropertyModel";
import { MetadataEntityModel } from "../metadata/MetadataEntityModel";
import { MetadataError } from "../metadata/MetadataError";
import { PropertyModel } from "../metadata/PropertyModel";
import { PropertyTableModel } from "../metadata/PropertyTableModel";
import { TableMetadataEntityModel } from "../metadata/TableMetadataEntityModel";

import { PropertyTableProperty } from "../structure/PropertyTableProperty";
import { ClassProperty } from "../structure/Metadata/ClassProperty";

/**
 * Implementation of a `PropertyTableModel` that is backed by
 * the data from a batch- or feature table.
 */
export class TilePropertyTableModel implements PropertyTableModel {
  /**
   * The binary data of the batch- or feature table
   */
  private readonly binary: Buffer;

  /**
   * The number of rows of the table
   */
  private readonly numRows: number;

  /**
   * A mapping from property IDs to the `PropertyModel`
   * instances that provide the property values. These
   * are the "columns" of the table
   */
  private readonly propertyIdToModel: { [key: string]: PropertyModel } = {};

  /**
   * A mapping from property IDs to the `ClassProperty`
   * instances that define the structure of the
   * properties
   */
  private readonly propertyIdToClassProperty: { [key: string]: ClassProperty } =
    {};

  /**
   * Creates a new instance.
   *
   * This is usually not called directly by clients, but only from
   * the `TilePropertyTableModels` class.
   *
   * @param binary - The binary data
   * @param numRows - The number of rows
   */
  constructor(binary: Buffer, numRows: number) {
    this.binary = binary;
    this.numRows = numRows;
  }

  /**
   * Adds the `ClassProperty` information for the specified
   * property to this table.
   *
   * @param propertyId - The property ID/name
   * @param classProperty - The class property
   */
  addClassProperty(propertyId: string, classProperty: ClassProperty) {
    this.propertyIdToClassProperty[propertyId] = classProperty;
  }

  /**
   * Adds a property model (column) to this table, for the given
   * property, backed by the values from the given array. This
   * is used for the case of batch tables, where the property
   * values have been given as untyped JSON.
   *
   * @param propertyId - The property ID/name
   * @param propertyValues The property values
   */
  addPropertyModelFromArray(propertyId: string, propertyValues: any[]) {
    const propertyModel = new DefaultPropertyModel(propertyValues);
    this.propertyIdToModel[propertyId] = propertyModel;
  }

  /**
   * Adds a property model (column) to this table, for the given
   * property, backed by the values from the binary buffer that
   * are extraced based on the given offset and type information.
   *
   * @param propertyId - The property ID
   * @param byteOffset - The byte offset
   * @param legacyType - The legacy type (e.g. "SCALAR" or "VEC2")
   * @param legacyComponentType - The legacy component type (e.g. "UNSIGNED_INT")
   */
  addPropertyModelFromBinary(
    propertyId: string,
    byteOffset: number,
    legacyType: string,
    legacyComponentType: string
  ) {
    const propertyModel = TileTableData.createNumericPropertyModel(
      legacyType,
      legacyComponentType,
      byteOffset,
      this.binary
    );
    this.propertyIdToModel[propertyId] = propertyModel;
  }

  /**
   * Returns the property names (column names) of this table
   *
   * @returns The property names
   */
  getPropertyNames() {
    return Object.keys(this.propertyIdToModel);
  }

  /**
   * Returns the number of rows that are stored in this table
   *
   * @returns The number of rows
   */
  getNumRows() {
    return this.numRows;
  }

  /** {@inheritDoc PropertyTableModel.getMetadataEntityModel} */
  getMetadataEntityModel(index: number): MetadataEntityModel {
    if (index < 0 || index >= this.numRows) {
      const message = `The index must be in [0,${this.numRows}), but is ${index}`;
      throw new MetadataError(message);
    }
    const semanticToPropertyId = {};
    const metadataEntityModel = new TableMetadataEntityModel(
      this,
      index,
      semanticToPropertyId
    );
    return metadataEntityModel;
  }

  /** {@inheritDoc PropertyTableModel.getPropertyModel} */
  getPropertyModel(propertyId: string): PropertyModel | undefined {
    return this.propertyIdToModel[propertyId];
  }

  /** {@inheritDoc PropertyTableModel.getClassProperty} */
  getClassProperty(propertyId: string): ClassProperty | undefined {
    return this.propertyIdToClassProperty[propertyId];
  }

  /** {@inheritDoc PropertyTableModel.getPropertyTableProperty} */
  getPropertyTableProperty(
    propertyId: string
  ): PropertyTableProperty | undefined {
    if (!Object.keys(this.propertyIdToModel).includes(propertyId)) {
      return undefined;
    }
    // Note: The `PropertyTableProperty` is actually only
    // required for obtaining the offset/scale/normalized
    // information. The fact that a "dummy" property has
    // to be created here is related to
    // https://github.com/CesiumGS/3d-tiles/issues/650 :
    // Technically, it would be sufficient to have a method
    // like `getValueTransformForProperty(p)`...
    const propertyTableProperty: PropertyTableProperty = {
      values: -1,
    };
    return propertyTableProperty;
  }
}

import { PropertyTableProperty } from "../../structure";
import { ClassProperty } from "../../structure";

import { MetadataEntityModel } from "./MetadataEntityModel";
import { MetadataError } from "./MetadataError";
import { PropertyModel } from "./PropertyModel";
import { PropertyTableModel } from "./PropertyTableModel";
import { TableMetadataEntityModel } from "./TableMetadataEntityModel";

/**
 * Implementation of a `PropertyTableModel` that is backed by
 * `PropertyModel` instances.
 *
 * This implementation is only used internally, to represent
 * data from batch tables, and does not support property
 * semantics or enum types.
 *
 * @internal
 */
export class DefaultPropertyTableModel implements PropertyTableModel {
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
   * @param numRows - The number of rows
   */
  constructor(numRows: number) {
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
   * Adds a property model (column) to this table
   *
   * @param propertyId - The property ID
   * @param propertyModel - The property model
   */
  addPropertyModel(propertyId: string, propertyModel: PropertyModel) {
    this.propertyIdToModel[propertyId] = propertyModel;
  }

  /** {@inheritDoc PropertyTableModel.getPropertyNames} */
  getPropertyNames() {
    return Object.keys(this.propertyIdToModel);
  }

  /** {@inheritDoc PropertyTableModel.getCount} */
  getCount() {
    return this.numRows;
  }

  /** {@inheritDoc PropertyTableModel.getMetadataEntityModel} */
  getMetadataEntityModel(index: number): MetadataEntityModel {
    if (index < 0 || index >= this.numRows) {
      const message = `The index must be in [0,${this.numRows}), but is ${index}`;
      throw new MetadataError(message);
    }
    const semanticToPropertyId = {};
    const enumValueValueNames = {};
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

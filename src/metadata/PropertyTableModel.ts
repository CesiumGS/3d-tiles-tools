import { PropertyModel } from "./PropertyModel";
import { MetadataEntityModel } from "./MetadataEntityModel";

import { ClassProperty } from "../structure/Metadata/ClassProperty";
import { PropertyTableProperty } from "../structure/PropertyTableProperty";

/**
 * A basic interface for a property table
 *
 * @internal
 */
export interface PropertyTableModel {
  /**
   * Returns the `MetadataEntityModel` that corresponds to the
   * row of the table with the given index.
   *
   * @param index - The index (i.e. the table row)
   * @returns The `MetdataEntityModel`
   * @throws MetadataError If the index is out of range
   */
  getMetadataEntityModel(index: number): MetadataEntityModel;

  /**
   * Returns the `PropertyModel` for the property with the given ID.
   * This is the "column" of the table that contains the property
   * data. Returns `undefined` if this table was created for
   * a `MetadataClass` that does not define this property.
   *
   * @param propertyId - The property ID
   * @returns The `PropertyModel`
   */
  getPropertyModel(propertyId: string): PropertyModel | undefined;

  /**
   * Returns the `ClassProperty` that defines the structure of the
   * property with the given ID, or `undefined` if this table was
   * created for a `MetadataClass` that does not define this property.
   *
   * @param propertyId - The property ID
   * @returns The `ClassProperty`
   */
  getClassProperty(propertyId: string): ClassProperty | undefined;

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
  ): PropertyTableProperty | undefined;
}

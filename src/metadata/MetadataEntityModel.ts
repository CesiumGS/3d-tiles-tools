/**
 * A minimalistic interface for a model that describes a
 * metadata entity, in the context of the 3D Metadata
 * specification.
 *
 * @internal
 */
export interface MetadataEntityModel {
  /**
   * Obtains the value of the metadata property with the given name/ID.
   *
   * This will return the final, actual value of the property, based
   * on the input data and the type definition of the respective
   * property. This includes normalization, offset and scale for
   * the type, as well as the handling of possible default values.
   *
   * @param propertyId - The name/ID of the property
   * @returns The property value
   * @throws MetadataError If the schema class that this entity
   * is an instance of does not define a property with the given
   * name/ID.
   */
  getPropertyValue(propertyId: string): any;

  /**
   * Obtains the value of the metadata property with the given semantic.
   *
   * This return the result of calling `getPropertyValue` with the
   * name/ID of the property that has the given semantic, or
   * `undefined` if there is no property with this semantic.
   *
   * @param semantic - The semantic
   * @throws MetadataError If the schema class that this entity
   * is an instance of does not define a property with the
   * resulting name/ID.
   */
  getPropertyValueBySemantic(semantic: string): any;
}

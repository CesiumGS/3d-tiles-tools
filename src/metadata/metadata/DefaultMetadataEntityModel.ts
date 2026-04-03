import { MetadataClass } from "../../structure";

import { MetadataEntityModel } from "./MetadataEntityModel";
import { MetadataValues } from "./MetadataValues";
import { MetadataError } from "./MetadataError";

/**
 * Default implementation of a `MetadataEntityModel` that is backed
 * by the JSON representation of the metadata.
 *
 * (The JSON representation are just the `metadataEntity.properties`
 * from the input JSON)
 *
 * @internal
 */
export class DefaultMetadataEntityModel implements MetadataEntityModel {
  private readonly metadataClass: MetadataClass;
  private readonly json: any;
  private readonly semanticToPropertyId: { [key: string]: string };

  constructor(
    metadataClass: MetadataClass,
    semanticToPropertyId: { [key: string]: string },
    json: any
  ) {
    this.metadataClass = metadataClass;
    this.semanticToPropertyId = semanticToPropertyId;
    this.json = json;
  }

  /** {@inheritDoc MetadataEntityModel.getPropertyValue} */
  getPropertyValue(propertyId: string): any {
    const properties = this.metadataClass.properties;
    if (!properties) {
      throw new MetadataError(`Metadata class does not have any properties`);
    }
    const property = properties[propertyId];
    if (!property) {
      throw new MetadataError(
        `Metadata class does not have property ${propertyId}`
      );
    }
    const value = this.json[propertyId];
    const offset = this.json.offset;
    const scale = this.json.scale;
    return MetadataValues.processValue(property, offset, scale, value);
  }

  /** {@inheritDoc MetadataEntityModel.getPropertyValueBySemantic} */
  getPropertyValueBySemantic(semantic: string): any {
    const propertyId = this.semanticToPropertyId[semantic];
    if (propertyId === undefined) {
      return undefined;
    }
    return this.getPropertyValue(propertyId);
  }
}

import { defined } from "../../base/defined";

import { MetadataEntityModel } from "../MetadataEntityModel";
import { MetadataValues } from "../MetadataValues";
import { MetadataError } from "../MetadataError";
import { PropertyTableModel } from "../PropertyTableModel";

/**
 * Implementation of a `MetadataEntityModel` that is backed by binary
 * data (specifically, by a `PropertyTableModel`)
 *
 * @internal
 */
export class BinaryMetadataEntityModel implements MetadataEntityModel {
  private readonly _propertyTableModel: PropertyTableModel;
  private readonly _entityIndex: number;
  private readonly _semanticToPropertyId: { [key: string]: string };

  constructor(
    propertyTableModel: PropertyTableModel,
    entityIndex: number,
    semanticToPropertyId: { [key: string]: string }
  ) {
    this._propertyTableModel = propertyTableModel;
    this._entityIndex = entityIndex;
    this._semanticToPropertyId = semanticToPropertyId;
  }

  /** {@inheritDoc MetadataEntityModel.getPropertyValue} */
  getPropertyValue(propertyId: string): any {
    const propertyTableModel = this._propertyTableModel;
    const classProperty = propertyTableModel.getClassProperty(propertyId);
    if (!defined(classProperty)) {
      const message = `The class does not define a property ${propertyId}`;
      throw new MetadataError(message);
    }
    const propertyTableProperty =
      propertyTableModel.getPropertyTableProperty(propertyId);
    if (!defined(propertyTableProperty)) {
      const message = `The property table does not define a property ${propertyId}`;
      throw new MetadataError(message);
    }
    const propertyModel = propertyTableModel.getPropertyModel(propertyId);
    if (!propertyModel) {
      const message =
        `The property table does not ` +
        `define a property model for ${propertyId}`;
      throw new MetadataError(message);
    }
    const value = propertyModel.getPropertyValue(this._entityIndex);
    const offsetOverride = propertyTableProperty.offset;
    const scaleOverride = propertyTableProperty.scale;
    const processedValue = MetadataValues.processValue(
      classProperty,
      offsetOverride,
      scaleOverride,
      value
    );
    return processedValue;
  }

  /** {@inheritDoc MetadataEntityModel.getPropertyValueBySemantic} */
  getPropertyValueBySemantic(semantic: string): any {
    const propertyId = this._semanticToPropertyId[semantic];
    if (!defined(propertyId)) {
      return undefined;
    }
    return this.getPropertyValue(propertyId);
  }
}

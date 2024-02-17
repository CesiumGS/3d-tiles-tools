import { defined } from "../../base";

import { MetadataEntityModel } from "./MetadataEntityModel";
import { MetadataValues } from "./MetadataValues";
import { MetadataError } from "./MetadataError";
import { PropertyTableModel } from "./PropertyTableModel";

/**
 * Implementation of a `MetadataEntityModel` that is backed by an
 * arbitrary implementation of `PropertyTableModel`
 *
 * @internal
 */
export class TableMetadataEntityModel implements MetadataEntityModel {
  private readonly propertyTableModel: PropertyTableModel;
  private readonly entityIndex: number;
  private readonly semanticToPropertyId: { [key: string]: string };
  private readonly enumValueValueNames: {
    [key: string]: { [key: number]: string };
  };

  constructor(
    propertyTableModel: PropertyTableModel,
    entityIndex: number,
    semanticToPropertyId: { [key: string]: string },
    enumValueValueNames: { [key: string]: { [key: number]: string } }
  ) {
    this.propertyTableModel = propertyTableModel;
    this.entityIndex = entityIndex;
    this.semanticToPropertyId = semanticToPropertyId;
    this.enumValueValueNames = enumValueValueNames;
  }

  /** {@inheritDoc MetadataEntityModel.getPropertyValue} */
  getPropertyValue(propertyId: string): any {
    const propertyTableModel = this.propertyTableModel;
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

    // Obtain the raw property value from the property model
    const propertyValue = propertyModel.getPropertyValue(this.entityIndex);

    // If the property is an enum property, translate the (numeric)
    // property values into their string representation
    if (classProperty.type === "ENUM") {
      const enumType = classProperty.enumType;
      if (!defined(enumType)) {
        const message =
          `The class property ${propertyId} is has the type ` +
          `'ENUM', but does not define an 'enumType'`;
        throw new MetadataError(message);
      }
      const enumValueValueNames = this.enumValueValueNames;
      const valueValueNames = enumValueValueNames[enumType];
      if (!defined(valueValueNames)) {
        const message =
          `The class property ${propertyId} is has the enum type ${enumType}, ` +
          `but this enum type was not defined in the schema`;
        throw new MetadataError(message);
      }
      const processedValue = MetadataValues.processNumericEnumValue(
        classProperty,
        valueValueNames,
        propertyValue
      );
      return processedValue;
    }

    const offsetOverride = propertyTableProperty.offset;
    const scaleOverride = propertyTableProperty.scale;
    const processedValue = MetadataValues.processValue(
      classProperty,
      offsetOverride,
      scaleOverride,
      propertyValue
    );
    return processedValue;
  }

  /** {@inheritDoc MetadataEntityModel.getPropertyValueBySemantic} */
  getPropertyValueBySemantic(semantic: string): any {
    const propertyId = this.semanticToPropertyId[semantic];
    if (!defined(propertyId)) {
      return undefined;
    }
    return this.getPropertyValue(propertyId);
  }
}

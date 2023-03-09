import { defined } from "../../base/defined";

import { PropertyModel } from "../PropertyModel";
import { MetadataError } from "../MetadataError";

import { BinaryPropertyTable } from "./BinaryPropertyTable";
import { StringPropertyModel } from "./StringPropertyModel";
import { BooleanPropertyModel } from "./BooleanPropertyModel";
import { NumericPropertyModel } from "./NumericPropertyModel";
import { NumericArrayPropertyModel } from "./NumericArrayPropertyModel";
import { StringArrayPropertyModel } from "./StringArrayPropertyModel";
import { BooleanArrayPropertyModel } from "./BooleanArrayPropertyModel";
import { NumericBuffers } from "./NumericBuffers";

/**
 * Methods related to `PropertyModel` instances that are created
 * from binary data.
 *
 * @internal
 */
export class BinaryPropertyModels {
  /**
   * Creates a `PropertyModel` for the specified property in
   * the given `BinaryPropertyTable`.
   *
   * This assumes that the input is structurally valid.
   *
   * This will determine the type of the property and access its
   * associated data (i.e. the required buffer views data) from
   * the given `BinaryPropertyTable`. For each type of property,
   * this will return a matching implementation of the
   * `PropertyModel` interface.
   *
   * @param binaryPropertyTable - The `BinaryPropertyTable`
   * @param propertyId - The property ID
   * @returns The `PropertyModel`
   * @throws MetadataError If the input data is not structurally
   * valid
   */
  static createPropertyModel(
    binaryPropertyTable: BinaryPropertyTable,
    propertyId: string
  ): PropertyModel {
    // Implementation note:
    // It would be nice to do some of the sanity checks upfront (e.g.
    // checking that the string offsets have been defined properly
    // when the type is 'STRING'). But in order to exploit the
    // TypeScript definedness checks, and avoid the use of the
    // non-null-assertion '!', some checks have to be done right
    // before a certain value is used. It might be possible to
    // find a more "elegant" solution here, but it's unlikely
    // that the final, nested `if(isArray) { if (type===X) {}}`
    // check could be avoided.

    // Obtain the `ClassProperty`
    const metadataClass = binaryPropertyTable.metadataClass;
    const classProperties = metadataClass.properties;
    if (!classProperties) {
      throw new MetadataError(`The class does not define any properties`);
    }
    const classProperty = classProperties[propertyId];
    if (!classProperty) {
      throw new MetadataError(
        `The class does not define property ${propertyId}`
      );
    }

    // Obtain the `PropertyTableProperty`
    const propertyTable = binaryPropertyTable.propertyTable;
    const propertyTableProperties = propertyTable.properties;
    if (!propertyTableProperties) {
      throw new MetadataError(
        `The property table does not define any properties`
      );
    }
    const propertyTableProperty = propertyTableProperties[propertyId];
    if (!propertyTableProperty) {
      throw new MetadataError(
        `The property table does not define property ${propertyId}`
      );
    }

    // Obtain the required buffers from the binary data:
    const binaryBufferData = binaryPropertyTable.binaryBufferData;
    const bufferViewsData = binaryBufferData.bufferViewsData;

    // Obtain the `values` buffer view data
    const valuesBufferViewIndex = propertyTableProperty.values;
    const valuesBufferViewData = bufferViewsData[valuesBufferViewIndex];

    // Obtain the `arrayOffsets` buffer view data
    const arrayOffsetsBufferViewIndex = propertyTableProperty.arrayOffsets;
    let arrayOffsetsBufferViewData = undefined;
    if (defined(arrayOffsetsBufferViewIndex)) {
      arrayOffsetsBufferViewData = bufferViewsData[arrayOffsetsBufferViewIndex];
    }
    const arrayOffsetType = propertyTableProperty.arrayOffsetType ?? "UINT32";

    // Obtain the `stringOffsets` buffer view data
    const stringOffsetsBufferViewIndex = propertyTableProperty.stringOffsets;
    let stringOffsetsBufferViewData = undefined;
    if (defined(stringOffsetsBufferViewIndex)) {
      stringOffsetsBufferViewData =
        bufferViewsData[stringOffsetsBufferViewIndex];
    }
    const stringOffsetType = propertyTableProperty.stringOffsetType ?? "UINT32";

    // Determine the `enumValueType` of the property
    const enumType = classProperty.enumType;
    let enumValueType = undefined;
    if (defined(enumType)) {
      const binaryEnumInfo = binaryPropertyTable.binaryEnumInfo;
      const enumValueTypes = binaryEnumInfo.enumValueTypes;
      enumValueType = enumValueTypes[enumType] ?? "UINT16";
    }

    // Create the `PropertyModel` implementation that matches
    // the type of the property
    const type = classProperty.type;
    const componentType = classProperty.componentType;
    const count = classProperty.count;
    const isArray = classProperty.array === true;
    if (isArray) {
      if (type === "STRING") {
        if (!stringOffsetsBufferViewData) {
          throw new MetadataError(
            `The property ${propertyId} is an array of strings, ` +
              `but no string offsets have been defined`
          );
        }

        const propertyModel = new StringArrayPropertyModel(
          valuesBufferViewData,
          arrayOffsetsBufferViewData,
          arrayOffsetType,
          stringOffsetsBufferViewData,
          stringOffsetType,
          count
        );
        return propertyModel;
      }
      if (type === "BOOLEAN") {
        const propertyModel = new BooleanArrayPropertyModel(
          valuesBufferViewData,
          arrayOffsetsBufferViewData,
          arrayOffsetType,
          count
        );
        return propertyModel;
      }
      if (type === "ENUM") {
        if (!enumValueType) {
          throw new MetadataError(
            `The property ${propertyId} is an enum, ` +
              `but no enum value type has been defined`
          );
        }

        const propertyModel = new NumericArrayPropertyModel(
          type,
          valuesBufferViewData,
          enumValueType,
          arrayOffsetsBufferViewData,
          arrayOffsetType,
          count
        );
        return propertyModel;
      }
      // The 'type' must be a numeric (array) type here

      if (!defined(componentType)) {
        throw new MetadataError(
          `The property ${propertyId} is a numeric array, ` +
            `but no component type has been defined`
        );
      }

      const propertyModel = new NumericArrayPropertyModel(
        type,
        valuesBufferViewData,
        componentType,
        arrayOffsetsBufferViewData,
        arrayOffsetType,
        count
      );
      return propertyModel;
    }

    // The property must be a non-array property here:
    if (type === "STRING") {
      if (!stringOffsetsBufferViewData) {
        throw new MetadataError(
          `The property ${propertyId} has the type 'STRING', ` +
            `but no string offsets have been defined`
        );
      }

      const propertyModel = new StringPropertyModel(
        valuesBufferViewData,
        stringOffsetsBufferViewData,
        stringOffsetType
      );
      return propertyModel;
    }
    if (type === "BOOLEAN") {
      const propertyModel = new BooleanPropertyModel(valuesBufferViewData);
      return propertyModel;
    }
    if (type === "ENUM") {
      if (!enumValueType) {
        throw new MetadataError(
          `The property ${propertyId} is an enum, ` +
            `but no enum value type has been defined`
        );
      }

      const propertyModel = new NumericPropertyModel(
        type,
        valuesBufferViewData,
        enumValueType
      );
      return propertyModel;
    }

    // The property must be a (non-array) numeric property here

    if (!defined(componentType)) {
      throw new MetadataError(
        `The property ${propertyId} is numeric, ` +
          `but no component type has been defined`
      );
    }

    const propertyModel = new NumericPropertyModel(
      type,
      valuesBufferViewData,
      componentType
    );
    return propertyModel;
  }

  /**
   * Returns the 'slice' information that is given by an offsets
   * buffer or a fixed number.
   *
   * This returns `{ offset, length }` for the `arrayOffsets` or
   * `stringOffsets` of a property, for a given index.
   *
   * When the given `count` is defined, then the result will
   * just be `{ index * count, count }`.
   *
   * Otherwise, the result will be `{ offset, length }`, where `offset`
   * is the offset that is read from the given buffer at index `index`,
   * and `length` is `offset[index+1] - offset[index]`.
   *
   * @param index - The index
   * @param offsetsBuffer - The offsets
   * @param offsetType - The `componentType` for the offsets
   * @param count - The count
   * @returns The slice information
   * @throws MetadataError If both the `count` and the `offsetsBuffer`
   * are `undefined`.
   */
  static computeSlice(
    index: number,
    offsetsBuffer: Buffer | undefined,
    offsetType: string,
    count: number | undefined
  ): { offset: number; length: number } {
    if (defined(count)) {
      return {
        offset: index * count,
        length: count,
      };
    }
    if (!offsetsBuffer) {
      throw new MetadataError(
        `Neither the 'count' nor the offsets buffer have been defined`
      );
    }
    const offset = NumericBuffers.getNumericFromBuffer(
      offsetsBuffer,
      index,
      offsetType
    );
    const nextOffset = NumericBuffers.getNumericFromBuffer(
      offsetsBuffer,
      index + 1,
      offsetType
    );
    const length = nextOffset - offset;
    return {
      offset: offset,
      length: length,
    };
  }
}

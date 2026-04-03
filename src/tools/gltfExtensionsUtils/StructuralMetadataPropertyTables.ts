import { MetadataError } from "../../metadata";
import { BinaryPropertyTable } from "../../metadata";

import { EXTStructuralMetadata } from "../../gltf-extensions";
import { PropertyTablePropertyOffsetType } from "../../gltf-extensions";
import { StructuralMetadataPropertyTable as PropertyTable } from "../../gltf-extensions";

/**
 * Methods for creating `PropertyTable` objects for the glTF-Transform
 * implementation of the `EXT_structural_metadata` implementation.
 *
 * These methods are convenience methods for creating the property table
 * instances, as the actual 'model' classes of glTF-Transform.
 *
 * The implementation of the extension does not depend on this class.
 * It would be possible to create the PropertyTable objects by assigning
 * all properties and data manually and programmatically. But instead
 * of manually assigning things like tha `values/arrayOffsets/stringOffsets`
 * buffer data, this class allows to build the instance based on a
 * `BinaryPropertyTable`, which is the summary of the "raw" data that a
 * property table consists of, and can be built conveniently with the
 * `BinaryPropertyTableBuilder` class.
 *
 * The general usage pattern is
 * ```
 * // Build the BinaryPropertyTable:
 * const b = BinaryPropertyTableBuilder.create(schema, "exampleClass", "Name");
 * b.addProperty(..., ...);
 * const binaryPropertyTable = b.build();
 *
 * // Create a glTF-Transform PropertyTable object from
 * // the BinaryPropertyTable:
 * const propertyTable = StructuralMetadataPropertyTables.create(
 *   extStructuralMetadata,
 *   binaryPropertyTable
 * );
 * ```
 *
 * @internal
 */
export class StructuralMetadataPropertyTables {
  /**
   * Creates a new instance of a `PropertyTable`, based on the given input.
   *
   * @param extStructuralMetadata - The `EXTStructuralMetadata` object
   * that will be used for creating the instances of the 'model' classes
   * that are part of the glTF-Transform implementation of the
   * `EXT_structural_metadata` extension.
   * @param binaryPropertyTable - The `BinaryPropertyTable` that contains
   * all (raw) information that is required for building the property
   * table.
   * @throws MetadataError On errors (to be defined more precisely)
   */
  static create(
    extStructuralMetadata: EXTStructuralMetadata,
    binaryPropertyTable: BinaryPropertyTable
  ): PropertyTable {
    // Create the PropertyTable object, and fill in the basic information
    // from the 'raw' JSON representation of the property table
    const propertyTable = extStructuralMetadata.createPropertyTable();
    const propertyTableJson = binaryPropertyTable.propertyTable;
    if (propertyTableJson.name !== undefined) {
      propertyTable.setObjectName(propertyTableJson.name);
    }
    propertyTable.setClass(propertyTableJson.class);
    propertyTable.setCount(propertyTableJson.count);

    // Create all PropertyTablePropery objects, and put
    // them into the PropertyTable
    const binaryMetadata = binaryPropertyTable.binaryMetadata;
    const metadataClass = binaryMetadata.metadataClass;
    const classProperties = metadataClass.properties || {};
    const propertyNames = Object.keys(classProperties);
    for (const propertyName of propertyNames) {
      const propertyTableProperty =
        StructuralMetadataPropertyTables.createPropertyTableProperty(
          extStructuralMetadata,
          binaryPropertyTable,
          propertyName
        );
      propertyTable.setProperty(propertyName, propertyTableProperty);
    }
    return propertyTable;
  }

  /**
   * Creates a single `PropertyTableProperty`, to be put into the
   * glTF-Transform `PropertyTable` object, based on the given
   * input data.
   *
   * @param extStructuralMetadata - The `EXTStructuralMetdadata` for
   * creating the glTF-Transform model objects
   * @param binaryPropertyTable - The `BinaryPropertyTable` that
   * contains all the input data
   * @param propertyId - The ID (name) of the property
   * @returns The `PropertyTableProperty`
   * @throws MetadataError On errors (to be defined more precisely)
   */
  private static createPropertyTableProperty(
    extStructuralMetadata: EXTStructuralMetadata,
    binaryPropertyTable: BinaryPropertyTable,
    propertyId: string
  ) {
    // Note: There is some redundancy of code here and in the
    // BinaryPropertyModels::createPropertyModel method:
    // Both methods mainly collect the values/arrayOffsets/stringOffsets
    // data from the raw binaryPropertyTable input. But they create
    // different "model" classes: The BinaryPropertyModels create
    // instance of the main 3D Tiles tools model classes whereas here,
    // the glTF-Transform model classes are created.

    // Obtain the `PropertyTableProperty`
    const propertyTableJson = binaryPropertyTable.propertyTable;
    const propertyTablePropertiesJson = propertyTableJson.properties;
    if (!propertyTablePropertiesJson) {
      throw new MetadataError(
        `The property table does not define any properties`
      );
    }
    const propertyTablePropertyJson = propertyTablePropertiesJson[propertyId];
    if (!propertyTablePropertyJson) {
      throw new MetadataError(
        `The property table does not define property ${propertyId}`
      );
    }

    // Obtain the required buffers from the binary data:
    const binaryMetadata = binaryPropertyTable.binaryMetadata;
    const binaryBufferData = binaryMetadata.binaryBufferData;
    const bufferViewsData = binaryBufferData.bufferViewsData;

    // Obtain the `values` buffer view data
    const valuesBufferViewIndex = propertyTablePropertyJson.values;
    const valuesBufferViewData = bufferViewsData[valuesBufferViewIndex];

    // Obtain the `arrayOffsets` buffer view data
    const arrayOffsetsBufferViewIndex = propertyTablePropertyJson.arrayOffsets;
    let arrayOffsetsBufferViewData: Buffer | undefined = undefined;
    if (arrayOffsetsBufferViewIndex !== undefined) {
      arrayOffsetsBufferViewData = bufferViewsData[arrayOffsetsBufferViewIndex];
    }
    const arrayOffsetType =
      propertyTablePropertyJson.arrayOffsetType ?? "UINT32";

    // Obtain the `stringOffsets` buffer view data
    const stringOffsetsBufferViewIndex =
      propertyTablePropertyJson.stringOffsets;
    let stringOffsetsBufferViewData: Buffer | undefined = undefined;
    if (stringOffsetsBufferViewIndex !== undefined) {
      stringOffsetsBufferViewData =
        bufferViewsData[stringOffsetsBufferViewIndex];
    }
    const stringOffsetType =
      propertyTablePropertyJson.stringOffsetType ?? "UINT32";

    // Create the glTF-Transform PropertyTableProperty object,
    // and fill it with the basic information from the raw JSON
    // property table property
    const propertyTableProperty =
      extStructuralMetadata.createPropertyTableProperty();

    propertyTableProperty.setArrayOffsetType(
      arrayOffsetType as PropertyTablePropertyOffsetType
    );
    propertyTableProperty.setStringOffsetType(
      stringOffsetType as PropertyTablePropertyOffsetType
    );
    propertyTableProperty.setOffset(propertyTablePropertyJson.offset);
    propertyTableProperty.setScale(propertyTablePropertyJson.scale);
    propertyTableProperty.setMax(propertyTablePropertyJson.max);
    propertyTableProperty.setMin(propertyTablePropertyJson.min);

    // Assign the values, arrayOffsets and stringOffsets buffers
    // from the buffer view data that was given in the input,
    // to the actual glTF-Transform PropertyTableProperty object
    propertyTableProperty.setValues(valuesBufferViewData);
    if (arrayOffsetsBufferViewData) {
      propertyTableProperty.setArrayOffsets(arrayOffsetsBufferViewData);
    }
    if (stringOffsetsBufferViewData) {
      propertyTableProperty.setStringOffsets(stringOffsetsBufferViewData);
    }

    return propertyTableProperty;
  }
}

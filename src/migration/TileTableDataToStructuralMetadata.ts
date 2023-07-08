import { Document } from "@gltf-transform/core";
import { Primitive } from "@gltf-transform/core";

import { EXTStructuralMetadata } from "../contentProcessing/gltftransform/EXTStructuralMetadata";
import {
  MeshPrimitiveStructuralMetadata,
  PropertyTable,
} from "../contentProcessing/gltftransform/StructuralMetadata";
import { StructuralMetadata } from "../contentProcessing/gltftransform/StructuralMetadata";
import { StructuralMetadataPropertyTables } from "../contentProcessing/gltftransform/StructuralMetadataPropertyTables";

import { BatchTable } from "../structure/TileFormats/BatchTable";

import { BatchTableSchemas } from "./BatchTableSchemas";
import { TilePropertyTableModels } from "./TilePropertyTableModels";
import { AccessorCreation } from "./AccessorCreation";

import { PropertyTableModels } from "../metadata/PropertyTableModels";
import { BinaryPropertyTableModel } from "../metadata/binary/BinaryPropertyTableModel";
import { BinaryPropertyTableBuilder } from "../metadata/binary/BinaryPropertyTableBuilder";
import { PropertyModels } from "../metadata/PropertyModels";

/**
 * Methods to transfer information from (legacy) batch table data
 * into glTF assets, using the `EXT_structural_metadata` extension.
 */
export class TileTableDataToStructuralMetadata {
  /**
   * Assigns the data from the given batch table to the (single)
   * mesh primitive that represents a point cloud, by converting
   * the batch table columns into vertex attributes.
   *
   * If the given batch table does not contain any properties
   * that can be expressed as vertex attributes, then nothing
   * is done.
   *
   * @param document - The glTF-Transform document
   * @param primitive - The glTF-Transform mesh primitive
   * @param batchTable - The `BatchTable`
   * @param batchTableBinary - The batch table binary
   * @param numRows - The number of rows (POINTS_LENGTH) of the table
   */
  static assignPerPointProperties(
    document: Document,
    primitive: Primitive,
    batchTable: BatchTable,
    batchTableBinary: Buffer,
    numRows: number
  ) {
    const metadataSchema = BatchTableSchemas.createSchema(
      "batch_table",
      batchTable
    );
    if (!metadataSchema) {
      return;
    }

    //*/
    console.log("Schema:");
    console.log(JSON.stringify(metadataSchema, null, 2));
    //*/

    // Obtain the (single) Metadata class and its name
    const classes = metadataSchema.classes || {};
    const classNames = Object.keys(classes);
    if (classNames.length < 1) {
      return;
    }
    const className = classNames[0];
    const metadataClass = classes[className];

    // Create the extension object
    const extStructuralMetadata = document.createExtension(
      EXTStructuralMetadata
    );

    // Create the top-level `EXT_structural_metadata´ object that
    // contains the schema and the property attribute definitions,
    // and assign it to the document root
    const structuralMetadata = extStructuralMetadata.createStructuralMetadata();

    const schema = extStructuralMetadata.createSchemaFrom(metadataSchema);
    structuralMetadata.setSchema(schema);

    const propertyAttribute = extStructuralMetadata.createPropertyAttribute();
    propertyAttribute.setClass(className);
    structuralMetadata.addPropertyAttribute(propertyAttribute);

    const root = document.getRoot();
    root.setExtension<StructuralMetadata>(
      "EXT_structural_metadata",
      structuralMetadata
    );

    // Create the `PropertyTableModel` that will provide the `PropertyModel`
    // instances (i.e. columns) for each property
    const batchTablePropertyTableModel = TilePropertyTableModels.create(
      batchTable,
      batchTableBinary,
      numRows
    );

    //*/
    console.log("Property table from batch table:");
    const s = PropertyTableModels.createString(
      batchTablePropertyTableModel,
      10
    );
    console.log(s);
    //*/

    // Create the `EXT_structural_metadata` object for the mesh primitive
    const meshPrimitiveStructuralMetadata =
      extStructuralMetadata.createMeshPrimitiveStructuralMetadata();

    // Convert each property into an attribute of the mesh primitive
    const properties = metadataClass.properties || {};
    const propertyNames = Object.keys(properties);
    for (const propertyName of propertyNames) {
      const propertyModel =
        batchTablePropertyTableModel.getPropertyModel(propertyName);
      if (!propertyModel) {
        continue;
      }
      const classProperty = properties[propertyName];
      const propertyAttributeProperty =
        extStructuralMetadata.createPropertyAttributeProperty();

      let attributeName = propertyName.toUpperCase();
      if (!attributeName.startsWith("_")) {
        attributeName = "_" + attributeName;
      }

      const accessor = AccessorCreation.createAccessorFromProperty(
        document,
        classProperty,
        propertyModel,
        numRows
      );
      primitive.setAttribute(attributeName, accessor);

      propertyAttributeProperty.setAttribute(attributeName);
      propertyAttribute.setProperty(propertyName, propertyAttributeProperty);
    }
    meshPrimitiveStructuralMetadata.addPropertyAttribute(propertyAttribute);

    primitive.setExtension<MeshPrimitiveStructuralMetadata>(
      "EXT_structural_metadata",
      meshPrimitiveStructuralMetadata
    );
  }

  /**
   * Converts the data from the given batch table into a
   * `EXT_structural_metadata` property table.
   *
   * This will create a metadata schema from the given batch
   * table, create the top-level `EXT_structural_metadata`
   * extension object that contains the schema definition
   * and the property table definition.
   *
   * @param document - The glTF-Transform document
   * @param batchTable - The `BatchTable`
   * @param batchTableBinary - The batch table binary
   * @param numRows - The number of rows (BATCH_LENGTH) of the table
   * @returns The property table
   */
  static convertBatchTableToPropertyTable(
    document: Document,
    batchTable: BatchTable,
    batchTableBinary: Buffer,
    numRows: number
  ): PropertyTable | undefined {
    const metadataSchema = BatchTableSchemas.createSchema(
      "batch_table",
      batchTable
    );
    if (!metadataSchema) {
      return undefined;
    }

    //*/
    console.log("Schema:");
    console.log(JSON.stringify(metadataSchema, null, 2));
    //*/

    // Obtain the (single) Metadata class and its name
    const classes = metadataSchema.classes || {};
    const classNames = Object.keys(classes);
    if (classNames.length < 1) {
      return;
    }
    const className = classNames[0];
    const metadataClass = classes[className];

    // Create the extension object
    const extStructuralMetadata = document.createExtension(
      EXTStructuralMetadata
    );

    // Create the top-level `EXT_structural_metadata´ object that
    // contains the schema and assign it to the document root
    const structuralMetadata = extStructuralMetadata.createStructuralMetadata();

    const schema = extStructuralMetadata.createSchemaFrom(metadataSchema);
    structuralMetadata.setSchema(schema);

    const root = document.getRoot();
    root.setExtension<StructuralMetadata>(
      "EXT_structural_metadata",
      structuralMetadata
    );

    // Create the `PropertyTableModel` that will provide the `PropertyModel`
    // instances (i.e. columns) for each property
    const batchTablePropertyTableModel = TilePropertyTableModels.create(
      batchTable,
      batchTableBinary,
      numRows
    );

    //*/
    console.log("Property table from batch table:");
    const s = PropertyTableModels.createString(
      batchTablePropertyTableModel,
      10
    );
    console.log(s);
    //*/

    // Build a `BinaryPropertyTable` by obtaining the property
    // values from the batch table and putting them into a
    // binary property table builder
    const b = BinaryPropertyTableBuilder.create(
      metadataSchema,
      className,
      "Property Table"
    );

    const properties = metadataClass.properties || {};
    const propertyNames = Object.keys(properties);
    for (const propertyName of propertyNames) {
      const propertyModel =
        batchTablePropertyTableModel.getPropertyModel(propertyName);
      if (!propertyModel) {
        continue;
      }
      const values = PropertyModels.createIterable(propertyModel, numRows);
      b.addProperty(propertyName, [...values]);
    }

    // Create a the binary property table, and convert it
    // into an `EXT_structural_metadata` property table
    const binaryPropertyTable = b.build();

    //*/
    {
      const m = new BinaryPropertyTableModel(binaryPropertyTable);
      const s = PropertyTableModels.createString(m);
      console.log("Creating structural metadata property table from");
      console.log(s);
    }
    //*/

    const structualMetadataPropertyTable =
      StructuralMetadataPropertyTables.create(
        extStructuralMetadata,
        binaryPropertyTable
      );

    structuralMetadata.addPropertyTable(structualMetadataPropertyTable);
    return structualMetadataPropertyTable;
  }
}

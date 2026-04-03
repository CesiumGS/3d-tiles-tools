import { Document } from "@gltf-transform/core";
import { Primitive } from "@gltf-transform/core";

import { BatchTable } from "../../structure";

import { EXTStructuralMetadata } from "../../gltf-extensions";
import { MeshPrimitiveStructuralMetadata } from "../../gltf-extensions";
import { StructuralMetadataPropertyTable as PropertyTable } from "../../gltf-extensions";
import { StructuralMetadata } from "../../gltf-extensions";

import { PropertyTableModels } from "../../metadata";
import { PropertyModels } from "../../metadata";
import { PropertyModel } from "../../metadata";
import { BinaryPropertyTableModel } from "../../metadata";
import { BinaryPropertyTableBuilder } from "../../metadata";

import { StructuralMetadataPropertyTables } from "../gltfExtensionsUtils/StructuralMetadataPropertyTables";

import { BatchTableSchemas } from "./BatchTableSchemas";
import { BatchTablePropertyTableModels } from "./BatchTablePropertyTableModels";
import { AccessorCreation } from "./AccessorCreation";
import { TileFormatsMigration } from "./TileFormatsMigration";

import { Loggers } from "../../base";
const logger = Loggers.get("migration");

/**
 * Methods to transfer information from (legacy) batch table data
 * into glTF assets, using the `EXT_structural_metadata` extension.
 *
 * @internal
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
   * @param externalProperties - External properties. These are property
   * model instances for properties of the batch table that are not
   * stored in the batch table binary, and accessed with the property ID.
   * @param numRows - The number of rows (POINTS_LENGTH) of the table
   */
  static assignPerPointProperties(
    document: Document,
    primitive: Primitive,
    batchTable: BatchTable,
    batchTableBinary: Buffer,
    externalProperties: { [key: string]: PropertyModel },
    numRows: number
  ) {
    const metadataSchema = BatchTableSchemas.createSchema(
      "batch_table",
      batchTable
    );
    if (!metadataSchema) {
      return;
    }

    if (
      TileFormatsMigration.DEBUG_LOG_FILE_CONTENT &&
      logger.isLevelEnabled("trace")
    ) {
      logger.trace("Schema:\n" + JSON.stringify(metadataSchema, null, 2));
    }

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

    const schema = extStructuralMetadata.createSchemaFrom(
      metadataSchema as any
    );
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
    const batchTablePropertyTableModel = BatchTablePropertyTableModels.create(
      batchTable,
      batchTableBinary,
      externalProperties,
      numRows
    );

    if (
      TileFormatsMigration.DEBUG_LOG_FILE_CONTENT &&
      logger.isLevelEnabled("trace")
    ) {
      const s = PropertyTableModels.createString(
        batchTablePropertyTableModel,
        10
      );
      logger.trace("Property table from batch table:\n" + s);
    }

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

    if (
      TileFormatsMigration.DEBUG_LOG_FILE_CONTENT &&
      logger.isLevelEnabled("trace")
    ) {
      logger.trace("Schema:\n" + JSON.stringify(metadataSchema, null, 2));
    }

    // Obtain the (single) Metadata class and its name
    const classes = metadataSchema.classes || {};
    const classNames = Object.keys(classes);
    if (classNames.length < 1) {
      return undefined;
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

    const schema = extStructuralMetadata.createSchemaFrom(
      metadataSchema as any
    );
    structuralMetadata.setSchema(schema);

    const root = document.getRoot();
    root.setExtension<StructuralMetadata>(
      "EXT_structural_metadata",
      structuralMetadata
    );

    // Create the `PropertyTableModel` that will provide the `PropertyModel`
    // instances (i.e. columns) for each property
    const batchTablePropertyTableModel = BatchTablePropertyTableModels.create(
      batchTable,
      batchTableBinary,
      {},
      numRows
    );

    if (
      TileFormatsMigration.DEBUG_LOG_FILE_CONTENT &&
      logger.isLevelEnabled("trace")
    ) {
      const s = PropertyTableModels.createString(
        batchTablePropertyTableModel,
        10
      );
      logger.trace("Property table from batch table:\n" + s);
    }

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
      const property = properties[propertyName];

      // For STRING-typed properties, convert the values into a strings,
      // depending on their actual structure, as described in 'processAny'
      if (property.type === "STRING") {
        const array = TileTableDataToStructuralMetadata.processAny(values);
        b.addProperty(propertyName, array);
      } else {
        b.addProperty(propertyName, [...values]);
      }
    }

    // Create a the binary property table, and convert it
    // into an `EXT_structural_metadata` property table
    const binaryPropertyTable = b.build();

    if (
      TileFormatsMigration.DEBUG_LOG_FILE_CONTENT &&
      logger.isLevelEnabled("trace")
    ) {
      const m = new BinaryPropertyTableModel(binaryPropertyTable);
      const s = PropertyTableModels.createString(m);
      logger.trace("Creating structural metadata property table from:\n" + s);
    }

    const structualMetadataPropertyTable =
      StructuralMetadataPropertyTables.create(
        extStructuralMetadata,
        binaryPropertyTable
      );

    structuralMetadata.addPropertyTable(structualMetadataPropertyTable);
    return structualMetadataPropertyTable;
  }

  /**
   * Process values from an arbitrarily-typed property, so that the
   * resulting values can be stored as a STRING-typed property in
   * the binary representation of a property table.
   *
   * Any `null` and `undefined` elements will remain `null`
   * or `undefined`, respectively.
   * For array values, this method will be applied recursively to
   * the elements.
   * For object-typed values, the JSON representation of the
   * elements will be returned.
   * For other types, the string representation of the elements
   * will be returned.
   *
   * @param values - The input values
   * @returns The resulting values
   */
  private static processAny(values: Iterable<any>): any[] {
    return [...values].map((v) => {
      if (v === null) {
        return null;
      }
      if (v === undefined) {
        return undefined;
      }
      if (Array.isArray(v)) {
        return TileTableDataToStructuralMetadata.processAny(v);
      }
      if (typeof v === "object") {
        return JSON.stringify(v);
      }
      return `${v}`;
    });
  }
}

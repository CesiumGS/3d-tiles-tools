import { Document } from "@gltf-transform/core";
import { Primitive } from "@gltf-transform/core";

import { EXTStructuralMetadata } from "../contentProcessing/gltftransform/EXTStructuralMetadata";
import { MeshPrimitiveStructuralMetadata } from "../contentProcessing/gltftransform/StructuralMetadata";
import { StructuralMetadata } from "../contentProcessing/gltftransform/StructuralMetadata";

import { BatchTable } from "../structure/TileFormats/BatchTable";

import { BatchTableSchemas } from "./BatchTableSchemas";
import { TilePropertyTableModels } from "./TilePropertyTableModels";
import { PropertyModelAccessors } from "./PropertyModelAccessors";
import { PropertyTableModels } from "../metadata/PropertyTableModels";

export class TileTableDataToStructuralMetadata {
  static assign(
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

    const classes = metadataSchema.classes || {};
    const classNames = Object.keys(classes);
    if (classNames.length < 1) {
      return;
    }
    const className = classNames[0];
    const metadataClass = classes[className];

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

    const extStructuralMetadata = document.createExtension(
      EXTStructuralMetadata
    );
    const schema = extStructuralMetadata.createSchemaFrom(metadataSchema);

    const structuralMetadata = extStructuralMetadata.createStructuralMetadata();
    structuralMetadata.setSchema(schema);

    const root = document.getRoot();

    root.setExtension<StructuralMetadata>(
      "EXT_structural_metadata",
      structuralMetadata
    );

    const meshPrimitiveStructuralMetadata =
      extStructuralMetadata.createMeshPrimitiveStructuralMetadata();

    const propertyAttribute = extStructuralMetadata.createPropertyAttribute();
    propertyAttribute.setClass(className);

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

      const accessor = PropertyModelAccessors.createAccessor(
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
    structuralMetadata.addPropertyAttribute(propertyAttribute);

    primitive.setExtension<MeshPrimitiveStructuralMetadata>(
      "EXT_structural_metadata",
      meshPrimitiveStructuralMetadata
    );
  }
}

import { Document } from "@gltf-transform/core";
import { TypedArray } from "@gltf-transform/core";
import { Primitive } from "@gltf-transform/core";
import { Accessor } from "@gltf-transform/core";
import { GLTF } from "@gltf-transform/core";

import { Iterables } from "../base/Iterables";

import { EXTStructuralMetadata } from "../contentProcessing/gltftransform/EXTStructuralMetadata";
import { MeshPrimitiveStructuralMetadata } from "../contentProcessing/gltftransform/StructuralMetadata";
import { StructuralMetadata } from "../contentProcessing/gltftransform/StructuralMetadata";

import { ClassProperty } from "../structure/Metadata/ClassProperty";
import { BatchTable } from "../structure/TileFormats/BatchTable";

import { BatchTableSchemas } from "./BatchTableSchemas";
import { TilePropertyTableModels } from "./TilePropertyTableModels";
import { TileTableData } from "./TileTableData";

import { PropertyModel } from "../metadata/PropertyModel";

import { TileFormatError } from "../tileFormats/TileFormatError";
import { PropertyModels } from "../metadata/PropertyModels";

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

      const accessor = TileTableDataToStructuralMetadata.createAccessor(
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

  private static createAccessor(
    document: Document,
    classProperty: ClassProperty,
    propertyModel: PropertyModel,
    numRows: number
  ) {
    let type: GLTF.AccessorType | undefined = undefined;
    let array: TypedArray | undefined = undefined;

    if (classProperty.type === "SCALAR") {
      type = Accessor.Type.SCALAR;
    } else if (classProperty.type === "VEC2") {
      type = Accessor.Type.VEC2;
    } else if (classProperty.type === "VEC3") {
      type = Accessor.Type.VEC3;
    } else if (classProperty.type === "VEC4") {
      type = Accessor.Type.VEC4;
    } else {
      throw new TileFormatError(
        "Invalid class property type: " + classProperty.type
      );
    }

    let valuesIterable: Iterable<number>;
    if (
      classProperty.array === true ||
      classProperty.type === "VEC2" ||
      classProperty.type === "VEC3" ||
      classProperty.type === "VEC4"
    ) {
      const iterable = PropertyModels.createNumericArrayIterable(
        propertyModel,
        numRows
      );
      valuesIterable = Iterables.flatten(iterable);
    } else {
      valuesIterable = PropertyModels.createNumericScalarIterable(
        propertyModel,
        numRows
      );
    }

    if (classProperty.componentType === "INT8") {
      array = new Int8Array([...valuesIterable]);
    } else if (classProperty.componentType === "UINT8") {
      array = new Uint8Array([...valuesIterable]);
    } else if (classProperty.componentType === "INT16") {
      array = new Int16Array([...valuesIterable]);
    } else if (classProperty.componentType === "UINT16") {
      array = new Uint16Array([...valuesIterable]);
    } else if (classProperty.componentType === "INT32") {
      throw new TileFormatError(
        "Cannot create accessor with component type " +
          classProperty.componentType
      );
    } else if (classProperty.componentType === "UINT32") {
      throw new TileFormatError(
        "Cannot create accessor with component type " +
          classProperty.componentType
      );
    } else if (classProperty.componentType === "FLOAT32") {
      array = new Float32Array([...valuesIterable]);
    } else if (classProperty.componentType === "FLOAT64") {
      throw new TileFormatError(
        "Cannot create accessor with component type " +
          classProperty.componentType
      );
    } else {
      throw new TileFormatError(
        "Invalid class property component type: " + classProperty.componentType
      );
    }

    const accessor = document.createAccessor();
    const buffer = document.getRoot().listBuffers()[0];
    accessor.setBuffer(buffer);
    accessor.setType(type);
    accessor.setArray(array);
    return accessor;
  }
}

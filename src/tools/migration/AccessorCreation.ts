import { Document } from "@gltf-transform/core";
import { TypedArray } from "@gltf-transform/core";
import { Accessor } from "@gltf-transform/core";
import { GLTF } from "@gltf-transform/core";

import { Iterables } from "../../base";

import { ClassProperty } from "../../structure";

import { PropertyModel } from "../../metadata";
import { PropertyModels } from "../../metadata";

import { TileFormatError } from "../../tilesets";

/**
 * Methods to create glTF-Transform accessors from different forms
 * of input data.
 *
 * The `PropertyModel` instances are usually ones that are used for
 * accessing the batch- or feature tables of the legacy tile
 * formats, and that are supposed to be converted into accessors
 * that are part of the glTF metadata extensions.
 *
 * @internal
 */
export class AccessorCreation {
  /**
   * Creates a glTF-Transform accessor for the given property.
   *
   * The returned accessor will allow accessing the data of a
   * batch- or feature table. The given class property defines
   * the type and structure of the data. The given property
   * model provides the actual data elements.
   *
   * This is only applicable to `SCALAR`, `VEC2`, `VEC3`, and
   * `VEC4` typed properties, with component types `INT8`,
   * `UINT8`, `INT16`, `UINT16`, or `FLOAT32`.
   *
   * @param document - The glTF-Transform document
   * @param classProperty - The `ClassProperty`
   * @param propertyModel - The `PropertyModel`
   * @param numRows - The number of rows that the table has.
   * @returns The glTF-Transform accessor
   * @throws TileFormatError If the given class property refers
   * to a type that cannot be represented as a glTF accessor.
   */
  static createAccessorFromProperty(
    document: Document,
    classProperty: ClassProperty,
    propertyModel: PropertyModel,
    numRows: number
  ): Accessor {
    const accessorValues = AccessorCreation.createAccessorValues(
      classProperty,
      propertyModel,
      numRows
    );
    const accessor = AccessorCreation.createAccessorFromValues(
      document,
      classProperty,
      accessorValues
    );
    return accessor;
  }

  /**
   * Creates a glTF-Transform accessor for the given values.
   *
   * The returned accessor will contain the given values,
   * with the given class property defining the type and
   * structure of the accessor.
   *
   * This is only applicable to `SCALAR`, `VEC2`, `VEC3`, and
   * `VEC4` typed properties, with component types `INT8`,
   * `UINT8`, `INT16`, `UINT16`, or `FLOAT32`.
   *
   * @param document - The glTF-Transform document
   * @param classProperty - The `ClassProperty`
   * @param accessorValues - The accessor values
   * @returns The glTF-Transform accessor
   * @throws TileFormatError If the given class property refers
   * to a type that cannot be represented as a glTF accessor.
   */
  static createAccessorFromValues(
    document: Document,
    classProperty: ClassProperty,
    accessorValues: Iterable<number>
  ): Accessor {
    const type = AccessorCreation.getAccessorType(classProperty.type);
    if (!classProperty.componentType) {
      throw new TileFormatError(
        `Cannot create accessor for property with ` +
          `component type ${classProperty.componentType}`
      );
    }
    const array = AccessorCreation.createAccessorArray(
      classProperty.componentType,
      accessorValues
    );
    const accessor = document.createAccessor();
    const buffer = document.getRoot().listBuffers()[0];
    accessor.setBuffer(buffer);
    accessor.setType(type);
    accessor.setArray(array);
    return accessor;
  }

  /**
   * Returns the glTF-Transform acessor type for the given class
   * property type.
   *
   * @param classPropertyType - The class property type
   * @returns The glTF-Transform accessor type
   * @throws TileFormatError If the given class property type
   * is not `SCALAR`, `VEC2`, `VEC3`, or `VEC4`.
   */
  private static getAccessorType(classPropertyType: string): GLTF.AccessorType {
    switch (classPropertyType) {
      case "SCALAR":
        return Accessor.Type.SCALAR;
      case "VEC2":
        return Accessor.Type.VEC2;
      case "VEC3":
        return Accessor.Type.VEC3;
      case "VEC4":
        return Accessor.Type.VEC4;
    }
    throw new TileFormatError(
      "Invalid class property type: " + classPropertyType
    );
  }

  /**
   * Returns an iterable over the numeric values in the given
   * property model.
   *
   * This will return a _flat_ iterator over the data. This
   * means that when the class property has a type like `VEC2`,
   * and the values that are returned from the property model
   * are 2-element arrays, then these will be flattened into
   * a 1D-array.
   *
   * @param classProperty - The `ClassProperty`
   * @param propertyModel - The `PropertyModel`
   * @param numRows - The number of rows that the table has.
   * @returns The iterable
   */
  static createAccessorValues(
    classProperty: ClassProperty,
    propertyModel: PropertyModel,
    numRows: number
  ): Iterable<number> {
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
      return Iterables.flatten(iterable);
    }
    const iterable = PropertyModels.createNumericScalarIterable(
      propertyModel,
      numRows
    );
    return iterable;
  }

  /**
   * Returns the glTF-Transform typed array that is created from
   * the given accessor values.
   *
   * The result will be a flat, 1D typed array that contains the
   * numeric components of the given property model.
   *
   * @param componentType - The component type, e.g. `UINT16`
   * @param accessorValues - The accessor values
   * @returns The typed array
   * @throws TileFormatError If the given class property component
   * type is not `INT8`, `UINT8`, `INT16`, `UINT16`, or `FLOAT32`.
   */
  static createAccessorArray(
    componentType: string,
    accessorValues: Iterable<number>
  ): TypedArray {
    switch (componentType) {
      case "INT8":
        return new Int8Array([...accessorValues]);
      case "UINT8":
        return new Uint8Array([...accessorValues]);
      case "INT16":
        return new Int16Array([...accessorValues]);
      case "UINT16":
        return new Uint16Array([...accessorValues]);
      case "INT32":
        break;
      case "UINT32":
        break;
      case "INT64":
        break;
      case "UINT64":
        break;
      case "FLOAT32":
        return new Float32Array([...accessorValues]);
      case "FLOAT64":
        break;
    }
    throw new TileFormatError(
      "Cannot create accessor with component type " + componentType
    );
  }
}

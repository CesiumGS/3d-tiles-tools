import { BinaryBufferData } from "../../../base";
import { BinaryBuffers } from "../../../base";

import { ClassProperty } from "../../../structure";
import { MetadataClass } from "../../../structure";
import { Schema } from "../../../structure";
import { PropertyTable } from "../../../structure";
import { PropertyTableProperty } from "../../../structure";

import { MetadataError } from "../MetadataError";

import { MetadataUtilities } from "../MetadataUtilities";
import { BinaryMetadata } from "./BinaryMetadata";
import { BinaryPropertyTable } from "./BinaryPropertyTable";
import { BinaryPropertyTables } from "./BinaryPropertyTables";

/**
 * A class for building `BinaryPropertyTable` objects
 * from property values that are given as arrays.
 *
 * @internal
 */
export class BinaryPropertyTableBuilder {
  /**
   * Creates a new instance.
   *
   * @param schema - The metadata schema
   * @param propertyTableClass - The class name of the resulting
   * property table, i.e. the name of one class in the schema
   * @param propertyTableName - A name for the property table
   * @returns The builder
   * @throws MetadataError If the given schema does not contain
   * the specified class.
   */
  static create(
    schema: Schema,
    propertyTableClass: string,
    propertyTableName: string
  ): BinaryPropertyTableBuilder {
    return new BinaryPropertyTableBuilder(
      schema,
      propertyTableClass,
      propertyTableName
    );
  }

  /**
   * The schema that contains the class for which the property
   * table is built, and possible enum definitions that may be
   * required for resolving the binary representation of enum
   * values.
   */
  private readonly schema: Schema;

  /**
   * The class for which the property table is built
   */
  private readonly propertyTableClass: string;

  /**
   * A name for the property table
   */
  private readonly propertyTableName: string;

  /**
   * The data type with which array offsets will be stored
   * (this is the default and not modifiable for now)
   */
  private readonly arrayOffsetType = "UINT32";

  /**
   * The data type with which string offsets will be stored
   * (this is the default and not modifiable for now)
   */
  private readonly stringOffsetType = "UINT32";

  /**
   * The count (number of rows) of the property table.
   *
   * This is `undefined` until the first property is
   * added. Afterwards, it will be used to ensure that
   * all properties receive the same number of values
   */
  private count: number | undefined;

  /**
   * The `PropertyTableProperty` objects for all properties
   * for which values have been added.
   */
  private readonly propertyTableProperties: {
    [key: string]: PropertyTableProperty;
  } = {};

  /**
   * Collects the binary representations (i.e. the buffer views
   * data) of the properties that are added.
   */
  private readonly createdBufferViewsData: Buffer[] = [];

  /**
   * Private constructor, called from `create`.
   *
   * @param schema - The metadata schema
   * @param propertyTableClass - The class name of the resulting
   * property table, i.e. the name of one class in the schema
   * @param propertyTableName - A name for the property table
   * @returns The builder
   * @throws MetadataError If the given schema does not contain
   * the specified class.
   */
  private constructor(
    schema: Schema,
    propertyTableClass: string,
    propertyTableName: string
  ) {
    this.schema = schema;
    this.propertyTableClass = propertyTableClass;
    this.propertyTableName = propertyTableName;
    this.count = undefined;

    // Early error check for the case that the class
    // is not contained in the schema:
    const classes = schema.classes || {};
    const metadataClass = classes[propertyTableClass];
    if (!metadataClass) {
      throw new MetadataError(
        `The schema does not contain class ${propertyTableClass}`
      );
    }
  }

  /**
   * Adds a single property to the property table.
   *
   * @param propertyName - The name of the property
   * @param propertyValues - The property values
   * @returns This builder
   * @throws MetadataError If a property with the given
   * name does not exist in the class that this table
   * is built for, or when the length of the given array
   * is different than the length of an array that was
   * given for a previous property.
   */
  addProperty(propertyName: string, propertyValues: any[]): this {
    const classProperty = this.getClassProperty(propertyName);

    if (this.count === undefined) {
      this.count = propertyValues.length;
    } else {
      if (this.count !== propertyValues.length) {
        throw new MetadataError(
          `Expected ${this.count} property values, but got ${propertyValues.length}`
        );
      }
    }

    const propertyTableProperty =
      BinaryPropertyTables.createPropertyTableProperty(
        classProperty,
        this.schema,
        propertyValues,
        this.arrayOffsetType,
        this.stringOffsetType,
        this.createdBufferViewsData
      );
    this.propertyTableProperties[propertyName] = propertyTableProperty;

    return this;
  }

  /**
   * Adds a set of properties to the property table.
   *
   * Property names that do not appear in the class that the
   * table is built for will be ignored.
   *
   * @param properties - A dictionary that maps property names
   * to values
   * @returns This builder
   * @throws MetadataError If the length of any given array
   * is different than the length of any other array, or
   * an array that was given for a previous property.
   */
  addProperties(properties: { [key: string]: any[] }): this {
    const propertyNames = this.getClassPropertyNames();
    for (const propertyName of propertyNames) {
      const propertyValues = properties[propertyName];
      if (propertyValues) {
        this.addProperty(propertyName, propertyValues);
      }
    }
    return this;
  }

  /**
   * Build the property table from the data of all properties
   * that have been added.
   *
   * @returns The property table
   * @throws MetadataError If no property values have been given
   * for any of the properties of the class that the table is
   * built for
   */
  build(): BinaryPropertyTable {
    if (this.count === undefined) {
      throw new MetadataError(`No properties have been added"`);
    }
    const propertyNames = this.getClassPropertyNames();
    for (const propertyName of propertyNames) {
      const propertyTableProperty = this.propertyTableProperties[propertyName];
      if (!propertyTableProperty) {
        throw new MetadataError(
          `No values have been given for property ${propertyName}`
        );
      }
    }

    const propertyTable: PropertyTable = {
      name: this.propertyTableName,
      class: this.propertyTableClass,
      count: this.count,
      properties: this.propertyTableProperties,
    };

    const binaryBufferData: BinaryBufferData = {
      bufferViewsData: [],
      buffersData: [],
    };

    const binaryBufferStructure = BinaryBuffers.createBinaryBufferStructure(
      binaryBufferData,
      this.createdBufferViewsData
    );

    const binaryEnumInfo = MetadataUtilities.computeBinaryEnumInfo(this.schema);

    const metadataClass = this.getClass();
    const binaryMetadata: BinaryMetadata = {
      metadataClass: metadataClass,
      binaryEnumInfo: binaryEnumInfo,
      binaryBufferStructure: binaryBufferStructure,
      binaryBufferData: binaryBufferData,
    };
    const binaryPropertyTable: BinaryPropertyTable = {
      propertyTable: propertyTable,
      binaryMetadata: binaryMetadata,
    };
    return binaryPropertyTable;
  }

  /**
   * Returns the `MetadataClass` that the table is built for
   *
   * @returns The metadata class
   * @throws MetadataError If the schema does not contain the class
   */
  private getClass(): MetadataClass {
    const classes = this.schema.classes || {};
    const metadataClass = classes[this.propertyTableClass];
    if (!metadataClass) {
      throw new MetadataError(
        `The schema does not contain class ${this.propertyTableClass}`
      );
    }
    return metadataClass;
  }

  /**
   * Returns the property names of the `MetadataClass` that the
   * table is built for
   *
   * @returns The metadata class property names
   * @throws MetadataError If the schema does not contain the class
   */
  private getClassPropertyNames(): string[] {
    const metadataClass = this.getClass();
    const classProperties = metadataClass.properties || {};
    return Object.keys(classProperties);
  }

  /**
   * Returns the `ClassProperty` for the given propery name from
   * the `MetadataClass` that the table is built for
   *
   * @param propertyName - The property names
   * @returns The metadata class property names
   * @throws MetadataError If the schema does not contain the class,
   * or the class does not contain the specified property
   */
  private getClassProperty(propertyName: string): ClassProperty {
    const metadataClass = this.getClass();
    const classProperties = metadataClass.properties || {};
    const classProperty = classProperties[propertyName];
    if (!classProperty) {
      throw new MetadataError(
        `The class ${this.propertyTableClass} does not contain property ${propertyName}`
      );
    }
    return classProperty;
  }
}

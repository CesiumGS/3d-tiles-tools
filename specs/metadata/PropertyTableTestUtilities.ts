import { BinaryPropertyTable } from "../../src/metadata/binary/BinaryPropertyTable";
import { BinaryPropertyTables } from "../../src/metadata/binary/BinaryPropertyTables";

import { ClassProperty } from "../../src/structure/Metadata/ClassProperty";
import { MetadataEnum } from "../../src/structure/Metadata/MetadataEnum";

/**
 * Methods to create `BinaryPropertyTable` instances that are valid,
 * and contain the data for a single property.
 *
 * These methods are used in the `BinaryPropertyTableValidationSpec.ts`
 * to create valid `BinaryPropertyTable` instances, that are then made
 * invalid in various ways in order to check whether these errors are
 * detected asvalidation issues.
 *
 * @internal
 */
export class PropertyTableTestUtilities {
  /**
   * Creates an unspecified valid default `BinaryPropertyTable`, containing
   * a single property with the type indicated in the method name.
   *
   * @returns The `BinaryPropertyTable`
   */
  static createDefaultBinaryPropertyTable_example_INT16_SCALAR(): BinaryPropertyTable {
    const example_INT16_SCALAR: ClassProperty = {
      type: "SCALAR",
      componentType: "INT16",
    };
    const example_INT16_SCALAR_values = [-32768, 32767];

    const classProperty = example_INT16_SCALAR;
    const values = example_INT16_SCALAR_values;

    const arrayOffsetType = "UINT32";
    const stringOffsetType = "UINT32";
    const binaryPropertyTable =
      BinaryPropertyTables.createBinaryPropertyTableFromProperty(
        "testProperty",
        classProperty,
        values,
        arrayOffsetType,
        stringOffsetType,
        undefined
      );
    return binaryPropertyTable;
  }

  /**
   * Creates an unspecified valid default `BinaryPropertyTable`, containing
   * a single property with the type indicated in the method name.
   *
   * @returns The `BinaryPropertyTable`
   */
  static createDefaultBinaryPropertyTable_example_variable_length_INT16_SCALAR_array(): BinaryPropertyTable {
    const example_variable_length_INT16_SCALAR_array: ClassProperty = {
      type: "SCALAR",
      componentType: "INT16",
      array: true,
    };
    const example_variable_length_INT16_SCALAR_array_values = [
      [-32768, 32767],
      [-1, 0, 1],
    ];

    const classProperty = example_variable_length_INT16_SCALAR_array;
    const values = example_variable_length_INT16_SCALAR_array_values;

    const arrayOffsetType = "UINT32";
    const stringOffsetType = "UINT32";
    const binaryPropertyTable =
      BinaryPropertyTables.createBinaryPropertyTableFromProperty(
        "testProperty",
        classProperty,
        values,
        arrayOffsetType,
        stringOffsetType,
        undefined
      );
    return binaryPropertyTable;
  }

  /**
   * Creates an unspecified valid default `BinaryPropertyTable`, containing
   * a single property with the type indicated in the method name.
   *
   * @returns The `BinaryPropertyTable`
   */
  static createDefaultBinaryPropertyTable_example_fixed_length_INT16_SCALAR_array(): BinaryPropertyTable {
    const example_fixed_length_INT16_SCALAR_array: ClassProperty = {
      type: "SCALAR",
      componentType: "INT16",
      array: true,
      count: 2,
    };
    const example_fixed_length_INT16_SCALAR_array_values = [
      [-32768, 32767],
      [-1, 1],
    ];

    const classProperty = example_fixed_length_INT16_SCALAR_array;
    const values = example_fixed_length_INT16_SCALAR_array_values;

    const arrayOffsetType = "UINT32";
    const stringOffsetType = "UINT32";
    const binaryPropertyTable =
      BinaryPropertyTables.createBinaryPropertyTableFromProperty(
        "testProperty",
        classProperty,
        values,
        arrayOffsetType,
        stringOffsetType,
        undefined
      );
    return binaryPropertyTable;
  }

  /**
   * Creates an unspecified valid default `BinaryPropertyTable`, containing
   * a single property with the type indicated in the method name.
   *
   * @returns The `BinaryPropertyTable`
   */
  static createDefaultBinaryPropertyTable_example_BOOLEAN(): BinaryPropertyTable {
    const example_BOOLEAN: ClassProperty = {
      type: "BOOLEAN",
    };
    const example_BOOLEAN_values = [true, false];

    const classProperty = example_BOOLEAN;
    const values = example_BOOLEAN_values;

    const arrayOffsetType = "UINT32";
    const stringOffsetType = "UINT32";
    const binaryPropertyTable =
      BinaryPropertyTables.createBinaryPropertyTableFromProperty(
        "testProperty",
        classProperty,
        values,
        arrayOffsetType,
        stringOffsetType,
        undefined
      );
    return binaryPropertyTable;
  }

  /**
   * Creates an unspecified valid default `BinaryPropertyTable`, containing
   * a single property with the type indicated in the method name.
   *
   * @returns The `BinaryPropertyTable`
   */
  static createDefaultBinaryPropertyTable_example_variable_length_BOOLEAN_array(): BinaryPropertyTable {
    const example_variable_length_BOOLEAN_array: ClassProperty = {
      type: "BOOLEAN",
      array: true,
    };
    const example_variable_length_BOOLEAN_array_values = [
      [true, false],
      [false, true, false, true],
    ];

    const classProperty = example_variable_length_BOOLEAN_array;
    const values = example_variable_length_BOOLEAN_array_values;

    const arrayOffsetType = "UINT32";
    const stringOffsetType = "UINT32";
    const binaryPropertyTable =
      BinaryPropertyTables.createBinaryPropertyTableFromProperty(
        "testProperty",
        classProperty,
        values,
        arrayOffsetType,
        stringOffsetType,
        undefined
      );
    return binaryPropertyTable;
  }

  /**
   * Creates an unspecified valid default `BinaryPropertyTable`, containing
   * a single property with the type indicated in the method name.
   *
   * @returns The `BinaryPropertyTable`
   */
  static createDefaultBinaryPropertyTable_example_fixed_length_BOOLEAN_array(): BinaryPropertyTable {
    const example_fixed_length_BOOLEAN_array: ClassProperty = {
      type: "BOOLEAN",
      array: true,
    };
    const example_fixed_length_BOOLEAN_array_values = [
      [true, false, true],
      [false, true, false],
    ];

    const classProperty = example_fixed_length_BOOLEAN_array;
    const values = example_fixed_length_BOOLEAN_array_values;

    const arrayOffsetType = "UINT32";
    const stringOffsetType = "UINT32";
    const binaryPropertyTable =
      BinaryPropertyTables.createBinaryPropertyTableFromProperty(
        "testProperty",
        classProperty,
        values,
        arrayOffsetType,
        stringOffsetType,
        undefined
      );
    return binaryPropertyTable;
  }

  /**
   * Creates an unspecified valid default `BinaryPropertyTable`, containing
   * a single property with the type indicated in the method name.
   *
   * @returns The `BinaryPropertyTable`
   */
  static createDefaultBinaryPropertyTable_example_STRING(): BinaryPropertyTable {
    const example_STRING: ClassProperty = {
      type: "STRING",
    };
    const example_STRING_values = ["Test string", "Another string"];

    const classProperty = example_STRING;
    const values = example_STRING_values;

    const arrayOffsetType = "UINT32";
    const stringOffsetType = "UINT32";
    const binaryPropertyTable =
      BinaryPropertyTables.createBinaryPropertyTableFromProperty(
        "testProperty",
        classProperty,
        values,
        arrayOffsetType,
        stringOffsetType,
        undefined
      );
    return binaryPropertyTable;
  }

  /**
   * Creates an unspecified valid default `BinaryPropertyTable`, containing
   * a single property with the type indicated in the method name.
   *
   * @returns The `BinaryPropertyTable`
   */
  static createDefaultBinaryPropertyTable_example_variable_length_STRING_array(): BinaryPropertyTable {
    const example_variable_length_STRING_array: ClassProperty = {
      type: "STRING",
      array: true,
    };
    const example_variable_length_STRING_array_values = [
      ["A0", "A1", "A2"],
      ["B0", "B1"],
    ];

    const classProperty = example_variable_length_STRING_array;
    const values = example_variable_length_STRING_array_values;

    const arrayOffsetType = "UINT32";
    const stringOffsetType = "UINT32";
    const binaryPropertyTable =
      BinaryPropertyTables.createBinaryPropertyTableFromProperty(
        "testProperty",
        classProperty,
        values,
        arrayOffsetType,
        stringOffsetType,
        undefined
      );
    return binaryPropertyTable;
  }

  /**
   * Creates an unspecified valid default `BinaryPropertyTable`, containing
   * a single property with the type indicated in the method name.
   *
   * @returns The `BinaryPropertyTable`
   */
  static createDefaultBinaryPropertyTable_example_fixed_length_STRING_array(): BinaryPropertyTable {
    const example_fixed_length_STRING_array: ClassProperty = {
      type: "STRING",
      array: true,
      count: 3,
    };
    const example_fixed_length_STRING_array_values = [
      ["A0", "A1", "A2"],
      ["B0", "B1", "B2"],
    ];

    const classProperty = example_fixed_length_STRING_array;
    const values = example_fixed_length_STRING_array_values;

    const arrayOffsetType = "UINT32";
    const stringOffsetType = "UINT32";
    const binaryPropertyTable =
      BinaryPropertyTables.createBinaryPropertyTableFromProperty(
        "testProperty",
        classProperty,
        values,
        arrayOffsetType,
        stringOffsetType,
        undefined
      );
    return binaryPropertyTable;
  }

  /**
   * Creates an unspecified valid default `BinaryPropertyTable`, containing
   * a single property with the type indicated in the method name.
   *
   * @returns The `BinaryPropertyTable`
   */
  static createDefaultBinaryPropertyTable_example_FLOAT32_VEC2(): BinaryPropertyTable {
    const example_FLOAT32_VEC2: ClassProperty = {
      type: "VEC2",
      componentType: "FLOAT32",
    };
    const example_FLOAT32_VEC2_values = [
      [0.0, 1.0],
      [2.0, 3.0],
    ];

    const classProperty = example_FLOAT32_VEC2;
    const values = example_FLOAT32_VEC2_values;

    const arrayOffsetType = "UINT32";
    const stringOffsetType = "UINT32";
    const binaryPropertyTable =
      BinaryPropertyTables.createBinaryPropertyTableFromProperty(
        "testProperty",
        classProperty,
        values,
        arrayOffsetType,
        stringOffsetType,
        undefined
      );
    return binaryPropertyTable;
  }

  /**
   * Creates an unspecified valid default `BinaryPropertyTable`, containing
   * a single property with the type indicated in the method name.
   *
   * @returns The `BinaryPropertyTable`
   */
  static createDefaultBinaryPropertyTable_example_variable_length_UINT32_VEC2_array(): BinaryPropertyTable {
    const example_variable_length_UINT32_VEC2_array: ClassProperty = {
      type: "VEC2",
      componentType: "FLOAT32",
      array: true,
    };
    const example_variable_length_UINT32_VEC2_array_values = [
      [
        [0.0, 1.0],
        [2.0, 3.0],
      ],
      [
        [4.0, 5.0],
        [6.0, 7.0],
        [8.0, 9.0],
      ],
    ];

    const classProperty = example_variable_length_UINT32_VEC2_array;
    const values = example_variable_length_UINT32_VEC2_array_values;

    const arrayOffsetType = "UINT32";
    const stringOffsetType = "UINT32";
    const binaryPropertyTable =
      BinaryPropertyTables.createBinaryPropertyTableFromProperty(
        "testProperty",
        classProperty,
        values,
        arrayOffsetType,
        stringOffsetType,
        undefined
      );
    return binaryPropertyTable;
  }

  /**
   * Creates an unspecified valid default `BinaryPropertyTable`, containing
   * a single property with the type indicated in the method name.
   *
   * @returns The `BinaryPropertyTable`
   */
  static createDefaultBinaryPropertyTable_example_fixed_length_UINT32_VEC2_array(): BinaryPropertyTable {
    const example_fixed_length_UINT32_VEC2_array: ClassProperty = {
      type: "VEC2",
      componentType: "FLOAT32",
      array: true,
      count: 2,
    };
    const example_fixed_length_UINT32_VEC2_array_values = [
      [
        [0.0, 1.0],
        [2.0, 3.0],
      ],
      [
        [4.0, 5.0],
        [6.0, 7.0],
      ],
    ];

    const classProperty = example_fixed_length_UINT32_VEC2_array;
    const values = example_fixed_length_UINT32_VEC2_array_values;

    const arrayOffsetType = "UINT32";
    const stringOffsetType = "UINT32";
    const binaryPropertyTable =
      BinaryPropertyTables.createBinaryPropertyTableFromProperty(
        "testProperty",
        classProperty,
        values,
        arrayOffsetType,
        stringOffsetType,
        undefined
      );
    return binaryPropertyTable;
  }

  /**
   * Creates an unspecified valid default `BinaryPropertyTable`, containing
   * a single property with the type indicated in the method name.
   *
   * @returns The `BinaryPropertyTable`
   */
  static createDefaultBinaryPropertyTable_example_variable_length_ENUM_array(): BinaryPropertyTable {
    const example_variable_length_ENUM_array: ClassProperty = {
      type: "ENUM",
      enumType: "testMetadataEnum",
      array: true,
    };
    const example_example_variable_length_ENUM_array_values = [
      ["ExampleEnumValueA", "ExampleEnumValueB", "ExampleEnumValueC"],
      ["ExampleEnumValueB", "ExampleEnumValueA"],
    ];
    const testMetadataEnum: MetadataEnum = {
      values: [
        {
          name: "ExampleEnumValueA",
          value: 0,
        },
        {
          name: "ExampleEnumValueB",
          value: 1,
        },
        {
          name: "ExampleEnumValueC",
          value: 2,
        },
      ],
    };

    const classProperty = example_variable_length_ENUM_array;
    const values = example_example_variable_length_ENUM_array_values;

    const arrayOffsetType = "UINT32";
    const stringOffsetType = "UINT32";
    const binaryPropertyTable =
      BinaryPropertyTables.createBinaryPropertyTableFromProperty(
        "testProperty",
        classProperty,
        values,
        arrayOffsetType,
        stringOffsetType,
        testMetadataEnum
      );
    return binaryPropertyTable;
  }

  /**
   * Creates an unspecified valid default `BinaryPropertyTable`, containing
   * a single property with the type indicated in the method name.
   *
   * @returns The `BinaryPropertyTable`
   */
  static createDefaultBinaryPropertyTable_example_ENUM_with_noData(): BinaryPropertyTable {
    const example_ENUM: ClassProperty = {
      type: "ENUM",
      enumType: "testMetadataEnum",
      noData: 9999,
      default: 1,
    };
    const example_ENUM_values = [
      "ExampleEnumValueA",
      "ExampleEnumValueB",
      "ExampleEnumValueC",
    ];
    const testMetadataEnum: MetadataEnum = {
      values: [
        {
          name: "ExampleEnumValueA",
          value: 0,
        },
        {
          name: "ExampleEnumValueB",
          value: 1,
        },
        {
          name: "ExampleEnumValueC",
          value: 2,
        },
      ],
    };

    const classProperty = example_ENUM;
    const values = example_ENUM_values;

    const arrayOffsetType = "UINT32";
    const stringOffsetType = "UINT32";
    const binaryPropertyTable =
      BinaryPropertyTables.createBinaryPropertyTableFromProperty(
        "testProperty",
        classProperty,
        values,
        arrayOffsetType,
        stringOffsetType,
        testMetadataEnum
      );
    return binaryPropertyTable;
  }

  /**
   * Creates an unspecified valid default `BinaryPropertyTable`, containing
   * a single property with the type indicated in the method name.
   *
   * @returns The `BinaryPropertyTable`
   */
  static createDefaultBinaryPropertyTable_example_fixed_length_normalized_INT64_VEC2_array(): BinaryPropertyTable {
    const example_fixed_length_normalized_INT64_VEC2_array: ClassProperty = {
      type: "VEC2",
      componentType: "INT64",
      array: true,
      normalized: true,
    };
    // The normalized values here are
    // [
    //  [ 0,  0]
    //  [-1,  0]
    //  [ 0, -1]
    // ],
    // [
    //  [ 0,  0]
    //  [ 1,  0]
    //  [ 0,  1]
    // ]
    const example_fixed_length_normalized_INT64_VEC2_array_values = [
      [
        [0, 0],
        [-9223372036854775808n, 0],
        [0, -9223372036854775808n],
      ],
      [
        [0, 0],
        [9223372036854775807n, 0],
        [0, 9223372036854775807n],
      ],
    ];

    const classProperty = example_fixed_length_normalized_INT64_VEC2_array;
    const values = example_fixed_length_normalized_INT64_VEC2_array_values;

    const arrayOffsetType = "UINT32";
    const stringOffsetType = "UINT32";
    const binaryPropertyTable =
      BinaryPropertyTables.createBinaryPropertyTableFromProperty(
        "testProperty",
        classProperty,
        values,
        arrayOffsetType,
        stringOffsetType,
        undefined
      );
    return binaryPropertyTable;
  }
}

import { ClassProperty } from "../../../src/structure";

import { BinaryPropertyTables } from "../../../src/metadata";
import { BinaryPropertyTableModel } from "../../../src/metadata";

import { SpecHelpers } from "../../SpecHelpers";

/**
 * Test for the `PropertyTableModels` class.
 *
 * These tests just verify the "roundtrip":
 * - They create a `PropertyTableModel` from a single property
 *   and its associated data
 * - They obtain the `MetadataEntityModel` instances from the
 *   property table model
 * - They check whether the elements of the input data and the
 *   values from the entity model are generically equal.
 */
describe("metadata/PropertyTableModelsSpec", function () {
  const epsilon = 0.000001;

  it("correctly represents example_INT16_SCALAR", function () {
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
    const propertyTableModel = new BinaryPropertyTableModel(
      binaryPropertyTable
    );
    const count = values.length;
    for (let i = 0; i < count; i++) {
      const entity = propertyTableModel.getMetadataEntityModel(i);
      const expected = values[i];
      const actual = entity.getPropertyValue("testProperty");
      expect(SpecHelpers.genericEquals(actual, expected, epsilon)).toBeTrue();
    }
  });

  it("correctly represents example_variable_length_INT16_SCALAR_array", function () {
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
    const propertyTableModel = new BinaryPropertyTableModel(
      binaryPropertyTable
    );
    const count = values.length;
    for (let i = 0; i < count; i++) {
      const entity = propertyTableModel.getMetadataEntityModel(i);
      const expected = values[i];
      const actual = entity.getPropertyValue("testProperty");
      expect(SpecHelpers.genericEquals(actual, expected, epsilon)).toBeTrue();
    }
  });

  it("correctly represents example_fixed_length_INT16_SCALAR_array", function () {
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
    const propertyTableModel = new BinaryPropertyTableModel(
      binaryPropertyTable
    );
    const count = values.length;
    for (let i = 0; i < count; i++) {
      const entity = propertyTableModel.getMetadataEntityModel(i);
      const expected = values[i];
      const actual = entity.getPropertyValue("testProperty");
      expect(SpecHelpers.genericEquals(actual, expected, epsilon)).toBeTrue();
    }
  });

  it("correctly represents example_BOOLEAN", function () {
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
    const propertyTableModel = new BinaryPropertyTableModel(
      binaryPropertyTable
    );
    const count = values.length;
    for (let i = 0; i < count; i++) {
      const entity = propertyTableModel.getMetadataEntityModel(i);
      const expected = values[i];
      const actual = entity.getPropertyValue("testProperty");
      expect(SpecHelpers.genericEquals(actual, expected, epsilon)).toBeTrue();
    }
  });

  it("correctly represents example_variable_length_BOOLEAN_array", function () {
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
    const propertyTableModel = new BinaryPropertyTableModel(
      binaryPropertyTable
    );
    const count = values.length;
    for (let i = 0; i < count; i++) {
      const entity = propertyTableModel.getMetadataEntityModel(i);
      const expected = values[i];
      const actual = entity.getPropertyValue("testProperty");
      expect(SpecHelpers.genericEquals(actual, expected, epsilon)).toBeTrue();
    }
  });

  it("correctly represents example_fixed_length_BOOLEAN_array", function () {
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
    const propertyTableModel = new BinaryPropertyTableModel(
      binaryPropertyTable
    );
    const count = values.length;
    for (let i = 0; i < count; i++) {
      const entity = propertyTableModel.getMetadataEntityModel(i);
      const expected = values[i];
      const actual = entity.getPropertyValue("testProperty");
      expect(SpecHelpers.genericEquals(actual, expected, epsilon)).toBeTrue();
    }
  });

  it("correctly represents example_STRING", function () {
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
    const propertyTableModel = new BinaryPropertyTableModel(
      binaryPropertyTable
    );
    const count = values.length;
    for (let i = 0; i < count; i++) {
      const entity = propertyTableModel.getMetadataEntityModel(i);
      const expected = values[i];
      const actual = entity.getPropertyValue("testProperty");
      expect(SpecHelpers.genericEquals(actual, expected, epsilon)).toBeTrue();
    }
  });

  it("correctly represents example_variable_length_STRING_array", function () {
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
    const propertyTableModel = new BinaryPropertyTableModel(
      binaryPropertyTable
    );
    const count = values.length;
    for (let i = 0; i < count; i++) {
      const entity = propertyTableModel.getMetadataEntityModel(i);
      const expected = values[i];
      const actual = entity.getPropertyValue("testProperty");
      expect(SpecHelpers.genericEquals(actual, expected, epsilon)).toBeTrue();
    }
  });

  it("correctly represents example_fixed_length_STRING_array", function () {
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
    const propertyTableModel = new BinaryPropertyTableModel(
      binaryPropertyTable
    );
    const count = values.length;
    for (let i = 0; i < count; i++) {
      const entity = propertyTableModel.getMetadataEntityModel(i);
      const expected = values[i];
      const actual = entity.getPropertyValue("testProperty");
      expect(SpecHelpers.genericEquals(actual, expected, epsilon)).toBeTrue();
    }
  });

  it("correctly represents example_FLOAT32_VEC2", function () {
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
    const propertyTableModel = new BinaryPropertyTableModel(
      binaryPropertyTable
    );
    const count = values.length;
    for (let i = 0; i < count; i++) {
      const entity = propertyTableModel.getMetadataEntityModel(i);
      const expected = values[i];
      const actual = entity.getPropertyValue("testProperty");
      expect(SpecHelpers.genericEquals(actual, expected, epsilon)).toBeTrue();
    }
  });

  it("correctly represents example_variable_length_UINT32_VEC2_array", function () {
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
    const propertyTableModel = new BinaryPropertyTableModel(
      binaryPropertyTable
    );
    const count = values.length;
    for (let i = 0; i < count; i++) {
      const entity = propertyTableModel.getMetadataEntityModel(i);
      const expected = values[i];
      const actual = entity.getPropertyValue("testProperty");
      expect(SpecHelpers.genericEquals(actual, expected, epsilon)).toBeTrue();
    }
  });

  it("correctly represents example_fixed_length_UINT32_VEC2_array", function () {
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
    const propertyTableModel = new BinaryPropertyTableModel(
      binaryPropertyTable
    );
    const count = values.length;
    for (let i = 0; i < count; i++) {
      const entity = propertyTableModel.getMetadataEntityModel(i);
      const expected = values[i];
      const actual = entity.getPropertyValue("testProperty");
      expect(SpecHelpers.genericEquals(actual, expected, epsilon)).toBeTrue();
    }
  });

  it("correctly represents example_UINT64_MAT2", function () {
    const example_UINT64_MAT2: ClassProperty = {
      type: "MAT2",
      componentType: "UINT64",
    };
    const example_UINT64_MAT2_values = [
      [0n, 6148914690621625735n, 12297829383087925879n, 18446744073709551615n],
      [18446744073709551615n, 12297829383087925879n, 6148914690621625735n, 0n],
    ];

    const classProperty = example_UINT64_MAT2;
    const values = example_UINT64_MAT2_values;

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
    const propertyTableModel = new BinaryPropertyTableModel(
      binaryPropertyTable
    );
    const count = values.length;
    for (let i = 0; i < count; i++) {
      const entity = propertyTableModel.getMetadataEntityModel(i);
      const expected = values[i];
      const actual = entity.getPropertyValue("testProperty");
      expect(SpecHelpers.genericEquals(actual, expected, epsilon)).toBeTrue();
    }
  });

  it("correctly represents example_normalized_UINT64_VEC2 with offset", function () {
    const example_normalized_UINT64_VEC2: ClassProperty = {
      type: "VEC2",
      componentType: "UINT64",
      normalized: true,
      offset: [10, 20],
    };
    const example_normalized_UINT64_VEC2_values = [
      [0n, 6148914690621625735n],
      [6148914690621625735n, 12297829383087925879n],
    ];
    const example_normalized_UINT64_VEC2_values_expected = [
      [10.0, 20.3333333333],
      [10.3333333333, 20.6666666666],
    ];

    const classProperty = example_normalized_UINT64_VEC2;
    const values = example_normalized_UINT64_VEC2_values;
    const valuesExpected = example_normalized_UINT64_VEC2_values_expected;

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
    const propertyTableModel = new BinaryPropertyTableModel(
      binaryPropertyTable
    );
    const count = values.length;
    for (let i = 0; i < count; i++) {
      const entity = propertyTableModel.getMetadataEntityModel(i);
      const expected = valuesExpected[i];
      const actual = entity.getPropertyValue("testProperty");
      expect(SpecHelpers.genericEquals(actual, expected, epsilon)).toBeTrue();
    }
  });
});

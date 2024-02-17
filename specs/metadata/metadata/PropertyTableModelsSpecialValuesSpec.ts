import { ClassProperty } from "../../../src/structure";
import { MetadataEnum } from "../../../src/structure";

import { BinaryPropertyTables } from "../../../src/metadata";
import { BinaryPropertyTableModel } from "../../../src/metadata";

import { SpecHelpers } from "../../SpecHelpers";

/**
 * Test for handling "special" values (namely, `noData` and `default`)
 * in the `PropertyTableModels` class.
 */
describe("metadata/PropertyTableModelSpecialValuesSpec", function () {
  const epsilon = 0.000001;

  it("correctly represents example_ENUM", function () {
    const example_ENUM: ClassProperty = {
      type: "ENUM",
      enumType: "testMetadataEnum",
    };
    const example_ENUM_values = ["TEST_ENUM_VALUE_A", "TEST_ENUM_VALUE_B"];

    const testMetadataEnum: MetadataEnum = {
      name: "testMetadataEnum",
      valueType: "UINT8",
      values: [
        {
          name: "TEST_NO_DATA_ENUM_VALUE",
          value: 255,
        },
        {
          name: "TEST_ENUM_VALUE_A",
          value: 1,
        },
        {
          name: "TEST_ENUM_VALUE_B",
          value: 2,
        },
        {
          name: "TEST_ENUM_VALUE_C",
          value: 3,
        },
        {
          name: "TEST_DEFAULT_ENUM_VALUE",
          value: 4,
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

  it("correctly represents example_ENUM with noData and default values", function () {
    const example_ENUM: ClassProperty = {
      type: "ENUM",
      enumType: "testMetadataEnum",
      noData: "TEST_NO_DATA_ENUM_VALUE",
      default: "TEST_DEFAULT_ENUM_VALUE",
    };

    // The "noData" value is expected to be translated
    // into the "default" value
    const example_ENUM_values = [
      "TEST_NO_DATA_ENUM_VALUE",
      "TEST_ENUM_VALUE_B",
    ];
    const expected_example_ENUM_values = [
      "TEST_DEFAULT_ENUM_VALUE",
      "TEST_ENUM_VALUE_B",
    ];

    const testMetadataEnum: MetadataEnum = {
      name: "testMetadataEnum",
      valueType: "UINT8",
      values: [
        {
          name: "TEST_NO_DATA_ENUM_VALUE",
          value: 255,
        },
        {
          name: "TEST_ENUM_VALUE_A",
          value: 1,
        },
        {
          name: "TEST_ENUM_VALUE_B",
          value: 2,
        },
        {
          name: "TEST_ENUM_VALUE_C",
          value: 3,
        },
        {
          name: "TEST_DEFAULT_ENUM_VALUE",
          value: 4,
        },
      ],
    };

    const classProperty = example_ENUM;
    const values = example_ENUM_values;
    const expectedValues = expected_example_ENUM_values;

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
    const propertyTableModel = new BinaryPropertyTableModel(
      binaryPropertyTable
    );
    const count = values.length;
    for (let i = 0; i < count; i++) {
      const entity = propertyTableModel.getMetadataEntityModel(i);
      const expected = expectedValues[i];
      const actual = entity.getPropertyValue("testProperty");
      expect(SpecHelpers.genericEquals(actual, expected, epsilon)).toBeTrue();
    }
  });

  it("correctly represents example_fixed_length_ENUM_array", function () {
    const example_fixed_length_ENUM_array: ClassProperty = {
      type: "ENUM",
      enumType: "testMetadataEnum",
      array: true,
      count: 2,
    };
    const example_fixed_length_ENUM_array_values = [
      ["TEST_ENUM_VALUE_A", "TEST_ENUM_VALUE_B"],
      ["TEST_ENUM_VALUE_B", "TEST_ENUM_VALUE_C"],
    ];

    const testMetadataEnum: MetadataEnum = {
      name: "testMetadataEnum",
      valueType: "UINT8",
      values: [
        {
          name: "TEST_NO_DATA_ENUM_VALUE",
          value: 255,
        },
        {
          name: "TEST_ENUM_VALUE_A",
          value: 1,
        },
        {
          name: "TEST_ENUM_VALUE_B",
          value: 2,
        },
        {
          name: "TEST_ENUM_VALUE_C",
          value: 3,
        },
        {
          name: "TEST_DEFAULT_ENUM_VALUE",
          value: 4,
        },
      ],
    };

    const classProperty = example_fixed_length_ENUM_array;
    const values = example_fixed_length_ENUM_array_values;

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

  it("correctly represents example_fixed_length_ENUM_array with noData and default values", function () {
    const example_fixed_length_ENUM_array: ClassProperty = {
      type: "ENUM",
      enumType: "testMetadataEnum",
      array: true,
      count: 2,
      noData: ["TEST_NO_DATA_ENUM_VALUE", "TEST_NO_DATA_ENUM_VALUE"],
      default: ["TEST_DEFAULT_ENUM_VALUE", "TEST_DEFAULT_ENUM_VALUE"],
    };

    // The "noData" value is expected to be translated
    // into the "default" value
    const example_fixed_length_ENUM_array_values = [
      ["TEST_NO_DATA_ENUM_VALUE", "TEST_NO_DATA_ENUM_VALUE"],
      ["TEST_ENUM_VALUE_A", "TEST_ENUM_VALUE_B"],
    ];
    const expected_example_fixed_length_ENUM_array_values = [
      ["TEST_DEFAULT_ENUM_VALUE", "TEST_DEFAULT_ENUM_VALUE"],
      ["TEST_ENUM_VALUE_A", "TEST_ENUM_VALUE_B"],
    ];

    const testMetadataEnum: MetadataEnum = {
      name: "testMetadataEnum",
      valueType: "UINT8",
      values: [
        {
          name: "TEST_NO_DATA_ENUM_VALUE",
          value: 255,
        },
        {
          name: "TEST_ENUM_VALUE_A",
          value: 1,
        },
        {
          name: "TEST_ENUM_VALUE_B",
          value: 2,
        },
        {
          name: "TEST_ENUM_VALUE_C",
          value: 3,
        },
        {
          name: "TEST_DEFAULT_ENUM_VALUE",
          value: 4,
        },
      ],
    };

    const classProperty = example_fixed_length_ENUM_array;
    const values = example_fixed_length_ENUM_array_values;
    const expectedValues = expected_example_fixed_length_ENUM_array_values;

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
    const propertyTableModel = new BinaryPropertyTableModel(
      binaryPropertyTable
    );
    const count = values.length;
    for (let i = 0; i < count; i++) {
      const entity = propertyTableModel.getMetadataEntityModel(i);
      const expected = expectedValues[i];
      const actual = entity.getPropertyValue("testProperty");
      expect(SpecHelpers.genericEquals(actual, expected, epsilon)).toBeTrue();
    }
  });
});

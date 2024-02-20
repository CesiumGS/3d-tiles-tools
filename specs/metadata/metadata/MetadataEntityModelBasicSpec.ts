import { MetadataEntityModels } from "../../../src/metadata";

import { SpecHelpers } from "../../SpecHelpers";

const SPECS_DATA_BASE_DIRECTORY = SpecHelpers.getSpecsDataBaseDirectory();

describe("metadata/MetadataEntityModelBasic", function () {
  const epsilon = 0.000001;

  const tileset = SpecHelpers.readJsonUnchecked(
    SPECS_DATA_BASE_DIRECTORY + "/TilesetWithFullMetadata/tileset.json"
  );
  const metadataEntityModel = MetadataEntityModels.create(
    tileset.schema,
    tileset.metadata
  );

  it("obtains the right value for example_STRING", function () {
    const propertyName = "example_STRING";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = "An example string";
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_STRING_array", function () {
    const propertyName = "example_variable_length_STRING_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = ["This", "is", "an", "example"];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_STRING_array", function () {
    const propertyName = "example_fixed_length_STRING_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = ["This", "is", "an", "example", "string"];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_BOOLEAN", function () {
    const propertyName = "example_BOOLEAN";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = true;
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_BOOLEAN_array", function () {
    const propertyName = "example_variable_length_BOOLEAN_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [true, false, true, false];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_BOOLEAN_array", function () {
    const propertyName = "example_fixed_length_BOOLEAN_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [true, false, true, false, true];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_ENUM", function () {
    const propertyName = "example_ENUM";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = "ExampleEnumValueB";
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_ENUM_array", function () {
    const propertyName = "example_variable_length_ENUM_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      "ExampleEnumValueA",
      "ExampleEnumValueB",
      "ExampleEnumValueC",
      "ExampleEnumValueA",
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_ENUM_array", function () {
    const propertyName = "example_fixed_length_ENUM_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      "ExampleEnumValueA",
      "ExampleEnumValueB",
      "ExampleEnumValueC",
      "ExampleEnumValueA",
      "ExampleEnumValueB",
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_INT8_SCALAR", function () {
    const propertyName = "example_INT8_SCALAR";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = -128;
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_INT8_SCALAR_array", function () {
    const propertyName = "example_variable_length_INT8_SCALAR_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [-128, -43, 42, 127];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_INT8_SCALAR_array", function () {
    const propertyName = "example_fixed_length_INT8_SCALAR_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [-128, -64, 0, 63, 127];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_normalized_INT8_SCALAR", function () {
    const propertyName = "example_normalized_INT8_SCALAR";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = -1;
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_normalized_INT8_SCALAR_array", function () {
    const propertyName = "example_variable_length_normalized_INT8_SCALAR_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [-1, -0.33858267716535434, 0.33070866141732286, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_normalized_INT8_SCALAR_array", function () {
    const propertyName = "example_fixed_length_normalized_INT8_SCALAR_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [-1, -0.5039370078740157, 0, 0.49606299212598426, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_UINT8_SCALAR", function () {
    const propertyName = "example_UINT8_SCALAR";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = 255;
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_UINT8_SCALAR_array", function () {
    const propertyName = "example_variable_length_UINT8_SCALAR_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [0, 84, 170, 255];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_UINT8_SCALAR_array", function () {
    const propertyName = "example_fixed_length_UINT8_SCALAR_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [0, 63, 127, 191, 255];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_normalized_UINT8_SCALAR", function () {
    const propertyName = "example_normalized_UINT8_SCALAR";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = 1;
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_normalized_UINT8_SCALAR_array", function () {
    const propertyName =
      "example_variable_length_normalized_UINT8_SCALAR_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [0, 0.32941176470588235, 0.6666666666666666, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_normalized_UINT8_SCALAR_array", function () {
    const propertyName = "example_fixed_length_normalized_UINT8_SCALAR_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      0, 0.24705882352941178, 0.4980392156862745, 0.7490196078431373, 1,
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_INT16_SCALAR", function () {
    const propertyName = "example_INT16_SCALAR";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = -32768;
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_INT16_SCALAR_array", function () {
    const propertyName = "example_variable_length_INT16_SCALAR_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [-32768, -10923, 10922, 32767];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_INT16_SCALAR_array", function () {
    const propertyName = "example_fixed_length_INT16_SCALAR_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [-32768, -16384, 0, 16383, 32767];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_normalized_INT16_SCALAR", function () {
    const propertyName = "example_normalized_INT16_SCALAR";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = -1;
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_normalized_INT16_SCALAR_array", function () {
    const propertyName =
      "example_variable_length_normalized_INT16_SCALAR_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [-1, -0.33335367900631735, 0.33332316049684135, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_normalized_INT16_SCALAR_array", function () {
    const propertyName = "example_fixed_length_normalized_INT16_SCALAR_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [-1, -0.500015259254738, 0, 0.499984740745262, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_UINT16_SCALAR", function () {
    const propertyName = "example_UINT16_SCALAR";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = 65535;
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_UINT16_SCALAR_array", function () {
    const propertyName = "example_variable_length_UINT16_SCALAR_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [0, 21844, 43690, 65535];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_UINT16_SCALAR_array", function () {
    const propertyName = "example_fixed_length_UINT16_SCALAR_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [0, 16383, 32767, 49151, 65535];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_normalized_UINT16_SCALAR", function () {
    const propertyName = "example_normalized_UINT16_SCALAR";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = 1;
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_normalized_UINT16_SCALAR_array", function () {
    const propertyName =
      "example_variable_length_normalized_UINT16_SCALAR_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [0, 0.3333180743114366, 0.6666666666666666, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_normalized_UINT16_SCALAR_array", function () {
    const propertyName = "example_fixed_length_normalized_UINT16_SCALAR_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      0, 0.24998855573357748, 0.49999237048905165, 0.7499961852445258, 1,
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_INT32_SCALAR", function () {
    const propertyName = "example_INT32_SCALAR";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = -2147483648;
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_INT32_SCALAR_array", function () {
    const propertyName = "example_variable_length_INT32_SCALAR_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [-2147483648, -715827883, 715827882, 2147483647];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_INT32_SCALAR_array", function () {
    const propertyName = "example_fixed_length_INT32_SCALAR_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [-2147483648, -1073741824, 0, 1073741823, 2147483647];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_normalized_INT32_SCALAR", function () {
    const propertyName = "example_normalized_INT32_SCALAR";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = -1;
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_normalized_INT32_SCALAR_array", function () {
    const propertyName =
      "example_variable_length_normalized_INT32_SCALAR_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [-1, -0.3333333336437742, 0.3333333331781129, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_normalized_INT32_SCALAR_array", function () {
    const propertyName = "example_fixed_length_normalized_INT32_SCALAR_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [-1, -0.5000000002328306, 0, 0.49999999976716936, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_UINT32_SCALAR", function () {
    const propertyName = "example_UINT32_SCALAR";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = 4294967295;
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_UINT32_SCALAR_array", function () {
    const propertyName = "example_variable_length_UINT32_SCALAR_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [0, 1431655764, 2863311530, 4294967295];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_UINT32_SCALAR_array", function () {
    const propertyName = "example_fixed_length_UINT32_SCALAR_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [0, 1073741823, 2147483647, 3221225471, 4294967295];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_normalized_UINT32_SCALAR", function () {
    const propertyName = "example_normalized_UINT32_SCALAR";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = 1;
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_normalized_UINT32_SCALAR_array", function () {
    const propertyName =
      "example_variable_length_normalized_UINT32_SCALAR_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [0, 0.33333333310050267, 0.6666666666666666, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_normalized_UINT32_SCALAR_array", function () {
    const propertyName = "example_fixed_length_normalized_UINT32_SCALAR_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      0, 0.24999999982537702, 0.4999999998835847, 0.7499999999417923, 1,
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_INT64_SCALAR", function () {
    const propertyName = "example_INT64_SCALAR";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = -9223372036854776000n;
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_INT64_SCALAR_array", function () {
    const propertyName = "example_variable_length_INT64_SCALAR_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      -9223372036854776000n,
      -3074457346233150000n,
      3074457346233150000n,
      9223372036854776000n,
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_INT64_SCALAR_array", function () {
    const propertyName = "example_fixed_length_INT64_SCALAR_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      -9223372036854776000n,
      -4611686018427388000n,
      0,
      4611686018427388000n,
      9223372036854776000n,
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_normalized_INT64_SCALAR", function () {
    const propertyName = "example_normalized_INT64_SCALAR";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = -1;
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_normalized_INT64_SCALAR_array", function () {
    const propertyName =
      "example_variable_length_normalized_INT64_SCALAR_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [-1, -0.3333333334, 0.3333333334, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_normalized_INT64_SCALAR_array", function () {
    const propertyName = "example_fixed_length_normalized_INT64_SCALAR_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [-1, -0.5, 0, 0.5, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_UINT64_SCALAR", function () {
    const propertyName = "example_UINT64_SCALAR";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = 18446744073709552000n;
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_UINT64_SCALAR_array", function () {
    const propertyName = "example_variable_length_UINT64_SCALAR_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      0,
      6148914690621625000n,
      12297829383087925000n,
      18446744073709552000n,
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_UINT64_SCALAR_array", function () {
    const propertyName = "example_fixed_length_UINT64_SCALAR_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      0,
      4611686018427388000n,
      9223372036854776000n,
      13835058055282164000n,
      18446744073709552000n,
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_normalized_UINT64_SCALAR", function () {
    const propertyName = "example_normalized_UINT64_SCALAR";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = 1;
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_normalized_UINT64_SCALAR_array", function () {
    const propertyName =
      "example_variable_length_normalized_UINT64_SCALAR_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [0, 0.3333333333, 0.6666666667, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_normalized_UINT64_SCALAR_array", function () {
    const propertyName = "example_fixed_length_normalized_UINT64_SCALAR_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [0, 0.25, 0.5, 0.75, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_FLOAT32_SCALAR", function () {
    const propertyName = "example_FLOAT32_SCALAR";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = 1.2;
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_FLOAT32_SCALAR_array", function () {
    const propertyName = "example_variable_length_FLOAT32_SCALAR_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [-1, -0.3333333334, 0.3333333334, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_FLOAT32_SCALAR_array", function () {
    const propertyName = "example_fixed_length_FLOAT32_SCALAR_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [-1, -0.5, 0, 0.5, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_FLOAT64_SCALAR", function () {
    const propertyName = "example_FLOAT64_SCALAR";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = 12.34;
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_FLOAT64_SCALAR_array", function () {
    const propertyName = "example_variable_length_FLOAT64_SCALAR_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [-1, -0.3333333334, 0.3333333334, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_FLOAT64_SCALAR_array", function () {
    const propertyName = "example_fixed_length_FLOAT64_SCALAR_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [-1, -0.5, 0, 0.5, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_INT8_VEC2", function () {
    const propertyName = "example_INT8_VEC2";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [-128, 127];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_INT8_VEC2_array", function () {
    const propertyName = "example_variable_length_INT8_VEC2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-128, 127],
      [-128, 127],
      [-128, 127],
      [-128, 127],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_INT8_VEC2_array", function () {
    const propertyName = "example_fixed_length_INT8_VEC2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-128, 127],
      [-128, 127],
      [-128, 127],
      [-128, 127],
      [-128, 127],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_normalized_INT8_VEC2", function () {
    const propertyName = "example_normalized_INT8_VEC2";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [-1, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_normalized_INT8_VEC2_array", function () {
    const propertyName = "example_variable_length_normalized_INT8_VEC2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-1, 1],
      [-1, 1],
      [-1, 1],
      [-1, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_normalized_INT8_VEC2_array", function () {
    const propertyName = "example_fixed_length_normalized_INT8_VEC2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-1, 1],
      [-1, 1],
      [-1, 1],
      [-1, 1],
      [-1, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_UINT8_VEC2", function () {
    const propertyName = "example_UINT8_VEC2";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [0, 255];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_UINT8_VEC2_array", function () {
    const propertyName = "example_variable_length_UINT8_VEC2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 255],
      [0, 255],
      [0, 255],
      [0, 255],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_UINT8_VEC2_array", function () {
    const propertyName = "example_fixed_length_UINT8_VEC2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 255],
      [0, 255],
      [0, 255],
      [0, 255],
      [0, 255],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_normalized_UINT8_VEC2", function () {
    const propertyName = "example_normalized_UINT8_VEC2";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [0, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_normalized_UINT8_VEC2_array", function () {
    const propertyName = "example_variable_length_normalized_UINT8_VEC2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 1],
      [0, 1],
      [0, 1],
      [0, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_normalized_UINT8_VEC2_array", function () {
    const propertyName = "example_fixed_length_normalized_UINT8_VEC2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 1],
      [0, 1],
      [0, 1],
      [0, 1],
      [0, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_INT16_VEC2", function () {
    const propertyName = "example_INT16_VEC2";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [-32768, 32767];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_INT16_VEC2_array", function () {
    const propertyName = "example_variable_length_INT16_VEC2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-32768, 32767],
      [-32768, 32767],
      [-32768, 32767],
      [-32768, 32767],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_INT16_VEC2_array", function () {
    const propertyName = "example_fixed_length_INT16_VEC2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-32768, 32767],
      [-32768, 32767],
      [-32768, 32767],
      [-32768, 32767],
      [-32768, 32767],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_normalized_INT16_VEC2", function () {
    const propertyName = "example_normalized_INT16_VEC2";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [-1, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_normalized_INT16_VEC2_array", function () {
    const propertyName = "example_variable_length_normalized_INT16_VEC2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-1, 1],
      [-1, 1],
      [-1, 1],
      [-1, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_normalized_INT16_VEC2_array", function () {
    const propertyName = "example_fixed_length_normalized_INT16_VEC2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-1, 1],
      [-1, 1],
      [-1, 1],
      [-1, 1],
      [-1, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_UINT16_VEC2", function () {
    const propertyName = "example_UINT16_VEC2";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [0, 65535];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_UINT16_VEC2_array", function () {
    const propertyName = "example_variable_length_UINT16_VEC2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 65535],
      [0, 65535],
      [0, 65535],
      [0, 65535],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_UINT16_VEC2_array", function () {
    const propertyName = "example_fixed_length_UINT16_VEC2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 65535],
      [0, 65535],
      [0, 65535],
      [0, 65535],
      [0, 65535],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_normalized_UINT16_VEC2", function () {
    const propertyName = "example_normalized_UINT16_VEC2";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [0, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_normalized_UINT16_VEC2_array", function () {
    const propertyName = "example_variable_length_normalized_UINT16_VEC2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 1],
      [0, 1],
      [0, 1],
      [0, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_normalized_UINT16_VEC2_array", function () {
    const propertyName = "example_fixed_length_normalized_UINT16_VEC2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 1],
      [0, 1],
      [0, 1],
      [0, 1],
      [0, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_INT32_VEC2", function () {
    const propertyName = "example_INT32_VEC2";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [-2147483648, 2147483647];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_INT32_VEC2_array", function () {
    const propertyName = "example_variable_length_INT32_VEC2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-2147483648, 2147483647],
      [-2147483648, 2147483647],
      [-2147483648, 2147483647],
      [-2147483648, 2147483647],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_INT32_VEC2_array", function () {
    const propertyName = "example_fixed_length_INT32_VEC2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-2147483648, 2147483647],
      [-2147483648, 2147483647],
      [-2147483648, 2147483647],
      [-2147483648, 2147483647],
      [-2147483648, 2147483647],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_normalized_INT32_VEC2", function () {
    const propertyName = "example_normalized_INT32_VEC2";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [-1, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_normalized_INT32_VEC2_array", function () {
    const propertyName = "example_variable_length_normalized_INT32_VEC2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-1, 1],
      [-1, 1],
      [-1, 1],
      [-1, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_normalized_INT32_VEC2_array", function () {
    const propertyName = "example_fixed_length_normalized_INT32_VEC2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-1, 1],
      [-1, 1],
      [-1, 1],
      [-1, 1],
      [-1, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_UINT32_VEC2", function () {
    const propertyName = "example_UINT32_VEC2";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [0, 4294967295];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_UINT32_VEC2_array", function () {
    const propertyName = "example_variable_length_UINT32_VEC2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 4294967295],
      [0, 4294967295],
      [0, 4294967295],
      [0, 4294967295],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_UINT32_VEC2_array", function () {
    const propertyName = "example_fixed_length_UINT32_VEC2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 4294967295],
      [0, 4294967295],
      [0, 4294967295],
      [0, 4294967295],
      [0, 4294967295],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_normalized_UINT32_VEC2", function () {
    const propertyName = "example_normalized_UINT32_VEC2";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [0, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_normalized_UINT32_VEC2_array", function () {
    const propertyName = "example_variable_length_normalized_UINT32_VEC2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 1],
      [0, 1],
      [0, 1],
      [0, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_normalized_UINT32_VEC2_array", function () {
    const propertyName = "example_fixed_length_normalized_UINT32_VEC2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 1],
      [0, 1],
      [0, 1],
      [0, 1],
      [0, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_INT64_VEC2", function () {
    const propertyName = "example_INT64_VEC2";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [-9223372036854776000n, 9223372036854776000n];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_INT64_VEC2_array", function () {
    const propertyName = "example_variable_length_INT64_VEC2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-9223372036854776000n, 9223372036854776000n],
      [-9223372036854776000n, 9223372036854776000n],
      [-9223372036854776000n, 9223372036854776000n],
      [-9223372036854776000n, 9223372036854776000n],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_INT64_VEC2_array", function () {
    const propertyName = "example_fixed_length_INT64_VEC2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-9223372036854776000n, 9223372036854776000n],
      [-9223372036854776000n, 9223372036854776000n],
      [-9223372036854776000n, 9223372036854776000n],
      [-9223372036854776000n, 9223372036854776000n],
      [-9223372036854776000n, 9223372036854776000n],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_normalized_INT64_VEC2", function () {
    const propertyName = "example_normalized_INT64_VEC2";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [-1, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_normalized_INT64_VEC2_array", function () {
    const propertyName = "example_variable_length_normalized_INT64_VEC2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-1, 1],
      [-1, 1],
      [-1, 1],
      [-1, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_normalized_INT64_VEC2_array", function () {
    const propertyName = "example_fixed_length_normalized_INT64_VEC2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-1, 1],
      [-1, 1],
      [-1, 1],
      [-1, 1],
      [-1, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_UINT64_VEC2", function () {
    const propertyName = "example_UINT64_VEC2";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [0, 18446744073709552000n];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_UINT64_VEC2_array", function () {
    const propertyName = "example_variable_length_UINT64_VEC2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 18446744073709552000n],
      [0, 18446744073709552000n],
      [0, 18446744073709552000n],
      [0, 18446744073709552000n],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_UINT64_VEC2_array", function () {
    const propertyName = "example_fixed_length_UINT64_VEC2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 18446744073709552000n],
      [0, 18446744073709552000n],
      [0, 18446744073709552000n],
      [0, 18446744073709552000n],
      [0, 18446744073709552000n],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_normalized_UINT64_VEC2", function () {
    const propertyName = "example_normalized_UINT64_VEC2";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [0, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_normalized_UINT64_VEC2_array", function () {
    const propertyName = "example_variable_length_normalized_UINT64_VEC2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 1],
      [0, 1],
      [0, 1],
      [0, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_normalized_UINT64_VEC2_array", function () {
    const propertyName = "example_fixed_length_normalized_UINT64_VEC2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 1],
      [0, 1],
      [0, 1],
      [0, 1],
      [0, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_FLOAT32_VEC2", function () {
    const propertyName = "example_FLOAT32_VEC2";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [-1, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_FLOAT32_VEC2_array", function () {
    const propertyName = "example_variable_length_FLOAT32_VEC2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-1, 1],
      [-1, 1],
      [-1, 1],
      [-1, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_FLOAT32_VEC2_array", function () {
    const propertyName = "example_fixed_length_FLOAT32_VEC2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-1, 1],
      [-1, 1],
      [-1, 1],
      [-1, 1],
      [-1, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_FLOAT64_VEC2", function () {
    const propertyName = "example_FLOAT64_VEC2";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [-1, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_FLOAT64_VEC2_array", function () {
    const propertyName = "example_variable_length_FLOAT64_VEC2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-1, 1],
      [-1, 1],
      [-1, 1],
      [-1, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_FLOAT64_VEC2_array", function () {
    const propertyName = "example_fixed_length_FLOAT64_VEC2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-1, 1],
      [-1, 1],
      [-1, 1],
      [-1, 1],
      [-1, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_INT8_VEC3", function () {
    const propertyName = "example_INT8_VEC3";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [-128, 0, 127];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_INT8_VEC3_array", function () {
    const propertyName = "example_variable_length_INT8_VEC3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-128, 0, 127],
      [-128, 0, 127],
      [-128, 0, 127],
      [-128, 0, 127],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_INT8_VEC3_array", function () {
    const propertyName = "example_fixed_length_INT8_VEC3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-128, 0, 127],
      [-128, 0, 127],
      [-128, 0, 127],
      [-128, 0, 127],
      [-128, 0, 127],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_normalized_INT8_VEC3", function () {
    const propertyName = "example_normalized_INT8_VEC3";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [-1, 0, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_normalized_INT8_VEC3_array", function () {
    const propertyName = "example_variable_length_normalized_INT8_VEC3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-1, 0, 1],
      [-1, 0, 1],
      [-1, 0, 1],
      [-1, 0, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_normalized_INT8_VEC3_array", function () {
    const propertyName = "example_fixed_length_normalized_INT8_VEC3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-1, 0, 1],
      [-1, 0, 1],
      [-1, 0, 1],
      [-1, 0, 1],
      [-1, 0, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_UINT8_VEC3", function () {
    const propertyName = "example_UINT8_VEC3";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [0, 127, 255];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_UINT8_VEC3_array", function () {
    const propertyName = "example_variable_length_UINT8_VEC3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 127, 255],
      [0, 127, 255],
      [0, 127, 255],
      [0, 127, 255],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_UINT8_VEC3_array", function () {
    const propertyName = "example_fixed_length_UINT8_VEC3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 127, 255],
      [0, 127, 255],
      [0, 127, 255],
      [0, 127, 255],
      [0, 127, 255],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_normalized_UINT8_VEC3", function () {
    const propertyName = "example_normalized_UINT8_VEC3";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [0, 0.4980392156862745, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_normalized_UINT8_VEC3_array", function () {
    const propertyName = "example_variable_length_normalized_UINT8_VEC3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 0.4980392156862745, 1],
      [0, 0.4980392156862745, 1],
      [0, 0.4980392156862745, 1],
      [0, 0.4980392156862745, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_normalized_UINT8_VEC3_array", function () {
    const propertyName = "example_fixed_length_normalized_UINT8_VEC3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 0.4980392156862745, 1],
      [0, 0.4980392156862745, 1],
      [0, 0.4980392156862745, 1],
      [0, 0.4980392156862745, 1],
      [0, 0.4980392156862745, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_INT16_VEC3", function () {
    const propertyName = "example_INT16_VEC3";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [-32768, 0, 32767];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_INT16_VEC3_array", function () {
    const propertyName = "example_variable_length_INT16_VEC3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-32768, 0, 32767],
      [-32768, 0, 32767],
      [-32768, 0, 32767],
      [-32768, 0, 32767],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_INT16_VEC3_array", function () {
    const propertyName = "example_fixed_length_INT16_VEC3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-32768, 0, 32767],
      [-32768, 0, 32767],
      [-32768, 0, 32767],
      [-32768, 0, 32767],
      [-32768, 0, 32767],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_normalized_INT16_VEC3", function () {
    const propertyName = "example_normalized_INT16_VEC3";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [-1, 0, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_normalized_INT16_VEC3_array", function () {
    const propertyName = "example_variable_length_normalized_INT16_VEC3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-1, 0, 1],
      [-1, 0, 1],
      [-1, 0, 1],
      [-1, 0, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_normalized_INT16_VEC3_array", function () {
    const propertyName = "example_fixed_length_normalized_INT16_VEC3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-1, 0, 1],
      [-1, 0, 1],
      [-1, 0, 1],
      [-1, 0, 1],
      [-1, 0, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_UINT16_VEC3", function () {
    const propertyName = "example_UINT16_VEC3";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [0, 32767, 65535];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_UINT16_VEC3_array", function () {
    const propertyName = "example_variable_length_UINT16_VEC3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 32767, 65535],
      [0, 32767, 65535],
      [0, 32767, 65535],
      [0, 32767, 65535],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_UINT16_VEC3_array", function () {
    const propertyName = "example_fixed_length_UINT16_VEC3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 32767, 65535],
      [0, 32767, 65535],
      [0, 32767, 65535],
      [0, 32767, 65535],
      [0, 32767, 65535],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_normalized_UINT16_VEC3", function () {
    const propertyName = "example_normalized_UINT16_VEC3";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [0, 0.49999237048905165, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_normalized_UINT16_VEC3_array", function () {
    const propertyName = "example_variable_length_normalized_UINT16_VEC3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 0.49999237048905165, 1],
      [0, 0.49999237048905165, 1],
      [0, 0.49999237048905165, 1],
      [0, 0.49999237048905165, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_normalized_UINT16_VEC3_array", function () {
    const propertyName = "example_fixed_length_normalized_UINT16_VEC3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 0.49999237048905165, 1],
      [0, 0.49999237048905165, 1],
      [0, 0.49999237048905165, 1],
      [0, 0.49999237048905165, 1],
      [0, 0.49999237048905165, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_INT32_VEC3", function () {
    const propertyName = "example_INT32_VEC3";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [-2147483648, 0, 2147483647];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_INT32_VEC3_array", function () {
    const propertyName = "example_variable_length_INT32_VEC3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-2147483648, 0, 2147483647],
      [-2147483648, 0, 2147483647],
      [-2147483648, 0, 2147483647],
      [-2147483648, 0, 2147483647],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_INT32_VEC3_array", function () {
    const propertyName = "example_fixed_length_INT32_VEC3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-2147483648, 0, 2147483647],
      [-2147483648, 0, 2147483647],
      [-2147483648, 0, 2147483647],
      [-2147483648, 0, 2147483647],
      [-2147483648, 0, 2147483647],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_normalized_INT32_VEC3", function () {
    const propertyName = "example_normalized_INT32_VEC3";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [-1, 0, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_normalized_INT32_VEC3_array", function () {
    const propertyName = "example_variable_length_normalized_INT32_VEC3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-1, 0, 1],
      [-1, 0, 1],
      [-1, 0, 1],
      [-1, 0, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_normalized_INT32_VEC3_array", function () {
    const propertyName = "example_fixed_length_normalized_INT32_VEC3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-1, 0, 1],
      [-1, 0, 1],
      [-1, 0, 1],
      [-1, 0, 1],
      [-1, 0, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_UINT32_VEC3", function () {
    const propertyName = "example_UINT32_VEC3";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [0, 2147483647, 4294967295];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_UINT32_VEC3_array", function () {
    const propertyName = "example_variable_length_UINT32_VEC3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 2147483647, 4294967295],
      [0, 2147483647, 4294967295],
      [0, 2147483647, 4294967295],
      [0, 2147483647, 4294967295],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_UINT32_VEC3_array", function () {
    const propertyName = "example_fixed_length_UINT32_VEC3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 2147483647, 4294967295],
      [0, 2147483647, 4294967295],
      [0, 2147483647, 4294967295],
      [0, 2147483647, 4294967295],
      [0, 2147483647, 4294967295],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_normalized_UINT32_VEC3", function () {
    const propertyName = "example_normalized_UINT32_VEC3";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [0, 0.4999999998835847, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_normalized_UINT32_VEC3_array", function () {
    const propertyName = "example_variable_length_normalized_UINT32_VEC3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 0.4999999998835847, 1],
      [0, 0.4999999998835847, 1],
      [0, 0.4999999998835847, 1],
      [0, 0.4999999998835847, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_normalized_UINT32_VEC3_array", function () {
    const propertyName = "example_fixed_length_normalized_UINT32_VEC3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 0.4999999998835847, 1],
      [0, 0.4999999998835847, 1],
      [0, 0.4999999998835847, 1],
      [0, 0.4999999998835847, 1],
      [0, 0.4999999998835847, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_INT64_VEC3", function () {
    const propertyName = "example_INT64_VEC3";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [-9223372036854776000n, 0, 9223372036854776000n];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_INT64_VEC3_array", function () {
    const propertyName = "example_variable_length_INT64_VEC3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-9223372036854776000n, 0, 9223372036854776000n],
      [-9223372036854776000n, 0, 9223372036854776000n],
      [-9223372036854776000n, 0, 9223372036854776000n],
      [-9223372036854776000n, 0, 9223372036854776000n],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_INT64_VEC3_array", function () {
    const propertyName = "example_fixed_length_INT64_VEC3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-9223372036854776000n, 0, 9223372036854776000n],
      [-9223372036854776000n, 0, 9223372036854776000n],
      [-9223372036854776000n, 0, 9223372036854776000n],
      [-9223372036854776000n, 0, 9223372036854776000n],
      [-9223372036854776000n, 0, 9223372036854776000n],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_normalized_INT64_VEC3", function () {
    const propertyName = "example_normalized_INT64_VEC3";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [-1, 0, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_normalized_INT64_VEC3_array", function () {
    const propertyName = "example_variable_length_normalized_INT64_VEC3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-1, 0, 1],
      [-1, 0, 1],
      [-1, 0, 1],
      [-1, 0, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_normalized_INT64_VEC3_array", function () {
    const propertyName = "example_fixed_length_normalized_INT64_VEC3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-1, 0, 1],
      [-1, 0, 1],
      [-1, 0, 1],
      [-1, 0, 1],
      [-1, 0, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_UINT64_VEC3", function () {
    const propertyName = "example_UINT64_VEC3";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [0, 9223372036854776000n, 18446744073709552000n];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_UINT64_VEC3_array", function () {
    const propertyName = "example_variable_length_UINT64_VEC3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 9223372036854776000n, 18446744073709552000n],
      [0, 9223372036854776000n, 18446744073709552000n],
      [0, 9223372036854776000n, 18446744073709552000n],
      [0, 9223372036854776000n, 18446744073709552000n],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_UINT64_VEC3_array", function () {
    const propertyName = "example_fixed_length_UINT64_VEC3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 9223372036854776000n, 18446744073709552000n],
      [0, 9223372036854776000n, 18446744073709552000n],
      [0, 9223372036854776000n, 18446744073709552000n],
      [0, 9223372036854776000n, 18446744073709552000n],
      [0, 9223372036854776000n, 18446744073709552000n],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_normalized_UINT64_VEC3", function () {
    const propertyName = "example_normalized_UINT64_VEC3";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [0, 0.5, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_normalized_UINT64_VEC3_array", function () {
    const propertyName = "example_variable_length_normalized_UINT64_VEC3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 0.5, 1],
      [0, 0.5, 1],
      [0, 0.5, 1],
      [0, 0.5, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_normalized_UINT64_VEC3_array", function () {
    const propertyName = "example_fixed_length_normalized_UINT64_VEC3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 0.5, 1],
      [0, 0.5, 1],
      [0, 0.5, 1],
      [0, 0.5, 1],
      [0, 0.5, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_FLOAT32_VEC3", function () {
    const propertyName = "example_FLOAT32_VEC3";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [-1, 0, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_FLOAT32_VEC3_array", function () {
    const propertyName = "example_variable_length_FLOAT32_VEC3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-1, 0, 1],
      [-1, 0, 1],
      [-1, 0, 1],
      [-1, 0, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_FLOAT32_VEC3_array", function () {
    const propertyName = "example_fixed_length_FLOAT32_VEC3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-1, 0, 1],
      [-1, 0, 1],
      [-1, 0, 1],
      [-1, 0, 1],
      [-1, 0, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_FLOAT64_VEC3", function () {
    const propertyName = "example_FLOAT64_VEC3";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [-1, 0, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_FLOAT64_VEC3_array", function () {
    const propertyName = "example_variable_length_FLOAT64_VEC3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-1, 0, 1],
      [-1, 0, 1],
      [-1, 0, 1],
      [-1, 0, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_FLOAT64_VEC3_array", function () {
    const propertyName = "example_fixed_length_FLOAT64_VEC3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-1, 0, 1],
      [-1, 0, 1],
      [-1, 0, 1],
      [-1, 0, 1],
      [-1, 0, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_INT8_VEC4", function () {
    const propertyName = "example_INT8_VEC4";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [-128, -43, 42, 127];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_INT8_VEC4_array", function () {
    const propertyName = "example_variable_length_INT8_VEC4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-128, -43, 42, 127],
      [-128, -43, 42, 127],
      [-128, -43, 42, 127],
      [-128, -43, 42, 127],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_INT8_VEC4_array", function () {
    const propertyName = "example_fixed_length_INT8_VEC4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-128, -43, 42, 127],
      [-128, -43, 42, 127],
      [-128, -43, 42, 127],
      [-128, -43, 42, 127],
      [-128, -43, 42, 127],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_normalized_INT8_VEC4", function () {
    const propertyName = "example_normalized_INT8_VEC4";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [-1, -0.33858267716535434, 0.33070866141732286, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_normalized_INT8_VEC4_array", function () {
    const propertyName = "example_variable_length_normalized_INT8_VEC4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-1, -0.33858267716535434, 0.33070866141732286, 1],
      [-1, -0.33858267716535434, 0.33070866141732286, 1],
      [-1, -0.33858267716535434, 0.33070866141732286, 1],
      [-1, -0.33858267716535434, 0.33070866141732286, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_normalized_INT8_VEC4_array", function () {
    const propertyName = "example_fixed_length_normalized_INT8_VEC4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-1, -0.33858267716535434, 0.33070866141732286, 1],
      [-1, -0.33858267716535434, 0.33070866141732286, 1],
      [-1, -0.33858267716535434, 0.33070866141732286, 1],
      [-1, -0.33858267716535434, 0.33070866141732286, 1],
      [-1, -0.33858267716535434, 0.33070866141732286, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_UINT8_VEC4", function () {
    const propertyName = "example_UINT8_VEC4";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [0, 84, 170, 255];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_UINT8_VEC4_array", function () {
    const propertyName = "example_variable_length_UINT8_VEC4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 84, 170, 255],
      [0, 84, 170, 255],
      [0, 84, 170, 255],
      [0, 84, 170, 255],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_UINT8_VEC4_array", function () {
    const propertyName = "example_fixed_length_UINT8_VEC4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 84, 170, 255],
      [0, 84, 170, 255],
      [0, 84, 170, 255],
      [0, 84, 170, 255],
      [0, 84, 170, 255],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_normalized_UINT8_VEC4", function () {
    const propertyName = "example_normalized_UINT8_VEC4";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [0, 0.32941176470588235, 0.6666666666666666, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_normalized_UINT8_VEC4_array", function () {
    const propertyName = "example_variable_length_normalized_UINT8_VEC4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 0.32941176470588235, 0.6666666666666666, 1],
      [0, 0.32941176470588235, 0.6666666666666666, 1],
      [0, 0.32941176470588235, 0.6666666666666666, 1],
      [0, 0.32941176470588235, 0.6666666666666666, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_normalized_UINT8_VEC4_array", function () {
    const propertyName = "example_fixed_length_normalized_UINT8_VEC4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 0.32941176470588235, 0.6666666666666666, 1],
      [0, 0.32941176470588235, 0.6666666666666666, 1],
      [0, 0.32941176470588235, 0.6666666666666666, 1],
      [0, 0.32941176470588235, 0.6666666666666666, 1],
      [0, 0.32941176470588235, 0.6666666666666666, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_INT16_VEC4", function () {
    const propertyName = "example_INT16_VEC4";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [-32768, -10923, 10922, 32767];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_INT16_VEC4_array", function () {
    const propertyName = "example_variable_length_INT16_VEC4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-32768, -10923, 10922, 32767],
      [-32768, -10923, 10922, 32767],
      [-32768, -10923, 10922, 32767],
      [-32768, -10923, 10922, 32767],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_INT16_VEC4_array", function () {
    const propertyName = "example_fixed_length_INT16_VEC4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-32768, -10923, 10922, 32767],
      [-32768, -10923, 10922, 32767],
      [-32768, -10923, 10922, 32767],
      [-32768, -10923, 10922, 32767],
      [-32768, -10923, 10922, 32767],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_normalized_INT16_VEC4", function () {
    const propertyName = "example_normalized_INT16_VEC4";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [-1, -0.33335367900631735, 0.33332316049684135, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_normalized_INT16_VEC4_array", function () {
    const propertyName = "example_variable_length_normalized_INT16_VEC4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-1, -0.33335367900631735, 0.33332316049684135, 1],
      [-1, -0.33335367900631735, 0.33332316049684135, 1],
      [-1, -0.33335367900631735, 0.33332316049684135, 1],
      [-1, -0.33335367900631735, 0.33332316049684135, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_normalized_INT16_VEC4_array", function () {
    const propertyName = "example_fixed_length_normalized_INT16_VEC4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-1, -0.33335367900631735, 0.33332316049684135, 1],
      [-1, -0.33335367900631735, 0.33332316049684135, 1],
      [-1, -0.33335367900631735, 0.33332316049684135, 1],
      [-1, -0.33335367900631735, 0.33332316049684135, 1],
      [-1, -0.33335367900631735, 0.33332316049684135, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_UINT16_VEC4", function () {
    const propertyName = "example_UINT16_VEC4";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [0, 21844, 43690, 65535];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_UINT16_VEC4_array", function () {
    const propertyName = "example_variable_length_UINT16_VEC4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 21844, 43690, 65535],
      [0, 21844, 43690, 65535],
      [0, 21844, 43690, 65535],
      [0, 21844, 43690, 65535],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_UINT16_VEC4_array", function () {
    const propertyName = "example_fixed_length_UINT16_VEC4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 21844, 43690, 65535],
      [0, 21844, 43690, 65535],
      [0, 21844, 43690, 65535],
      [0, 21844, 43690, 65535],
      [0, 21844, 43690, 65535],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_normalized_UINT16_VEC4", function () {
    const propertyName = "example_normalized_UINT16_VEC4";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [0, 0.3333180743114366, 0.6666666666666666, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_normalized_UINT16_VEC4_array", function () {
    const propertyName = "example_variable_length_normalized_UINT16_VEC4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 0.3333180743114366, 0.6666666666666666, 1],
      [0, 0.3333180743114366, 0.6666666666666666, 1],
      [0, 0.3333180743114366, 0.6666666666666666, 1],
      [0, 0.3333180743114366, 0.6666666666666666, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_normalized_UINT16_VEC4_array", function () {
    const propertyName = "example_fixed_length_normalized_UINT16_VEC4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 0.3333180743114366, 0.6666666666666666, 1],
      [0, 0.3333180743114366, 0.6666666666666666, 1],
      [0, 0.3333180743114366, 0.6666666666666666, 1],
      [0, 0.3333180743114366, 0.6666666666666666, 1],
      [0, 0.3333180743114366, 0.6666666666666666, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_INT32_VEC4", function () {
    const propertyName = "example_INT32_VEC4";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [-2147483648, -715827883, 715827882, 2147483647];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_INT32_VEC4_array", function () {
    const propertyName = "example_variable_length_INT32_VEC4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-2147483648, -715827883, 715827882, 2147483647],
      [-2147483648, -715827883, 715827882, 2147483647],
      [-2147483648, -715827883, 715827882, 2147483647],
      [-2147483648, -715827883, 715827882, 2147483647],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_INT32_VEC4_array", function () {
    const propertyName = "example_fixed_length_INT32_VEC4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-2147483648, -715827883, 715827882, 2147483647],
      [-2147483648, -715827883, 715827882, 2147483647],
      [-2147483648, -715827883, 715827882, 2147483647],
      [-2147483648, -715827883, 715827882, 2147483647],
      [-2147483648, -715827883, 715827882, 2147483647],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_normalized_INT32_VEC4", function () {
    const propertyName = "example_normalized_INT32_VEC4";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [-1, -0.3333333336437742, 0.3333333331781129, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_normalized_INT32_VEC4_array", function () {
    const propertyName = "example_variable_length_normalized_INT32_VEC4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-1, -0.3333333336437742, 0.3333333331781129, 1],
      [-1, -0.3333333336437742, 0.3333333331781129, 1],
      [-1, -0.3333333336437742, 0.3333333331781129, 1],
      [-1, -0.3333333336437742, 0.3333333331781129, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_normalized_INT32_VEC4_array", function () {
    const propertyName = "example_fixed_length_normalized_INT32_VEC4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-1, -0.3333333336437742, 0.3333333331781129, 1],
      [-1, -0.3333333336437742, 0.3333333331781129, 1],
      [-1, -0.3333333336437742, 0.3333333331781129, 1],
      [-1, -0.3333333336437742, 0.3333333331781129, 1],
      [-1, -0.3333333336437742, 0.3333333331781129, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_UINT32_VEC4", function () {
    const propertyName = "example_UINT32_VEC4";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [0, 1431655764, 2863311530, 4294967295];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_UINT32_VEC4_array", function () {
    const propertyName = "example_variable_length_UINT32_VEC4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 1431655764, 2863311530, 4294967295],
      [0, 1431655764, 2863311530, 4294967295],
      [0, 1431655764, 2863311530, 4294967295],
      [0, 1431655764, 2863311530, 4294967295],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_UINT32_VEC4_array", function () {
    const propertyName = "example_fixed_length_UINT32_VEC4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 1431655764, 2863311530, 4294967295],
      [0, 1431655764, 2863311530, 4294967295],
      [0, 1431655764, 2863311530, 4294967295],
      [0, 1431655764, 2863311530, 4294967295],
      [0, 1431655764, 2863311530, 4294967295],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_normalized_UINT32_VEC4", function () {
    const propertyName = "example_normalized_UINT32_VEC4";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [0, 0.33333333310050267, 0.6666666666666666, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_normalized_UINT32_VEC4_array", function () {
    const propertyName = "example_variable_length_normalized_UINT32_VEC4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 0.33333333310050267, 0.6666666666666666, 1],
      [0, 0.33333333310050267, 0.6666666666666666, 1],
      [0, 0.33333333310050267, 0.6666666666666666, 1],
      [0, 0.33333333310050267, 0.6666666666666666, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_normalized_UINT32_VEC4_array", function () {
    const propertyName = "example_fixed_length_normalized_UINT32_VEC4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 0.33333333310050267, 0.6666666666666666, 1],
      [0, 0.33333333310050267, 0.6666666666666666, 1],
      [0, 0.33333333310050267, 0.6666666666666666, 1],
      [0, 0.33333333310050267, 0.6666666666666666, 1],
      [0, 0.33333333310050267, 0.6666666666666666, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_INT64_VEC4", function () {
    const propertyName = "example_INT64_VEC4";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      -9223372036854776000n,
      -3074457346233150000n,
      3074457346233150000n,
      9223372036854776000n,
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_INT64_VEC4_array", function () {
    const propertyName = "example_variable_length_INT64_VEC4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [
        -9223372036854776000n,
        -3074457346233150000n,
        3074457346233150000n,
        9223372036854776000n,
      ],
      [
        -9223372036854776000n,
        -3074457346233150000n,
        3074457346233150000n,
        9223372036854776000n,
      ],
      [
        -9223372036854776000n,
        -3074457346233150000n,
        3074457346233150000n,
        9223372036854776000n,
      ],
      [
        -9223372036854776000n,
        -3074457346233150000n,
        3074457346233150000n,
        9223372036854776000n,
      ],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_INT64_VEC4_array", function () {
    const propertyName = "example_fixed_length_INT64_VEC4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [
        -9223372036854776000n,
        -3074457346233150000n,
        3074457346233150000n,
        9223372036854776000n,
      ],
      [
        -9223372036854776000n,
        -3074457346233150000n,
        3074457346233150000n,
        9223372036854776000n,
      ],
      [
        -9223372036854776000n,
        -3074457346233150000n,
        3074457346233150000n,
        9223372036854776000n,
      ],
      [
        -9223372036854776000n,
        -3074457346233150000n,
        3074457346233150000n,
        9223372036854776000n,
      ],
      [
        -9223372036854776000n,
        -3074457346233150000n,
        3074457346233150000n,
        9223372036854776000n,
      ],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_normalized_INT64_VEC4", function () {
    const propertyName = "example_normalized_INT64_VEC4";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [-1, -0.3333333334, 0.3333333334, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_normalized_INT64_VEC4_array", function () {
    const propertyName = "example_variable_length_normalized_INT64_VEC4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-1, -0.3333333334, 0.3333333334, 1],
      [-1, -0.3333333334, 0.3333333334, 1],
      [-1, -0.3333333334, 0.3333333334, 1],
      [-1, -0.3333333334, 0.3333333334, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_normalized_INT64_VEC4_array", function () {
    const propertyName = "example_fixed_length_normalized_INT64_VEC4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-1, -0.3333333334, 0.3333333334, 1],
      [-1, -0.3333333334, 0.3333333334, 1],
      [-1, -0.3333333334, 0.3333333334, 1],
      [-1, -0.3333333334, 0.3333333334, 1],
      [-1, -0.3333333334, 0.3333333334, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_UINT64_VEC4", function () {
    const propertyName = "example_UINT64_VEC4";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      0,
      6148914690621625000n,
      12297829383087925000n,
      18446744073709552000n,
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_UINT64_VEC4_array", function () {
    const propertyName = "example_variable_length_UINT64_VEC4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 6148914690621625000n, 12297829383087925000n, 18446744073709552000n],
      [0, 6148914690621625000n, 12297829383087925000n, 18446744073709552000n],
      [0, 6148914690621625000n, 12297829383087925000n, 18446744073709552000n],
      [0, 6148914690621625000n, 12297829383087925000n, 18446744073709552000n],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_UINT64_VEC4_array", function () {
    const propertyName = "example_fixed_length_UINT64_VEC4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 6148914690621625000n, 12297829383087925000n, 18446744073709552000n],
      [0, 6148914690621625000n, 12297829383087925000n, 18446744073709552000n],
      [0, 6148914690621625000n, 12297829383087925000n, 18446744073709552000n],
      [0, 6148914690621625000n, 12297829383087925000n, 18446744073709552000n],
      [0, 6148914690621625000n, 12297829383087925000n, 18446744073709552000n],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_normalized_UINT64_VEC4", function () {
    const propertyName = "example_normalized_UINT64_VEC4";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [0, 0.3333333333, 0.6666666667, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_normalized_UINT64_VEC4_array", function () {
    const propertyName = "example_variable_length_normalized_UINT64_VEC4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 0.3333333333, 0.6666666667, 1],
      [0, 0.3333333333, 0.6666666667, 1],
      [0, 0.3333333333, 0.6666666667, 1],
      [0, 0.3333333333, 0.6666666667, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_normalized_UINT64_VEC4_array", function () {
    const propertyName = "example_fixed_length_normalized_UINT64_VEC4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 0.3333333333, 0.6666666667, 1],
      [0, 0.3333333333, 0.6666666667, 1],
      [0, 0.3333333333, 0.6666666667, 1],
      [0, 0.3333333333, 0.6666666667, 1],
      [0, 0.3333333333, 0.6666666667, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_FLOAT32_VEC4", function () {
    const propertyName = "example_FLOAT32_VEC4";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [-1, -0.3333333334, 0.3333333334, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_FLOAT32_VEC4_array", function () {
    const propertyName = "example_variable_length_FLOAT32_VEC4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-1, -0.3333333334, 0.3333333334, 1],
      [-1, -0.3333333334, 0.3333333334, 1],
      [-1, -0.3333333334, 0.3333333334, 1],
      [-1, -0.3333333334, 0.3333333334, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_FLOAT32_VEC4_array", function () {
    const propertyName = "example_fixed_length_FLOAT32_VEC4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-1, -0.3333333334, 0.3333333334, 1],
      [-1, -0.3333333334, 0.3333333334, 1],
      [-1, -0.3333333334, 0.3333333334, 1],
      [-1, -0.3333333334, 0.3333333334, 1],
      [-1, -0.3333333334, 0.3333333334, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_FLOAT64_VEC4", function () {
    const propertyName = "example_FLOAT64_VEC4";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [-1, -0.3333333334, 0.3333333334, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_FLOAT64_VEC4_array", function () {
    const propertyName = "example_variable_length_FLOAT64_VEC4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-1, -0.3333333334, 0.3333333334, 1],
      [-1, -0.3333333334, 0.3333333334, 1],
      [-1, -0.3333333334, 0.3333333334, 1],
      [-1, -0.3333333334, 0.3333333334, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_FLOAT64_VEC4_array", function () {
    const propertyName = "example_fixed_length_FLOAT64_VEC4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-1, -0.3333333334, 0.3333333334, 1],
      [-1, -0.3333333334, 0.3333333334, 1],
      [-1, -0.3333333334, 0.3333333334, 1],
      [-1, -0.3333333334, 0.3333333334, 1],
      [-1, -0.3333333334, 0.3333333334, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_INT8_MAT2", function () {
    const propertyName = "example_INT8_MAT2";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [-128, -43, 42, 127];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_INT8_MAT2_array", function () {
    const propertyName = "example_variable_length_INT8_MAT2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-128, -43, 42, 127],
      [-128, -43, 42, 127],
      [-128, -43, 42, 127],
      [-128, -43, 42, 127],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_INT8_MAT2_array", function () {
    const propertyName = "example_fixed_length_INT8_MAT2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-128, -43, 42, 127],
      [-128, -43, 42, 127],
      [-128, -43, 42, 127],
      [-128, -43, 42, 127],
      [-128, -43, 42, 127],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_normalized_INT8_MAT2", function () {
    const propertyName = "example_normalized_INT8_MAT2";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [-1, -0.33858267716535434, 0.33070866141732286, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_normalized_INT8_MAT2_array", function () {
    const propertyName = "example_variable_length_normalized_INT8_MAT2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-1, -0.33858267716535434, 0.33070866141732286, 1],
      [-1, -0.33858267716535434, 0.33070866141732286, 1],
      [-1, -0.33858267716535434, 0.33070866141732286, 1],
      [-1, -0.33858267716535434, 0.33070866141732286, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_normalized_INT8_MAT2_array", function () {
    const propertyName = "example_fixed_length_normalized_INT8_MAT2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-1, -0.33858267716535434, 0.33070866141732286, 1],
      [-1, -0.33858267716535434, 0.33070866141732286, 1],
      [-1, -0.33858267716535434, 0.33070866141732286, 1],
      [-1, -0.33858267716535434, 0.33070866141732286, 1],
      [-1, -0.33858267716535434, 0.33070866141732286, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_UINT8_MAT2", function () {
    const propertyName = "example_UINT8_MAT2";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [0, 84, 170, 255];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_UINT8_MAT2_array", function () {
    const propertyName = "example_variable_length_UINT8_MAT2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 84, 170, 255],
      [0, 84, 170, 255],
      [0, 84, 170, 255],
      [0, 84, 170, 255],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_UINT8_MAT2_array", function () {
    const propertyName = "example_fixed_length_UINT8_MAT2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 84, 170, 255],
      [0, 84, 170, 255],
      [0, 84, 170, 255],
      [0, 84, 170, 255],
      [0, 84, 170, 255],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_normalized_UINT8_MAT2", function () {
    const propertyName = "example_normalized_UINT8_MAT2";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [0, 0.32941176470588235, 0.6666666666666666, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_normalized_UINT8_MAT2_array", function () {
    const propertyName = "example_variable_length_normalized_UINT8_MAT2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 0.32941176470588235, 0.6666666666666666, 1],
      [0, 0.32941176470588235, 0.6666666666666666, 1],
      [0, 0.32941176470588235, 0.6666666666666666, 1],
      [0, 0.32941176470588235, 0.6666666666666666, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_normalized_UINT8_MAT2_array", function () {
    const propertyName = "example_fixed_length_normalized_UINT8_MAT2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 0.32941176470588235, 0.6666666666666666, 1],
      [0, 0.32941176470588235, 0.6666666666666666, 1],
      [0, 0.32941176470588235, 0.6666666666666666, 1],
      [0, 0.32941176470588235, 0.6666666666666666, 1],
      [0, 0.32941176470588235, 0.6666666666666666, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_INT16_MAT2", function () {
    const propertyName = "example_INT16_MAT2";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [-32768, -10923, 10922, 32767];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_INT16_MAT2_array", function () {
    const propertyName = "example_variable_length_INT16_MAT2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-32768, -10923, 10922, 32767],
      [-32768, -10923, 10922, 32767],
      [-32768, -10923, 10922, 32767],
      [-32768, -10923, 10922, 32767],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_INT16_MAT2_array", function () {
    const propertyName = "example_fixed_length_INT16_MAT2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-32768, -10923, 10922, 32767],
      [-32768, -10923, 10922, 32767],
      [-32768, -10923, 10922, 32767],
      [-32768, -10923, 10922, 32767],
      [-32768, -10923, 10922, 32767],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_normalized_INT16_MAT2", function () {
    const propertyName = "example_normalized_INT16_MAT2";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [-1, -0.33335367900631735, 0.33332316049684135, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_normalized_INT16_MAT2_array", function () {
    const propertyName = "example_variable_length_normalized_INT16_MAT2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-1, -0.33335367900631735, 0.33332316049684135, 1],
      [-1, -0.33335367900631735, 0.33332316049684135, 1],
      [-1, -0.33335367900631735, 0.33332316049684135, 1],
      [-1, -0.33335367900631735, 0.33332316049684135, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_normalized_INT16_MAT2_array", function () {
    const propertyName = "example_fixed_length_normalized_INT16_MAT2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-1, -0.33335367900631735, 0.33332316049684135, 1],
      [-1, -0.33335367900631735, 0.33332316049684135, 1],
      [-1, -0.33335367900631735, 0.33332316049684135, 1],
      [-1, -0.33335367900631735, 0.33332316049684135, 1],
      [-1, -0.33335367900631735, 0.33332316049684135, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_UINT16_MAT2", function () {
    const propertyName = "example_UINT16_MAT2";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [0, 21844, 43690, 65535];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_UINT16_MAT2_array", function () {
    const propertyName = "example_variable_length_UINT16_MAT2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 21844, 43690, 65535],
      [0, 21844, 43690, 65535],
      [0, 21844, 43690, 65535],
      [0, 21844, 43690, 65535],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_UINT16_MAT2_array", function () {
    const propertyName = "example_fixed_length_UINT16_MAT2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 21844, 43690, 65535],
      [0, 21844, 43690, 65535],
      [0, 21844, 43690, 65535],
      [0, 21844, 43690, 65535],
      [0, 21844, 43690, 65535],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_normalized_UINT16_MAT2", function () {
    const propertyName = "example_normalized_UINT16_MAT2";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [0, 0.3333180743114366, 0.6666666666666666, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_normalized_UINT16_MAT2_array", function () {
    const propertyName = "example_variable_length_normalized_UINT16_MAT2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 0.3333180743114366, 0.6666666666666666, 1],
      [0, 0.3333180743114366, 0.6666666666666666, 1],
      [0, 0.3333180743114366, 0.6666666666666666, 1],
      [0, 0.3333180743114366, 0.6666666666666666, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_normalized_UINT16_MAT2_array", function () {
    const propertyName = "example_fixed_length_normalized_UINT16_MAT2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 0.3333180743114366, 0.6666666666666666, 1],
      [0, 0.3333180743114366, 0.6666666666666666, 1],
      [0, 0.3333180743114366, 0.6666666666666666, 1],
      [0, 0.3333180743114366, 0.6666666666666666, 1],
      [0, 0.3333180743114366, 0.6666666666666666, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_INT32_MAT2", function () {
    const propertyName = "example_INT32_MAT2";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [-2147483648, -715827883, 715827882, 2147483647];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_INT32_MAT2_array", function () {
    const propertyName = "example_variable_length_INT32_MAT2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-2147483648, -715827883, 715827882, 2147483647],
      [-2147483648, -715827883, 715827882, 2147483647],
      [-2147483648, -715827883, 715827882, 2147483647],
      [-2147483648, -715827883, 715827882, 2147483647],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_INT32_MAT2_array", function () {
    const propertyName = "example_fixed_length_INT32_MAT2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-2147483648, -715827883, 715827882, 2147483647],
      [-2147483648, -715827883, 715827882, 2147483647],
      [-2147483648, -715827883, 715827882, 2147483647],
      [-2147483648, -715827883, 715827882, 2147483647],
      [-2147483648, -715827883, 715827882, 2147483647],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_normalized_INT32_MAT2", function () {
    const propertyName = "example_normalized_INT32_MAT2";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [-1, -0.3333333336437742, 0.3333333331781129, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_normalized_INT32_MAT2_array", function () {
    const propertyName = "example_variable_length_normalized_INT32_MAT2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-1, -0.3333333336437742, 0.3333333331781129, 1],
      [-1, -0.3333333336437742, 0.3333333331781129, 1],
      [-1, -0.3333333336437742, 0.3333333331781129, 1],
      [-1, -0.3333333336437742, 0.3333333331781129, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_normalized_INT32_MAT2_array", function () {
    const propertyName = "example_fixed_length_normalized_INT32_MAT2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-1, -0.3333333336437742, 0.3333333331781129, 1],
      [-1, -0.3333333336437742, 0.3333333331781129, 1],
      [-1, -0.3333333336437742, 0.3333333331781129, 1],
      [-1, -0.3333333336437742, 0.3333333331781129, 1],
      [-1, -0.3333333336437742, 0.3333333331781129, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_UINT32_MAT2", function () {
    const propertyName = "example_UINT32_MAT2";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [0, 1431655764, 2863311530, 4294967295];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_UINT32_MAT2_array", function () {
    const propertyName = "example_variable_length_UINT32_MAT2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 1431655764, 2863311530, 4294967295],
      [0, 1431655764, 2863311530, 4294967295],
      [0, 1431655764, 2863311530, 4294967295],
      [0, 1431655764, 2863311530, 4294967295],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_UINT32_MAT2_array", function () {
    const propertyName = "example_fixed_length_UINT32_MAT2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 1431655764, 2863311530, 4294967295],
      [0, 1431655764, 2863311530, 4294967295],
      [0, 1431655764, 2863311530, 4294967295],
      [0, 1431655764, 2863311530, 4294967295],
      [0, 1431655764, 2863311530, 4294967295],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_normalized_UINT32_MAT2", function () {
    const propertyName = "example_normalized_UINT32_MAT2";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [0, 0.33333333310050267, 0.6666666666666666, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_normalized_UINT32_MAT2_array", function () {
    const propertyName = "example_variable_length_normalized_UINT32_MAT2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 0.33333333310050267, 0.6666666666666666, 1],
      [0, 0.33333333310050267, 0.6666666666666666, 1],
      [0, 0.33333333310050267, 0.6666666666666666, 1],
      [0, 0.33333333310050267, 0.6666666666666666, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_normalized_UINT32_MAT2_array", function () {
    const propertyName = "example_fixed_length_normalized_UINT32_MAT2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 0.33333333310050267, 0.6666666666666666, 1],
      [0, 0.33333333310050267, 0.6666666666666666, 1],
      [0, 0.33333333310050267, 0.6666666666666666, 1],
      [0, 0.33333333310050267, 0.6666666666666666, 1],
      [0, 0.33333333310050267, 0.6666666666666666, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_INT64_MAT2", function () {
    const propertyName = "example_INT64_MAT2";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      -9223372036854776000n,
      -3074457346233150000n,
      3074457346233150000n,
      9223372036854776000n,
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_INT64_MAT2_array", function () {
    const propertyName = "example_variable_length_INT64_MAT2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [
        -9223372036854776000n,
        -3074457346233150000n,
        3074457346233150000n,
        9223372036854776000n,
      ],
      [
        -9223372036854776000n,
        -3074457346233150000n,
        3074457346233150000n,
        9223372036854776000n,
      ],
      [
        -9223372036854776000n,
        -3074457346233150000n,
        3074457346233150000n,
        9223372036854776000n,
      ],
      [
        -9223372036854776000n,
        -3074457346233150000n,
        3074457346233150000n,
        9223372036854776000n,
      ],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_INT64_MAT2_array", function () {
    const propertyName = "example_fixed_length_INT64_MAT2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [
        -9223372036854776000n,
        -3074457346233150000n,
        3074457346233150000n,
        9223372036854776000n,
      ],
      [
        -9223372036854776000n,
        -3074457346233150000n,
        3074457346233150000n,
        9223372036854776000n,
      ],
      [
        -9223372036854776000n,
        -3074457346233150000n,
        3074457346233150000n,
        9223372036854776000n,
      ],
      [
        -9223372036854776000n,
        -3074457346233150000n,
        3074457346233150000n,
        9223372036854776000n,
      ],
      [
        -9223372036854776000n,
        -3074457346233150000n,
        3074457346233150000n,
        9223372036854776000n,
      ],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_normalized_INT64_MAT2", function () {
    const propertyName = "example_normalized_INT64_MAT2";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [-1, -0.3333333334, 0.3333333334, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_normalized_INT64_MAT2_array", function () {
    const propertyName = "example_variable_length_normalized_INT64_MAT2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-1, -0.3333333334, 0.3333333334, 1],
      [-1, -0.3333333334, 0.3333333334, 1],
      [-1, -0.3333333334, 0.3333333334, 1],
      [-1, -0.3333333334, 0.3333333334, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_normalized_INT64_MAT2_array", function () {
    const propertyName = "example_fixed_length_normalized_INT64_MAT2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-1, -0.3333333334, 0.3333333334, 1],
      [-1, -0.3333333334, 0.3333333334, 1],
      [-1, -0.3333333334, 0.3333333334, 1],
      [-1, -0.3333333334, 0.3333333334, 1],
      [-1, -0.3333333334, 0.3333333334, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_UINT64_MAT2", function () {
    const propertyName = "example_UINT64_MAT2";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      0,
      6148914690621625000n,
      12297829383087925000n,
      18446744073709552000n,
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_UINT64_MAT2_array", function () {
    const propertyName = "example_variable_length_UINT64_MAT2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 6148914690621625000n, 12297829383087925000n, 18446744073709552000n],
      [0, 6148914690621625000n, 12297829383087925000n, 18446744073709552000n],
      [0, 6148914690621625000n, 12297829383087925000n, 18446744073709552000n],
      [0, 6148914690621625000n, 12297829383087925000n, 18446744073709552000n],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_UINT64_MAT2_array", function () {
    const propertyName = "example_fixed_length_UINT64_MAT2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 6148914690621625000n, 12297829383087925000n, 18446744073709552000n],
      [0, 6148914690621625000n, 12297829383087925000n, 18446744073709552000n],
      [0, 6148914690621625000n, 12297829383087925000n, 18446744073709552000n],
      [0, 6148914690621625000n, 12297829383087925000n, 18446744073709552000n],
      [0, 6148914690621625000n, 12297829383087925000n, 18446744073709552000n],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_normalized_UINT64_MAT2", function () {
    const propertyName = "example_normalized_UINT64_MAT2";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [0, 0.3333333333, 0.6666666667, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_normalized_UINT64_MAT2_array", function () {
    const propertyName = "example_variable_length_normalized_UINT64_MAT2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 0.3333333333, 0.6666666667, 1],
      [0, 0.3333333333, 0.6666666667, 1],
      [0, 0.3333333333, 0.6666666667, 1],
      [0, 0.3333333333, 0.6666666667, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_normalized_UINT64_MAT2_array", function () {
    const propertyName = "example_fixed_length_normalized_UINT64_MAT2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 0.3333333333, 0.6666666667, 1],
      [0, 0.3333333333, 0.6666666667, 1],
      [0, 0.3333333333, 0.6666666667, 1],
      [0, 0.3333333333, 0.6666666667, 1],
      [0, 0.3333333333, 0.6666666667, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_FLOAT32_MAT2", function () {
    const propertyName = "example_FLOAT32_MAT2";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [-1, -0.3333333334, 0.3333333334, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_FLOAT32_MAT2_array", function () {
    const propertyName = "example_variable_length_FLOAT32_MAT2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-1, -0.3333333334, 0.3333333334, 1],
      [-1, -0.3333333334, 0.3333333334, 1],
      [-1, -0.3333333334, 0.3333333334, 1],
      [-1, -0.3333333334, 0.3333333334, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_FLOAT32_MAT2_array", function () {
    const propertyName = "example_fixed_length_FLOAT32_MAT2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-1, -0.3333333334, 0.3333333334, 1],
      [-1, -0.3333333334, 0.3333333334, 1],
      [-1, -0.3333333334, 0.3333333334, 1],
      [-1, -0.3333333334, 0.3333333334, 1],
      [-1, -0.3333333334, 0.3333333334, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_FLOAT64_MAT2", function () {
    const propertyName = "example_FLOAT64_MAT2";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [-1, -0.3333333334, 0.3333333334, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_FLOAT64_MAT2_array", function () {
    const propertyName = "example_variable_length_FLOAT64_MAT2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-1, -0.3333333334, 0.3333333334, 1],
      [-1, -0.3333333334, 0.3333333334, 1],
      [-1, -0.3333333334, 0.3333333334, 1],
      [-1, -0.3333333334, 0.3333333334, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_FLOAT64_MAT2_array", function () {
    const propertyName = "example_fixed_length_FLOAT64_MAT2_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-1, -0.3333333334, 0.3333333334, 1],
      [-1, -0.3333333334, 0.3333333334, 1],
      [-1, -0.3333333334, 0.3333333334, 1],
      [-1, -0.3333333334, 0.3333333334, 1],
      [-1, -0.3333333334, 0.3333333334, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_INT8_MAT3", function () {
    const propertyName = "example_INT8_MAT3";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [-128, -96, -64, -32, 0, 31, 63, 95, 127];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_INT8_MAT3_array", function () {
    const propertyName = "example_variable_length_INT8_MAT3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-128, -96, -64, -32, 0, 31, 63, 95, 127],
      [-128, -96, -64, -32, 0, 31, 63, 95, 127],
      [-128, -96, -64, -32, 0, 31, 63, 95, 127],
      [-128, -96, -64, -32, 0, 31, 63, 95, 127],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_INT8_MAT3_array", function () {
    const propertyName = "example_fixed_length_INT8_MAT3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-128, -96, -64, -32, 0, 31, 63, 95, 127],
      [-128, -96, -64, -32, 0, 31, 63, 95, 127],
      [-128, -96, -64, -32, 0, 31, 63, 95, 127],
      [-128, -96, -64, -32, 0, 31, 63, 95, 127],
      [-128, -96, -64, -32, 0, 31, 63, 95, 127],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_normalized_INT8_MAT3", function () {
    const propertyName = "example_normalized_INT8_MAT3";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      -1, -0.7559055118110236, -0.5039370078740157, -0.25196850393700787, 0,
      0.2440944881889764, 0.49606299212598426, 0.7480314960629921, 1,
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_normalized_INT8_MAT3_array", function () {
    const propertyName = "example_variable_length_normalized_INT8_MAT3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [
        -1, -0.7559055118110236, -0.5039370078740157, -0.25196850393700787, 0,
        0.2440944881889764, 0.49606299212598426, 0.7480314960629921, 1,
      ],
      [
        -1, -0.7559055118110236, -0.5039370078740157, -0.25196850393700787, 0,
        0.2440944881889764, 0.49606299212598426, 0.7480314960629921, 1,
      ],
      [
        -1, -0.7559055118110236, -0.5039370078740157, -0.25196850393700787, 0,
        0.2440944881889764, 0.49606299212598426, 0.7480314960629921, 1,
      ],
      [
        -1, -0.7559055118110236, -0.5039370078740157, -0.25196850393700787, 0,
        0.2440944881889764, 0.49606299212598426, 0.7480314960629921, 1,
      ],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_normalized_INT8_MAT3_array", function () {
    const propertyName = "example_fixed_length_normalized_INT8_MAT3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [
        -1, -0.7559055118110236, -0.5039370078740157, -0.25196850393700787, 0,
        0.2440944881889764, 0.49606299212598426, 0.7480314960629921, 1,
      ],
      [
        -1, -0.7559055118110236, -0.5039370078740157, -0.25196850393700787, 0,
        0.2440944881889764, 0.49606299212598426, 0.7480314960629921, 1,
      ],
      [
        -1, -0.7559055118110236, -0.5039370078740157, -0.25196850393700787, 0,
        0.2440944881889764, 0.49606299212598426, 0.7480314960629921, 1,
      ],
      [
        -1, -0.7559055118110236, -0.5039370078740157, -0.25196850393700787, 0,
        0.2440944881889764, 0.49606299212598426, 0.7480314960629921, 1,
      ],
      [
        -1, -0.7559055118110236, -0.5039370078740157, -0.25196850393700787, 0,
        0.2440944881889764, 0.49606299212598426, 0.7480314960629921, 1,
      ],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_UINT8_MAT3", function () {
    const propertyName = "example_UINT8_MAT3";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [0, 31, 63, 95, 127, 159, 191, 223, 255];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_UINT8_MAT3_array", function () {
    const propertyName = "example_variable_length_UINT8_MAT3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 31, 63, 95, 127, 159, 191, 223, 255],
      [0, 31, 63, 95, 127, 159, 191, 223, 255],
      [0, 31, 63, 95, 127, 159, 191, 223, 255],
      [0, 31, 63, 95, 127, 159, 191, 223, 255],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_UINT8_MAT3_array", function () {
    const propertyName = "example_fixed_length_UINT8_MAT3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 31, 63, 95, 127, 159, 191, 223, 255],
      [0, 31, 63, 95, 127, 159, 191, 223, 255],
      [0, 31, 63, 95, 127, 159, 191, 223, 255],
      [0, 31, 63, 95, 127, 159, 191, 223, 255],
      [0, 31, 63, 95, 127, 159, 191, 223, 255],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_normalized_UINT8_MAT3", function () {
    const propertyName = "example_normalized_UINT8_MAT3";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      0, 0.12156862745098039, 0.24705882352941178, 0.37254901960784315,
      0.4980392156862745, 0.6235294117647059, 0.7490196078431373,
      0.8745098039215686, 1,
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_normalized_UINT8_MAT3_array", function () {
    const propertyName = "example_variable_length_normalized_UINT8_MAT3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [
        0, 0.12156862745098039, 0.24705882352941178, 0.37254901960784315,
        0.4980392156862745, 0.6235294117647059, 0.7490196078431373,
        0.8745098039215686, 1,
      ],
      [
        0, 0.12156862745098039, 0.24705882352941178, 0.37254901960784315,
        0.4980392156862745, 0.6235294117647059, 0.7490196078431373,
        0.8745098039215686, 1,
      ],
      [
        0, 0.12156862745098039, 0.24705882352941178, 0.37254901960784315,
        0.4980392156862745, 0.6235294117647059, 0.7490196078431373,
        0.8745098039215686, 1,
      ],
      [
        0, 0.12156862745098039, 0.24705882352941178, 0.37254901960784315,
        0.4980392156862745, 0.6235294117647059, 0.7490196078431373,
        0.8745098039215686, 1,
      ],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_normalized_UINT8_MAT3_array", function () {
    const propertyName = "example_fixed_length_normalized_UINT8_MAT3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [
        0, 0.12156862745098039, 0.24705882352941178, 0.37254901960784315,
        0.4980392156862745, 0.6235294117647059, 0.7490196078431373,
        0.8745098039215686, 1,
      ],
      [
        0, 0.12156862745098039, 0.24705882352941178, 0.37254901960784315,
        0.4980392156862745, 0.6235294117647059, 0.7490196078431373,
        0.8745098039215686, 1,
      ],
      [
        0, 0.12156862745098039, 0.24705882352941178, 0.37254901960784315,
        0.4980392156862745, 0.6235294117647059, 0.7490196078431373,
        0.8745098039215686, 1,
      ],
      [
        0, 0.12156862745098039, 0.24705882352941178, 0.37254901960784315,
        0.4980392156862745, 0.6235294117647059, 0.7490196078431373,
        0.8745098039215686, 1,
      ],
      [
        0, 0.12156862745098039, 0.24705882352941178, 0.37254901960784315,
        0.4980392156862745, 0.6235294117647059, 0.7490196078431373,
        0.8745098039215686, 1,
      ],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_INT16_MAT3", function () {
    const propertyName = "example_INT16_MAT3";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      -32768, -24576, -16384, -8192, 0, 8191, 16383, 24575, 32767,
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_INT16_MAT3_array", function () {
    const propertyName = "example_variable_length_INT16_MAT3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-32768, -24576, -16384, -8192, 0, 8191, 16383, 24575, 32767],
      [-32768, -24576, -16384, -8192, 0, 8191, 16383, 24575, 32767],
      [-32768, -24576, -16384, -8192, 0, 8191, 16383, 24575, 32767],
      [-32768, -24576, -16384, -8192, 0, 8191, 16383, 24575, 32767],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_INT16_MAT3_array", function () {
    const propertyName = "example_fixed_length_INT16_MAT3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-32768, -24576, -16384, -8192, 0, 8191, 16383, 24575, 32767],
      [-32768, -24576, -16384, -8192, 0, 8191, 16383, 24575, 32767],
      [-32768, -24576, -16384, -8192, 0, 8191, 16383, 24575, 32767],
      [-32768, -24576, -16384, -8192, 0, 8191, 16383, 24575, 32767],
      [-32768, -24576, -16384, -8192, 0, 8191, 16383, 24575, 32767],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_normalized_INT16_MAT3", function () {
    const propertyName = "example_normalized_INT16_MAT3";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      -1, -0.750022888882107, -0.500015259254738, -0.250007629627369, 0,
      0.249977111117893, 0.499984740745262, 0.749992370372631, 1,
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_normalized_INT16_MAT3_array", function () {
    const propertyName = "example_variable_length_normalized_INT16_MAT3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [
        -1, -0.750022888882107, -0.500015259254738, -0.250007629627369, 0,
        0.249977111117893, 0.499984740745262, 0.749992370372631, 1,
      ],
      [
        -1, -0.750022888882107, -0.500015259254738, -0.250007629627369, 0,
        0.249977111117893, 0.499984740745262, 0.749992370372631, 1,
      ],
      [
        -1, -0.750022888882107, -0.500015259254738, -0.250007629627369, 0,
        0.249977111117893, 0.499984740745262, 0.749992370372631, 1,
      ],
      [
        -1, -0.750022888882107, -0.500015259254738, -0.250007629627369, 0,
        0.249977111117893, 0.499984740745262, 0.749992370372631, 1,
      ],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_normalized_INT16_MAT3_array", function () {
    const propertyName = "example_fixed_length_normalized_INT16_MAT3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [
        -1, -0.750022888882107, -0.500015259254738, -0.250007629627369, 0,
        0.249977111117893, 0.499984740745262, 0.749992370372631, 1,
      ],
      [
        -1, -0.750022888882107, -0.500015259254738, -0.250007629627369, 0,
        0.249977111117893, 0.499984740745262, 0.749992370372631, 1,
      ],
      [
        -1, -0.750022888882107, -0.500015259254738, -0.250007629627369, 0,
        0.249977111117893, 0.499984740745262, 0.749992370372631, 1,
      ],
      [
        -1, -0.750022888882107, -0.500015259254738, -0.250007629627369, 0,
        0.249977111117893, 0.499984740745262, 0.749992370372631, 1,
      ],
      [
        -1, -0.750022888882107, -0.500015259254738, -0.250007629627369, 0,
        0.249977111117893, 0.499984740745262, 0.749992370372631, 1,
      ],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_UINT16_MAT3", function () {
    const propertyName = "example_UINT16_MAT3";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [0, 8191, 16383, 24575, 32767, 40959, 49151, 57343, 65535];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_UINT16_MAT3_array", function () {
    const propertyName = "example_variable_length_UINT16_MAT3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 8191, 16383, 24575, 32767, 40959, 49151, 57343, 65535],
      [0, 8191, 16383, 24575, 32767, 40959, 49151, 57343, 65535],
      [0, 8191, 16383, 24575, 32767, 40959, 49151, 57343, 65535],
      [0, 8191, 16383, 24575, 32767, 40959, 49151, 57343, 65535],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_UINT16_MAT3_array", function () {
    const propertyName = "example_fixed_length_UINT16_MAT3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 8191, 16383, 24575, 32767, 40959, 49151, 57343, 65535],
      [0, 8191, 16383, 24575, 32767, 40959, 49151, 57343, 65535],
      [0, 8191, 16383, 24575, 32767, 40959, 49151, 57343, 65535],
      [0, 8191, 16383, 24575, 32767, 40959, 49151, 57343, 65535],
      [0, 8191, 16383, 24575, 32767, 40959, 49151, 57343, 65535],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_normalized_UINT16_MAT3", function () {
    const propertyName = "example_normalized_UINT16_MAT3";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      0, 0.12498664835584039, 0.24998855573357748, 0.37499046311131456,
      0.49999237048905165, 0.6249942778667887, 0.7499961852445258,
      0.8749980926222629, 1,
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_normalized_UINT16_MAT3_array", function () {
    const propertyName = "example_variable_length_normalized_UINT16_MAT3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [
        0, 0.12498664835584039, 0.24998855573357748, 0.37499046311131456,
        0.49999237048905165, 0.6249942778667887, 0.7499961852445258,
        0.8749980926222629, 1,
      ],
      [
        0, 0.12498664835584039, 0.24998855573357748, 0.37499046311131456,
        0.49999237048905165, 0.6249942778667887, 0.7499961852445258,
        0.8749980926222629, 1,
      ],
      [
        0, 0.12498664835584039, 0.24998855573357748, 0.37499046311131456,
        0.49999237048905165, 0.6249942778667887, 0.7499961852445258,
        0.8749980926222629, 1,
      ],
      [
        0, 0.12498664835584039, 0.24998855573357748, 0.37499046311131456,
        0.49999237048905165, 0.6249942778667887, 0.7499961852445258,
        0.8749980926222629, 1,
      ],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_normalized_UINT16_MAT3_array", function () {
    const propertyName = "example_fixed_length_normalized_UINT16_MAT3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [
        0, 0.12498664835584039, 0.24998855573357748, 0.37499046311131456,
        0.49999237048905165, 0.6249942778667887, 0.7499961852445258,
        0.8749980926222629, 1,
      ],
      [
        0, 0.12498664835584039, 0.24998855573357748, 0.37499046311131456,
        0.49999237048905165, 0.6249942778667887, 0.7499961852445258,
        0.8749980926222629, 1,
      ],
      [
        0, 0.12498664835584039, 0.24998855573357748, 0.37499046311131456,
        0.49999237048905165, 0.6249942778667887, 0.7499961852445258,
        0.8749980926222629, 1,
      ],
      [
        0, 0.12498664835584039, 0.24998855573357748, 0.37499046311131456,
        0.49999237048905165, 0.6249942778667887, 0.7499961852445258,
        0.8749980926222629, 1,
      ],
      [
        0, 0.12498664835584039, 0.24998855573357748, 0.37499046311131456,
        0.49999237048905165, 0.6249942778667887, 0.7499961852445258,
        0.8749980926222629, 1,
      ],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_INT32_MAT3", function () {
    const propertyName = "example_INT32_MAT3";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      -2147483648, -1610612736, -1073741824, -536870912, 0, 536870911,
      1073741823, 1610612735, 2147483647,
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_INT32_MAT3_array", function () {
    const propertyName = "example_variable_length_INT32_MAT3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [
        -2147483648, -1610612736, -1073741824, -536870912, 0, 536870911,
        1073741823, 1610612735, 2147483647,
      ],
      [
        -2147483648, -1610612736, -1073741824, -536870912, 0, 536870911,
        1073741823, 1610612735, 2147483647,
      ],
      [
        -2147483648, -1610612736, -1073741824, -536870912, 0, 536870911,
        1073741823, 1610612735, 2147483647,
      ],
      [
        -2147483648, -1610612736, -1073741824, -536870912, 0, 536870911,
        1073741823, 1610612735, 2147483647,
      ],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_INT32_MAT3_array", function () {
    const propertyName = "example_fixed_length_INT32_MAT3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [
        -2147483648, -1610612736, -1073741824, -536870912, 0, 536870911,
        1073741823, 1610612735, 2147483647,
      ],
      [
        -2147483648, -1610612736, -1073741824, -536870912, 0, 536870911,
        1073741823, 1610612735, 2147483647,
      ],
      [
        -2147483648, -1610612736, -1073741824, -536870912, 0, 536870911,
        1073741823, 1610612735, 2147483647,
      ],
      [
        -2147483648, -1610612736, -1073741824, -536870912, 0, 536870911,
        1073741823, 1610612735, 2147483647,
      ],
      [
        -2147483648, -1610612736, -1073741824, -536870912, 0, 536870911,
        1073741823, 1610612735, 2147483647,
      ],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_normalized_INT32_MAT3", function () {
    const propertyName = "example_normalized_INT32_MAT3";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      -1, -0.750000000349246, -0.5000000002328306, -0.2500000001164153, 0,
      0.24999999965075403, 0.49999999976716936, 0.7499999998835847, 1,
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_normalized_INT32_MAT3_array", function () {
    const propertyName = "example_variable_length_normalized_INT32_MAT3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [
        -1, -0.750000000349246, -0.5000000002328306, -0.2500000001164153, 0,
        0.24999999965075403, 0.49999999976716936, 0.7499999998835847, 1,
      ],
      [
        -1, -0.750000000349246, -0.5000000002328306, -0.2500000001164153, 0,
        0.24999999965075403, 0.49999999976716936, 0.7499999998835847, 1,
      ],
      [
        -1, -0.750000000349246, -0.5000000002328306, -0.2500000001164153, 0,
        0.24999999965075403, 0.49999999976716936, 0.7499999998835847, 1,
      ],
      [
        -1, -0.750000000349246, -0.5000000002328306, -0.2500000001164153, 0,
        0.24999999965075403, 0.49999999976716936, 0.7499999998835847, 1,
      ],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_normalized_INT32_MAT3_array", function () {
    const propertyName = "example_fixed_length_normalized_INT32_MAT3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [
        -1, -0.750000000349246, -0.5000000002328306, -0.2500000001164153, 0,
        0.24999999965075403, 0.49999999976716936, 0.7499999998835847, 1,
      ],
      [
        -1, -0.750000000349246, -0.5000000002328306, -0.2500000001164153, 0,
        0.24999999965075403, 0.49999999976716936, 0.7499999998835847, 1,
      ],
      [
        -1, -0.750000000349246, -0.5000000002328306, -0.2500000001164153, 0,
        0.24999999965075403, 0.49999999976716936, 0.7499999998835847, 1,
      ],
      [
        -1, -0.750000000349246, -0.5000000002328306, -0.2500000001164153, 0,
        0.24999999965075403, 0.49999999976716936, 0.7499999998835847, 1,
      ],
      [
        -1, -0.750000000349246, -0.5000000002328306, -0.2500000001164153, 0,
        0.24999999965075403, 0.49999999976716936, 0.7499999998835847, 1,
      ],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_UINT32_MAT3", function () {
    const propertyName = "example_UINT32_MAT3";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      0, 536870911, 1073741823, 1610612735, 2147483647, 2684354559, 3221225471,
      3758096383, 4294967295,
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_UINT32_MAT3_array", function () {
    const propertyName = "example_variable_length_UINT32_MAT3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [
        0, 536870911, 1073741823, 1610612735, 2147483647, 2684354559,
        3221225471, 3758096383, 4294967295,
      ],
      [
        0, 536870911, 1073741823, 1610612735, 2147483647, 2684354559,
        3221225471, 3758096383, 4294967295,
      ],
      [
        0, 536870911, 1073741823, 1610612735, 2147483647, 2684354559,
        3221225471, 3758096383, 4294967295,
      ],
      [
        0, 536870911, 1073741823, 1610612735, 2147483647, 2684354559,
        3221225471, 3758096383, 4294967295,
      ],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_UINT32_MAT3_array", function () {
    const propertyName = "example_fixed_length_UINT32_MAT3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [
        0, 536870911, 1073741823, 1610612735, 2147483647, 2684354559,
        3221225471, 3758096383, 4294967295,
      ],
      [
        0, 536870911, 1073741823, 1610612735, 2147483647, 2684354559,
        3221225471, 3758096383, 4294967295,
      ],
      [
        0, 536870911, 1073741823, 1610612735, 2147483647, 2684354559,
        3221225471, 3758096383, 4294967295,
      ],
      [
        0, 536870911, 1073741823, 1610612735, 2147483647, 2684354559,
        3221225471, 3758096383, 4294967295,
      ],
      [
        0, 536870911, 1073741823, 1610612735, 2147483647, 2684354559,
        3221225471, 3758096383, 4294967295,
      ],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_normalized_UINT32_MAT3", function () {
    const propertyName = "example_normalized_UINT32_MAT3";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      0, 0.12499999979627319, 0.24999999982537702, 0.37499999985448085,
      0.4999999998835847, 0.6249999999126885, 0.7499999999417923,
      0.8749999999708962, 1,
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_normalized_UINT32_MAT3_array", function () {
    const propertyName = "example_variable_length_normalized_UINT32_MAT3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [
        0, 0.12499999979627319, 0.24999999982537702, 0.37499999985448085,
        0.4999999998835847, 0.6249999999126885, 0.7499999999417923,
        0.8749999999708962, 1,
      ],
      [
        0, 0.12499999979627319, 0.24999999982537702, 0.37499999985448085,
        0.4999999998835847, 0.6249999999126885, 0.7499999999417923,
        0.8749999999708962, 1,
      ],
      [
        0, 0.12499999979627319, 0.24999999982537702, 0.37499999985448085,
        0.4999999998835847, 0.6249999999126885, 0.7499999999417923,
        0.8749999999708962, 1,
      ],
      [
        0, 0.12499999979627319, 0.24999999982537702, 0.37499999985448085,
        0.4999999998835847, 0.6249999999126885, 0.7499999999417923,
        0.8749999999708962, 1,
      ],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_normalized_UINT32_MAT3_array", function () {
    const propertyName = "example_fixed_length_normalized_UINT32_MAT3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [
        0, 0.12499999979627319, 0.24999999982537702, 0.37499999985448085,
        0.4999999998835847, 0.6249999999126885, 0.7499999999417923,
        0.8749999999708962, 1,
      ],
      [
        0, 0.12499999979627319, 0.24999999982537702, 0.37499999985448085,
        0.4999999998835847, 0.6249999999126885, 0.7499999999417923,
        0.8749999999708962, 1,
      ],
      [
        0, 0.12499999979627319, 0.24999999982537702, 0.37499999985448085,
        0.4999999998835847, 0.6249999999126885, 0.7499999999417923,
        0.8749999999708962, 1,
      ],
      [
        0, 0.12499999979627319, 0.24999999982537702, 0.37499999985448085,
        0.4999999998835847, 0.6249999999126885, 0.7499999999417923,
        0.8749999999708962, 1,
      ],
      [
        0, 0.12499999979627319, 0.24999999982537702, 0.37499999985448085,
        0.4999999998835847, 0.6249999999126885, 0.7499999999417923,
        0.8749999999708962, 1,
      ],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_INT64_MAT3", function () {
    const propertyName = "example_INT64_MAT3";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      -9223372036854776000n,
      -6917529027641082000n,
      -4611686018427388000n,
      -2305843009213694000n,
      0,
      2305843009213694000n,
      4611686018427388000n,
      6917529027641082000n,
      9223372036854776000n,
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_INT64_MAT3_array", function () {
    const propertyName = "example_variable_length_INT64_MAT3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [
        -9223372036854776000n,
        -6917529027641082000n,
        -4611686018427388000n,
        -2305843009213694000n,
        0,
        2305843009213694000n,
        4611686018427388000n,
        6917529027641082000n,
        9223372036854776000n,
      ],
      [
        -9223372036854776000n,
        -6917529027641082000n,
        -4611686018427388000n,
        -2305843009213694000n,
        0,
        2305843009213694000n,
        4611686018427388000n,
        6917529027641082000n,
        9223372036854776000n,
      ],
      [
        -9223372036854776000n,
        -6917529027641082000n,
        -4611686018427388000n,
        -2305843009213694000n,
        0,
        2305843009213694000n,
        4611686018427388000n,
        6917529027641082000n,
        9223372036854776000n,
      ],
      [
        -9223372036854776000n,
        -6917529027641082000n,
        -4611686018427388000n,
        -2305843009213694000n,
        0,
        2305843009213694000n,
        4611686018427388000n,
        6917529027641082000n,
        9223372036854776000n,
      ],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_INT64_MAT3_array", function () {
    const propertyName = "example_fixed_length_INT64_MAT3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [
        -9223372036854776000n,
        -6917529027641082000n,
        -4611686018427388000n,
        -2305843009213694000n,
        0,
        2305843009213694000n,
        4611686018427388000n,
        6917529027641082000n,
        9223372036854776000n,
      ],
      [
        -9223372036854776000n,
        -6917529027641082000n,
        -4611686018427388000n,
        -2305843009213694000n,
        0,
        2305843009213694000n,
        4611686018427388000n,
        6917529027641082000n,
        9223372036854776000n,
      ],
      [
        -9223372036854776000n,
        -6917529027641082000n,
        -4611686018427388000n,
        -2305843009213694000n,
        0,
        2305843009213694000n,
        4611686018427388000n,
        6917529027641082000n,
        9223372036854776000n,
      ],
      [
        -9223372036854776000n,
        -6917529027641082000n,
        -4611686018427388000n,
        -2305843009213694000n,
        0,
        2305843009213694000n,
        4611686018427388000n,
        6917529027641082000n,
        9223372036854776000n,
      ],
      [
        -9223372036854776000n,
        -6917529027641082000n,
        -4611686018427388000n,
        -2305843009213694000n,
        0,
        2305843009213694000n,
        4611686018427388000n,
        6917529027641082000n,
        9223372036854776000n,
      ],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_normalized_INT64_MAT3", function () {
    const propertyName = "example_normalized_INT64_MAT3";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_normalized_INT64_MAT3_array", function () {
    const propertyName = "example_variable_length_normalized_INT64_MAT3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1],
      [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1],
      [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1],
      [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_normalized_INT64_MAT3_array", function () {
    const propertyName = "example_fixed_length_normalized_INT64_MAT3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1],
      [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1],
      [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1],
      [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1],
      [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_UINT64_MAT3", function () {
    const propertyName = "example_UINT64_MAT3";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      0,
      2305843009213694000n,
      4611686018427388000n,
      6917529027641082000n,
      9223372036854776000n,
      11529215046068470000n,
      13835058055282164000n,
      16140901064495858000n,
      18446744073709552000n,
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_UINT64_MAT3_array", function () {
    const propertyName = "example_variable_length_UINT64_MAT3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [
        0,
        2305843009213694000n,
        4611686018427388000n,
        6917529027641082000n,
        9223372036854776000n,
        11529215046068470000n,
        13835058055282164000n,
        16140901064495858000n,
        18446744073709552000n,
      ],
      [
        0,
        2305843009213694000n,
        4611686018427388000n,
        6917529027641082000n,
        9223372036854776000n,
        11529215046068470000n,
        13835058055282164000n,
        16140901064495858000n,
        18446744073709552000n,
      ],
      [
        0,
        2305843009213694000n,
        4611686018427388000n,
        6917529027641082000n,
        9223372036854776000n,
        11529215046068470000n,
        13835058055282164000n,
        16140901064495858000n,
        18446744073709552000n,
      ],
      [
        0,
        2305843009213694000n,
        4611686018427388000n,
        6917529027641082000n,
        9223372036854776000n,
        11529215046068470000n,
        13835058055282164000n,
        16140901064495858000n,
        18446744073709552000n,
      ],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_UINT64_MAT3_array", function () {
    const propertyName = "example_fixed_length_UINT64_MAT3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [
        0,
        2305843009213694000n,
        4611686018427388000n,
        6917529027641082000n,
        9223372036854776000n,
        11529215046068470000n,
        13835058055282164000n,
        16140901064495858000n,
        18446744073709552000n,
      ],
      [
        0,
        2305843009213694000n,
        4611686018427388000n,
        6917529027641082000n,
        9223372036854776000n,
        11529215046068470000n,
        13835058055282164000n,
        16140901064495858000n,
        18446744073709552000n,
      ],
      [
        0,
        2305843009213694000n,
        4611686018427388000n,
        6917529027641082000n,
        9223372036854776000n,
        11529215046068470000n,
        13835058055282164000n,
        16140901064495858000n,
        18446744073709552000n,
      ],
      [
        0,
        2305843009213694000n,
        4611686018427388000n,
        6917529027641082000n,
        9223372036854776000n,
        11529215046068470000n,
        13835058055282164000n,
        16140901064495858000n,
        18446744073709552000n,
      ],
      [
        0,
        2305843009213694000n,
        4611686018427388000n,
        6917529027641082000n,
        9223372036854776000n,
        11529215046068470000n,
        13835058055282164000n,
        16140901064495858000n,
        18446744073709552000n,
      ],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_normalized_UINT64_MAT3", function () {
    const propertyName = "example_normalized_UINT64_MAT3";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_normalized_UINT64_MAT3_array", function () {
    const propertyName = "example_variable_length_normalized_UINT64_MAT3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1],
      [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1],
      [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1],
      [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_normalized_UINT64_MAT3_array", function () {
    const propertyName = "example_fixed_length_normalized_UINT64_MAT3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1],
      [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1],
      [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1],
      [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1],
      [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_FLOAT32_MAT3", function () {
    const propertyName = "example_FLOAT32_MAT3";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_FLOAT32_MAT3_array", function () {
    const propertyName = "example_variable_length_FLOAT32_MAT3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1],
      [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1],
      [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1],
      [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_FLOAT32_MAT3_array", function () {
    const propertyName = "example_fixed_length_FLOAT32_MAT3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1],
      [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1],
      [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1],
      [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1],
      [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_FLOAT64_MAT3", function () {
    const propertyName = "example_FLOAT64_MAT3";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_FLOAT64_MAT3_array", function () {
    const propertyName = "example_variable_length_FLOAT64_MAT3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1],
      [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1],
      [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1],
      [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_FLOAT64_MAT3_array", function () {
    const propertyName = "example_fixed_length_FLOAT64_MAT3_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1],
      [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1],
      [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1],
      [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1],
      [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_INT8_MAT4", function () {
    const propertyName = "example_INT8_MAT4";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      -128, -110, -94, -77, -59, -43, -26, -8, 7, 25, 42, 58, 76, 93, 109, 127,
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_INT8_MAT4_array", function () {
    const propertyName = "example_variable_length_INT8_MAT4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [
        -128, -110, -94, -77, -59, -43, -26, -8, 7, 25, 42, 58, 76, 93, 109,
        127,
      ],
      [
        -128, -110, -94, -77, -59, -43, -26, -8, 7, 25, 42, 58, 76, 93, 109,
        127,
      ],
      [
        -128, -110, -94, -77, -59, -43, -26, -8, 7, 25, 42, 58, 76, 93, 109,
        127,
      ],
      [
        -128, -110, -94, -77, -59, -43, -26, -8, 7, 25, 42, 58, 76, 93, 109,
        127,
      ],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_INT8_MAT4_array", function () {
    const propertyName = "example_fixed_length_INT8_MAT4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [
        -128, -110, -94, -77, -59, -43, -26, -8, 7, 25, 42, 58, 76, 93, 109,
        127,
      ],
      [
        -128, -110, -94, -77, -59, -43, -26, -8, 7, 25, 42, 58, 76, 93, 109,
        127,
      ],
      [
        -128, -110, -94, -77, -59, -43, -26, -8, 7, 25, 42, 58, 76, 93, 109,
        127,
      ],
      [
        -128, -110, -94, -77, -59, -43, -26, -8, 7, 25, 42, 58, 76, 93, 109,
        127,
      ],
      [
        -128, -110, -94, -77, -59, -43, -26, -8, 7, 25, 42, 58, 76, 93, 109,
        127,
      ],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_normalized_INT8_MAT4", function () {
    const propertyName = "example_normalized_INT8_MAT4";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      -1, -0.8661417322834646, -0.7401574803149606, -0.6062992125984252,
      -0.4645669291338583, -0.33858267716535434, -0.2047244094488189,
      -0.06299212598425197, 0.05511811023622047, 0.1968503937007874,
      0.33070866141732286, 0.4566929133858268, 0.5984251968503937,
      0.7322834645669292, 0.8582677165354331, 1,
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_normalized_INT8_MAT4_array", function () {
    const propertyName = "example_variable_length_normalized_INT8_MAT4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [
        -1, -0.8661417322834646, -0.7401574803149606, -0.6062992125984252,
        -0.4645669291338583, -0.33858267716535434, -0.2047244094488189,
        -0.06299212598425197, 0.05511811023622047, 0.1968503937007874,
        0.33070866141732286, 0.4566929133858268, 0.5984251968503937,
        0.7322834645669292, 0.8582677165354331, 1,
      ],
      [
        -1, -0.8661417322834646, -0.7401574803149606, -0.6062992125984252,
        -0.4645669291338583, -0.33858267716535434, -0.2047244094488189,
        -0.06299212598425197, 0.05511811023622047, 0.1968503937007874,
        0.33070866141732286, 0.4566929133858268, 0.5984251968503937,
        0.7322834645669292, 0.8582677165354331, 1,
      ],
      [
        -1, -0.8661417322834646, -0.7401574803149606, -0.6062992125984252,
        -0.4645669291338583, -0.33858267716535434, -0.2047244094488189,
        -0.06299212598425197, 0.05511811023622047, 0.1968503937007874,
        0.33070866141732286, 0.4566929133858268, 0.5984251968503937,
        0.7322834645669292, 0.8582677165354331, 1,
      ],
      [
        -1, -0.8661417322834646, -0.7401574803149606, -0.6062992125984252,
        -0.4645669291338583, -0.33858267716535434, -0.2047244094488189,
        -0.06299212598425197, 0.05511811023622047, 0.1968503937007874,
        0.33070866141732286, 0.4566929133858268, 0.5984251968503937,
        0.7322834645669292, 0.8582677165354331, 1,
      ],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_normalized_INT8_MAT4_array", function () {
    const propertyName = "example_fixed_length_normalized_INT8_MAT4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [
        -1, -0.8661417322834646, -0.7401574803149606, -0.6062992125984252,
        -0.4645669291338583, -0.33858267716535434, -0.2047244094488189,
        -0.06299212598425197, 0.05511811023622047, 0.1968503937007874,
        0.33070866141732286, 0.4566929133858268, 0.5984251968503937,
        0.7322834645669292, 0.8582677165354331, 1,
      ],
      [
        -1, -0.8661417322834646, -0.7401574803149606, -0.6062992125984252,
        -0.4645669291338583, -0.33858267716535434, -0.2047244094488189,
        -0.06299212598425197, 0.05511811023622047, 0.1968503937007874,
        0.33070866141732286, 0.4566929133858268, 0.5984251968503937,
        0.7322834645669292, 0.8582677165354331, 1,
      ],
      [
        -1, -0.8661417322834646, -0.7401574803149606, -0.6062992125984252,
        -0.4645669291338583, -0.33858267716535434, -0.2047244094488189,
        -0.06299212598425197, 0.05511811023622047, 0.1968503937007874,
        0.33070866141732286, 0.4566929133858268, 0.5984251968503937,
        0.7322834645669292, 0.8582677165354331, 1,
      ],
      [
        -1, -0.8661417322834646, -0.7401574803149606, -0.6062992125984252,
        -0.4645669291338583, -0.33858267716535434, -0.2047244094488189,
        -0.06299212598425197, 0.05511811023622047, 0.1968503937007874,
        0.33070866141732286, 0.4566929133858268, 0.5984251968503937,
        0.7322834645669292, 0.8582677165354331, 1,
      ],
      [
        -1, -0.8661417322834646, -0.7401574803149606, -0.6062992125984252,
        -0.4645669291338583, -0.33858267716535434, -0.2047244094488189,
        -0.06299212598425197, 0.05511811023622047, 0.1968503937007874,
        0.33070866141732286, 0.4566929133858268, 0.5984251968503937,
        0.7322834645669292, 0.8582677165354331, 1,
      ],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_UINT8_MAT4", function () {
    const propertyName = "example_UINT8_MAT4";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      0, 17, 33, 51, 68, 84, 102, 119, 135, 153, 170, 186, 204, 221, 237, 255,
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_UINT8_MAT4_array", function () {
    const propertyName = "example_variable_length_UINT8_MAT4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 17, 33, 51, 68, 84, 102, 119, 135, 153, 170, 186, 204, 221, 237, 255],
      [0, 17, 33, 51, 68, 84, 102, 119, 135, 153, 170, 186, 204, 221, 237, 255],
      [0, 17, 33, 51, 68, 84, 102, 119, 135, 153, 170, 186, 204, 221, 237, 255],
      [0, 17, 33, 51, 68, 84, 102, 119, 135, 153, 170, 186, 204, 221, 237, 255],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_UINT8_MAT4_array", function () {
    const propertyName = "example_fixed_length_UINT8_MAT4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [0, 17, 33, 51, 68, 84, 102, 119, 135, 153, 170, 186, 204, 221, 237, 255],
      [0, 17, 33, 51, 68, 84, 102, 119, 135, 153, 170, 186, 204, 221, 237, 255],
      [0, 17, 33, 51, 68, 84, 102, 119, 135, 153, 170, 186, 204, 221, 237, 255],
      [0, 17, 33, 51, 68, 84, 102, 119, 135, 153, 170, 186, 204, 221, 237, 255],
      [0, 17, 33, 51, 68, 84, 102, 119, 135, 153, 170, 186, 204, 221, 237, 255],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_normalized_UINT8_MAT4", function () {
    const propertyName = "example_normalized_UINT8_MAT4";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      0, 0.06666666666666667, 0.12941176470588237, 0.2, 0.26666666666666666,
      0.32941176470588235, 0.4, 0.4666666666666667, 0.5294117647058824, 0.6,
      0.6666666666666666, 0.7294117647058823, 0.8, 0.8666666666666667,
      0.9294117647058824, 1,
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_normalized_UINT8_MAT4_array", function () {
    const propertyName = "example_variable_length_normalized_UINT8_MAT4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [
        0, 0.06666666666666667, 0.12941176470588237, 0.2, 0.26666666666666666,
        0.32941176470588235, 0.4, 0.4666666666666667, 0.5294117647058824, 0.6,
        0.6666666666666666, 0.7294117647058823, 0.8, 0.8666666666666667,
        0.9294117647058824, 1,
      ],
      [
        0, 0.06666666666666667, 0.12941176470588237, 0.2, 0.26666666666666666,
        0.32941176470588235, 0.4, 0.4666666666666667, 0.5294117647058824, 0.6,
        0.6666666666666666, 0.7294117647058823, 0.8, 0.8666666666666667,
        0.9294117647058824, 1,
      ],
      [
        0, 0.06666666666666667, 0.12941176470588237, 0.2, 0.26666666666666666,
        0.32941176470588235, 0.4, 0.4666666666666667, 0.5294117647058824, 0.6,
        0.6666666666666666, 0.7294117647058823, 0.8, 0.8666666666666667,
        0.9294117647058824, 1,
      ],
      [
        0, 0.06666666666666667, 0.12941176470588237, 0.2, 0.26666666666666666,
        0.32941176470588235, 0.4, 0.4666666666666667, 0.5294117647058824, 0.6,
        0.6666666666666666, 0.7294117647058823, 0.8, 0.8666666666666667,
        0.9294117647058824, 1,
      ],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_normalized_UINT8_MAT4_array", function () {
    const propertyName = "example_fixed_length_normalized_UINT8_MAT4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [
        0, 0.06666666666666667, 0.12941176470588237, 0.2, 0.26666666666666666,
        0.32941176470588235, 0.4, 0.4666666666666667, 0.5294117647058824, 0.6,
        0.6666666666666666, 0.7294117647058823, 0.8, 0.8666666666666667,
        0.9294117647058824, 1,
      ],
      [
        0, 0.06666666666666667, 0.12941176470588237, 0.2, 0.26666666666666666,
        0.32941176470588235, 0.4, 0.4666666666666667, 0.5294117647058824, 0.6,
        0.6666666666666666, 0.7294117647058823, 0.8, 0.8666666666666667,
        0.9294117647058824, 1,
      ],
      [
        0, 0.06666666666666667, 0.12941176470588237, 0.2, 0.26666666666666666,
        0.32941176470588235, 0.4, 0.4666666666666667, 0.5294117647058824, 0.6,
        0.6666666666666666, 0.7294117647058823, 0.8, 0.8666666666666667,
        0.9294117647058824, 1,
      ],
      [
        0, 0.06666666666666667, 0.12941176470588237, 0.2, 0.26666666666666666,
        0.32941176470588235, 0.4, 0.4666666666666667, 0.5294117647058824, 0.6,
        0.6666666666666666, 0.7294117647058823, 0.8, 0.8666666666666667,
        0.9294117647058824, 1,
      ],
      [
        0, 0.06666666666666667, 0.12941176470588237, 0.2, 0.26666666666666666,
        0.32941176470588235, 0.4, 0.4666666666666667, 0.5294117647058824, 0.6,
        0.6666666666666666, 0.7294117647058823, 0.8, 0.8666666666666667,
        0.9294117647058824, 1,
      ],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_INT16_MAT4", function () {
    const propertyName = "example_INT16_MAT4";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      -32768, -28398, -24030, -19661, -15291, -10923, -6554, -2184, 2183, 6553,
      10922, 15290, 19660, 24029, 28397, 32767,
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_INT16_MAT4_array", function () {
    const propertyName = "example_variable_length_INT16_MAT4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [
        -32768, -28398, -24030, -19661, -15291, -10923, -6554, -2184, 2183,
        6553, 10922, 15290, 19660, 24029, 28397, 32767,
      ],
      [
        -32768, -28398, -24030, -19661, -15291, -10923, -6554, -2184, 2183,
        6553, 10922, 15290, 19660, 24029, 28397, 32767,
      ],
      [
        -32768, -28398, -24030, -19661, -15291, -10923, -6554, -2184, 2183,
        6553, 10922, 15290, 19660, 24029, 28397, 32767,
      ],
      [
        -32768, -28398, -24030, -19661, -15291, -10923, -6554, -2184, 2183,
        6553, 10922, 15290, 19660, 24029, 28397, 32767,
      ],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_INT16_MAT4_array", function () {
    const propertyName = "example_fixed_length_INT16_MAT4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [
        -32768, -28398, -24030, -19661, -15291, -10923, -6554, -2184, 2183,
        6553, 10922, 15290, 19660, 24029, 28397, 32767,
      ],
      [
        -32768, -28398, -24030, -19661, -15291, -10923, -6554, -2184, 2183,
        6553, 10922, 15290, 19660, 24029, 28397, 32767,
      ],
      [
        -32768, -28398, -24030, -19661, -15291, -10923, -6554, -2184, 2183,
        6553, 10922, 15290, 19660, 24029, 28397, 32767,
      ],
      [
        -32768, -28398, -24030, -19661, -15291, -10923, -6554, -2184, 2183,
        6553, 10922, 15290, 19660, 24029, 28397, 32767,
      ],
      [
        -32768, -28398, -24030, -19661, -15291, -10923, -6554, -2184, 2183,
        6553, 10922, 15290, 19660, 24029, 28397, 32767,
      ],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_normalized_INT16_MAT4", function () {
    const propertyName = "example_normalized_INT16_MAT4";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      -1, -0.8666646320993683, -0.7333597827082126, -0.6000244148075808,
      -0.46665852839747307, -0.33335367900631735, -0.2000183111056856,
      -0.06665242469557787, 0.06662190618610186, 0.1999877925962096,
      0.33332316049684135, 0.4666280098879971, 0.5999938962981048,
      0.7333292641987366, 0.8666341135898923, 1,
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_normalized_INT16_MAT4_array", function () {
    const propertyName = "example_variable_length_normalized_INT16_MAT4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [
        -1, -0.8666646320993683, -0.7333597827082126, -0.6000244148075808,
        -0.46665852839747307, -0.33335367900631735, -0.2000183111056856,
        -0.06665242469557787, 0.06662190618610186, 0.1999877925962096,
        0.33332316049684135, 0.4666280098879971, 0.5999938962981048,
        0.7333292641987366, 0.8666341135898923, 1,
      ],
      [
        -1, -0.8666646320993683, -0.7333597827082126, -0.6000244148075808,
        -0.46665852839747307, -0.33335367900631735, -0.2000183111056856,
        -0.06665242469557787, 0.06662190618610186, 0.1999877925962096,
        0.33332316049684135, 0.4666280098879971, 0.5999938962981048,
        0.7333292641987366, 0.8666341135898923, 1,
      ],
      [
        -1, -0.8666646320993683, -0.7333597827082126, -0.6000244148075808,
        -0.46665852839747307, -0.33335367900631735, -0.2000183111056856,
        -0.06665242469557787, 0.06662190618610186, 0.1999877925962096,
        0.33332316049684135, 0.4666280098879971, 0.5999938962981048,
        0.7333292641987366, 0.8666341135898923, 1,
      ],
      [
        -1, -0.8666646320993683, -0.7333597827082126, -0.6000244148075808,
        -0.46665852839747307, -0.33335367900631735, -0.2000183111056856,
        -0.06665242469557787, 0.06662190618610186, 0.1999877925962096,
        0.33332316049684135, 0.4666280098879971, 0.5999938962981048,
        0.7333292641987366, 0.8666341135898923, 1,
      ],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_normalized_INT16_MAT4_array", function () {
    const propertyName = "example_fixed_length_normalized_INT16_MAT4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [
        -1, -0.8666646320993683, -0.7333597827082126, -0.6000244148075808,
        -0.46665852839747307, -0.33335367900631735, -0.2000183111056856,
        -0.06665242469557787, 0.06662190618610186, 0.1999877925962096,
        0.33332316049684135, 0.4666280098879971, 0.5999938962981048,
        0.7333292641987366, 0.8666341135898923, 1,
      ],
      [
        -1, -0.8666646320993683, -0.7333597827082126, -0.6000244148075808,
        -0.46665852839747307, -0.33335367900631735, -0.2000183111056856,
        -0.06665242469557787, 0.06662190618610186, 0.1999877925962096,
        0.33332316049684135, 0.4666280098879971, 0.5999938962981048,
        0.7333292641987366, 0.8666341135898923, 1,
      ],
      [
        -1, -0.8666646320993683, -0.7333597827082126, -0.6000244148075808,
        -0.46665852839747307, -0.33335367900631735, -0.2000183111056856,
        -0.06665242469557787, 0.06662190618610186, 0.1999877925962096,
        0.33332316049684135, 0.4666280098879971, 0.5999938962981048,
        0.7333292641987366, 0.8666341135898923, 1,
      ],
      [
        -1, -0.8666646320993683, -0.7333597827082126, -0.6000244148075808,
        -0.46665852839747307, -0.33335367900631735, -0.2000183111056856,
        -0.06665242469557787, 0.06662190618610186, 0.1999877925962096,
        0.33332316049684135, 0.4666280098879971, 0.5999938962981048,
        0.7333292641987366, 0.8666341135898923, 1,
      ],
      [
        -1, -0.8666646320993683, -0.7333597827082126, -0.6000244148075808,
        -0.46665852839747307, -0.33335367900631735, -0.2000183111056856,
        -0.06665242469557787, 0.06662190618610186, 0.1999877925962096,
        0.33332316049684135, 0.4666280098879971, 0.5999938962981048,
        0.7333292641987366, 0.8666341135898923, 1,
      ],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_UINT16_MAT4", function () {
    const propertyName = "example_UINT16_MAT4";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      0, 4369, 8737, 13107, 17476, 21844, 26214, 30583, 34951, 39321, 43690,
      48058, 52428, 56797, 61165, 65535,
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_UINT16_MAT4_array", function () {
    const propertyName = "example_variable_length_UINT16_MAT4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [
        0, 4369, 8737, 13107, 17476, 21844, 26214, 30583, 34951, 39321, 43690,
        48058, 52428, 56797, 61165, 65535,
      ],
      [
        0, 4369, 8737, 13107, 17476, 21844, 26214, 30583, 34951, 39321, 43690,
        48058, 52428, 56797, 61165, 65535,
      ],
      [
        0, 4369, 8737, 13107, 17476, 21844, 26214, 30583, 34951, 39321, 43690,
        48058, 52428, 56797, 61165, 65535,
      ],
      [
        0, 4369, 8737, 13107, 17476, 21844, 26214, 30583, 34951, 39321, 43690,
        48058, 52428, 56797, 61165, 65535,
      ],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_UINT16_MAT4_array", function () {
    const propertyName = "example_fixed_length_UINT16_MAT4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [
        0, 4369, 8737, 13107, 17476, 21844, 26214, 30583, 34951, 39321, 43690,
        48058, 52428, 56797, 61165, 65535,
      ],
      [
        0, 4369, 8737, 13107, 17476, 21844, 26214, 30583, 34951, 39321, 43690,
        48058, 52428, 56797, 61165, 65535,
      ],
      [
        0, 4369, 8737, 13107, 17476, 21844, 26214, 30583, 34951, 39321, 43690,
        48058, 52428, 56797, 61165, 65535,
      ],
      [
        0, 4369, 8737, 13107, 17476, 21844, 26214, 30583, 34951, 39321, 43690,
        48058, 52428, 56797, 61165, 65535,
      ],
      [
        0, 4369, 8737, 13107, 17476, 21844, 26214, 30583, 34951, 39321, 43690,
        48058, 52428, 56797, 61165, 65535,
      ],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_normalized_UINT16_MAT4", function () {
    const propertyName = "example_normalized_UINT16_MAT4";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      0, 0.06666666666666667, 0.13331807431143664, 0.2, 0.26666666666666666,
      0.3333180743114366, 0.4, 0.4666666666666667, 0.5333180743114366, 0.6,
      0.6666666666666666, 0.7333180743114366, 0.8, 0.8666666666666667,
      0.9333180743114367, 1,
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_normalized_UINT16_MAT4_array", function () {
    const propertyName = "example_variable_length_normalized_UINT16_MAT4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [
        0, 0.06666666666666667, 0.13331807431143664, 0.2, 0.26666666666666666,
        0.3333180743114366, 0.4, 0.4666666666666667, 0.5333180743114366, 0.6,
        0.6666666666666666, 0.7333180743114366, 0.8, 0.8666666666666667,
        0.9333180743114367, 1,
      ],
      [
        0, 0.06666666666666667, 0.13331807431143664, 0.2, 0.26666666666666666,
        0.3333180743114366, 0.4, 0.4666666666666667, 0.5333180743114366, 0.6,
        0.6666666666666666, 0.7333180743114366, 0.8, 0.8666666666666667,
        0.9333180743114367, 1,
      ],
      [
        0, 0.06666666666666667, 0.13331807431143664, 0.2, 0.26666666666666666,
        0.3333180743114366, 0.4, 0.4666666666666667, 0.5333180743114366, 0.6,
        0.6666666666666666, 0.7333180743114366, 0.8, 0.8666666666666667,
        0.9333180743114367, 1,
      ],
      [
        0, 0.06666666666666667, 0.13331807431143664, 0.2, 0.26666666666666666,
        0.3333180743114366, 0.4, 0.4666666666666667, 0.5333180743114366, 0.6,
        0.6666666666666666, 0.7333180743114366, 0.8, 0.8666666666666667,
        0.9333180743114367, 1,
      ],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_normalized_UINT16_MAT4_array", function () {
    const propertyName = "example_fixed_length_normalized_UINT16_MAT4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [
        0, 0.06666666666666667, 0.13331807431143664, 0.2, 0.26666666666666666,
        0.3333180743114366, 0.4, 0.4666666666666667, 0.5333180743114366, 0.6,
        0.6666666666666666, 0.7333180743114366, 0.8, 0.8666666666666667,
        0.9333180743114367, 1,
      ],
      [
        0, 0.06666666666666667, 0.13331807431143664, 0.2, 0.26666666666666666,
        0.3333180743114366, 0.4, 0.4666666666666667, 0.5333180743114366, 0.6,
        0.6666666666666666, 0.7333180743114366, 0.8, 0.8666666666666667,
        0.9333180743114367, 1,
      ],
      [
        0, 0.06666666666666667, 0.13331807431143664, 0.2, 0.26666666666666666,
        0.3333180743114366, 0.4, 0.4666666666666667, 0.5333180743114366, 0.6,
        0.6666666666666666, 0.7333180743114366, 0.8, 0.8666666666666667,
        0.9333180743114367, 1,
      ],
      [
        0, 0.06666666666666667, 0.13331807431143664, 0.2, 0.26666666666666666,
        0.3333180743114366, 0.4, 0.4666666666666667, 0.5333180743114366, 0.6,
        0.6666666666666666, 0.7333180743114366, 0.8, 0.8666666666666667,
        0.9333180743114367, 1,
      ],
      [
        0, 0.06666666666666667, 0.13331807431143664, 0.2, 0.26666666666666666,
        0.3333180743114366, 0.4, 0.4666666666666667, 0.5333180743114366, 0.6,
        0.6666666666666666, 0.7333180743114366, 0.8, 0.8666666666666667,
        0.9333180743114367, 1,
      ],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_INT32_MAT4", function () {
    const propertyName = "example_INT32_MAT4";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      -2147483648, -1861152494, -1574821342, -1288490189, -1002159035,
      -715827883, -429496730, -143165576, 143165575, 429496729, 715827882,
      1002159034, 1288490188, 1574821341, 1861152493, 2147483647,
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_INT32_MAT4_array", function () {
    const propertyName = "example_variable_length_INT32_MAT4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [
        -2147483648, -1861152494, -1574821342, -1288490189, -1002159035,
        -715827883, -429496730, -143165576, 143165575, 429496729, 715827882,
        1002159034, 1288490188, 1574821341, 1861152493, 2147483647,
      ],
      [
        -2147483648, -1861152494, -1574821342, -1288490189, -1002159035,
        -715827883, -429496730, -143165576, 143165575, 429496729, 715827882,
        1002159034, 1288490188, 1574821341, 1861152493, 2147483647,
      ],
      [
        -2147483648, -1861152494, -1574821342, -1288490189, -1002159035,
        -715827883, -429496730, -143165576, 143165575, 429496729, 715827882,
        1002159034, 1288490188, 1574821341, 1861152493, 2147483647,
      ],
      [
        -2147483648, -1861152494, -1574821342, -1288490189, -1002159035,
        -715827883, -429496730, -143165576, 143165575, 429496729, 715827882,
        1002159034, 1288490188, 1574821341, 1861152493, 2147483647,
      ],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_INT32_MAT4_array", function () {
    const propertyName = "example_fixed_length_INT32_MAT4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [
        -2147483648, -1861152494, -1574821342, -1288490189, -1002159035,
        -715827883, -429496730, -143165576, 143165575, 429496729, 715827882,
        1002159034, 1288490188, 1574821341, 1861152493, 2147483647,
      ],
      [
        -2147483648, -1861152494, -1574821342, -1288490189, -1002159035,
        -715827883, -429496730, -143165576, 143165575, 429496729, 715827882,
        1002159034, 1288490188, 1574821341, 1861152493, 2147483647,
      ],
      [
        -2147483648, -1861152494, -1574821342, -1288490189, -1002159035,
        -715827883, -429496730, -143165576, 143165575, 429496729, 715827882,
        1002159034, 1288490188, 1574821341, 1861152493, 2147483647,
      ],
      [
        -2147483648, -1861152494, -1574821342, -1288490189, -1002159035,
        -715827883, -429496730, -143165576, 143165575, 429496729, 715827882,
        1002159034, 1288490188, 1574821341, 1861152493, 2147483647,
      ],
      [
        -2147483648, -1861152494, -1574821342, -1288490189, -1002159035,
        -715827883, -429496730, -143165576, 143165575, 429496729, 715827882,
        1002159034, 1288490188, 1574821341, 1861152493, 2147483647,
      ],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_normalized_INT32_MAT4", function () {
    const propertyName = "example_normalized_INT32_MAT4";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      -1, -0.8666666666356225, -0.7333333337369065, -0.600000000372529,
      -0.46666666654249034, -0.3333333336437742, -0.20000000027939677,
      -0.06666666644935806, 0.06666666598369678, 0.19999999981373548,
      0.3333333331781129, 0.46666666607682905, 0.5999999999068677,
      0.7333333332712452, 0.8666666661699612, 1,
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_normalized_INT32_MAT4_array", function () {
    const propertyName = "example_variable_length_normalized_INT32_MAT4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [
        -1, -0.8666666666356225, -0.7333333337369065, -0.600000000372529,
        -0.46666666654249034, -0.3333333336437742, -0.20000000027939677,
        -0.06666666644935806, 0.06666666598369678, 0.19999999981373548,
        0.3333333331781129, 0.46666666607682905, 0.5999999999068677,
        0.7333333332712452, 0.8666666661699612, 1,
      ],
      [
        -1, -0.8666666666356225, -0.7333333337369065, -0.600000000372529,
        -0.46666666654249034, -0.3333333336437742, -0.20000000027939677,
        -0.06666666644935806, 0.06666666598369678, 0.19999999981373548,
        0.3333333331781129, 0.46666666607682905, 0.5999999999068677,
        0.7333333332712452, 0.8666666661699612, 1,
      ],
      [
        -1, -0.8666666666356225, -0.7333333337369065, -0.600000000372529,
        -0.46666666654249034, -0.3333333336437742, -0.20000000027939677,
        -0.06666666644935806, 0.06666666598369678, 0.19999999981373548,
        0.3333333331781129, 0.46666666607682905, 0.5999999999068677,
        0.7333333332712452, 0.8666666661699612, 1,
      ],
      [
        -1, -0.8666666666356225, -0.7333333337369065, -0.600000000372529,
        -0.46666666654249034, -0.3333333336437742, -0.20000000027939677,
        -0.06666666644935806, 0.06666666598369678, 0.19999999981373548,
        0.3333333331781129, 0.46666666607682905, 0.5999999999068677,
        0.7333333332712452, 0.8666666661699612, 1,
      ],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_normalized_INT32_MAT4_array", function () {
    const propertyName = "example_fixed_length_normalized_INT32_MAT4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [
        -1, -0.8666666666356225, -0.7333333337369065, -0.600000000372529,
        -0.46666666654249034, -0.3333333336437742, -0.20000000027939677,
        -0.06666666644935806, 0.06666666598369678, 0.19999999981373548,
        0.3333333331781129, 0.46666666607682905, 0.5999999999068677,
        0.7333333332712452, 0.8666666661699612, 1,
      ],
      [
        -1, -0.8666666666356225, -0.7333333337369065, -0.600000000372529,
        -0.46666666654249034, -0.3333333336437742, -0.20000000027939677,
        -0.06666666644935806, 0.06666666598369678, 0.19999999981373548,
        0.3333333331781129, 0.46666666607682905, 0.5999999999068677,
        0.7333333332712452, 0.8666666661699612, 1,
      ],
      [
        -1, -0.8666666666356225, -0.7333333337369065, -0.600000000372529,
        -0.46666666654249034, -0.3333333336437742, -0.20000000027939677,
        -0.06666666644935806, 0.06666666598369678, 0.19999999981373548,
        0.3333333331781129, 0.46666666607682905, 0.5999999999068677,
        0.7333333332712452, 0.8666666661699612, 1,
      ],
      [
        -1, -0.8666666666356225, -0.7333333337369065, -0.600000000372529,
        -0.46666666654249034, -0.3333333336437742, -0.20000000027939677,
        -0.06666666644935806, 0.06666666598369678, 0.19999999981373548,
        0.3333333331781129, 0.46666666607682905, 0.5999999999068677,
        0.7333333332712452, 0.8666666661699612, 1,
      ],
      [
        -1, -0.8666666666356225, -0.7333333337369065, -0.600000000372529,
        -0.46666666654249034, -0.3333333336437742, -0.20000000027939677,
        -0.06666666644935806, 0.06666666598369678, 0.19999999981373548,
        0.3333333331781129, 0.46666666607682905, 0.5999999999068677,
        0.7333333332712452, 0.8666666661699612, 1,
      ],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_UINT32_MAT4", function () {
    const propertyName = "example_UINT32_MAT4";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      0, 286331153, 572662305, 858993459, 1145324612, 1431655764, 1717986918,
      2004318071, 2290649223, 2576980377, 2863311530, 3149642682, 3435973836,
      3722304989, 4008636141, 4294967295,
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_UINT32_MAT4_array", function () {
    const propertyName = "example_variable_length_UINT32_MAT4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [
        0, 286331153, 572662305, 858993459, 1145324612, 1431655764, 1717986918,
        2004318071, 2290649223, 2576980377, 2863311530, 3149642682, 3435973836,
        3722304989, 4008636141, 4294967295,
      ],
      [
        0, 286331153, 572662305, 858993459, 1145324612, 1431655764, 1717986918,
        2004318071, 2290649223, 2576980377, 2863311530, 3149642682, 3435973836,
        3722304989, 4008636141, 4294967295,
      ],
      [
        0, 286331153, 572662305, 858993459, 1145324612, 1431655764, 1717986918,
        2004318071, 2290649223, 2576980377, 2863311530, 3149642682, 3435973836,
        3722304989, 4008636141, 4294967295,
      ],
      [
        0, 286331153, 572662305, 858993459, 1145324612, 1431655764, 1717986918,
        2004318071, 2290649223, 2576980377, 2863311530, 3149642682, 3435973836,
        3722304989, 4008636141, 4294967295,
      ],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_UINT32_MAT4_array", function () {
    const propertyName = "example_fixed_length_UINT32_MAT4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [
        0, 286331153, 572662305, 858993459, 1145324612, 1431655764, 1717986918,
        2004318071, 2290649223, 2576980377, 2863311530, 3149642682, 3435973836,
        3722304989, 4008636141, 4294967295,
      ],
      [
        0, 286331153, 572662305, 858993459, 1145324612, 1431655764, 1717986918,
        2004318071, 2290649223, 2576980377, 2863311530, 3149642682, 3435973836,
        3722304989, 4008636141, 4294967295,
      ],
      [
        0, 286331153, 572662305, 858993459, 1145324612, 1431655764, 1717986918,
        2004318071, 2290649223, 2576980377, 2863311530, 3149642682, 3435973836,
        3722304989, 4008636141, 4294967295,
      ],
      [
        0, 286331153, 572662305, 858993459, 1145324612, 1431655764, 1717986918,
        2004318071, 2290649223, 2576980377, 2863311530, 3149642682, 3435973836,
        3722304989, 4008636141, 4294967295,
      ],
      [
        0, 286331153, 572662305, 858993459, 1145324612, 1431655764, 1717986918,
        2004318071, 2290649223, 2576980377, 2863311530, 3149642682, 3435973836,
        3722304989, 4008636141, 4294967295,
      ],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_normalized_UINT32_MAT4", function () {
    const propertyName = "example_normalized_UINT32_MAT4";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      0, 0.06666666666666667, 0.1333333331005027, 0.2, 0.26666666666666666,
      0.33333333310050267, 0.4, 0.4666666666666667, 0.5333333331005027, 0.6,
      0.6666666666666666, 0.7333333331005026, 0.8, 0.8666666666666667,
      0.9333333331005027, 1,
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_normalized_UINT32_MAT4_array", function () {
    const propertyName = "example_variable_length_normalized_UINT32_MAT4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [
        0, 0.06666666666666667, 0.1333333331005027, 0.2, 0.26666666666666666,
        0.33333333310050267, 0.4, 0.4666666666666667, 0.5333333331005027, 0.6,
        0.6666666666666666, 0.7333333331005026, 0.8, 0.8666666666666667,
        0.9333333331005027, 1,
      ],
      [
        0, 0.06666666666666667, 0.1333333331005027, 0.2, 0.26666666666666666,
        0.33333333310050267, 0.4, 0.4666666666666667, 0.5333333331005027, 0.6,
        0.6666666666666666, 0.7333333331005026, 0.8, 0.8666666666666667,
        0.9333333331005027, 1,
      ],
      [
        0, 0.06666666666666667, 0.1333333331005027, 0.2, 0.26666666666666666,
        0.33333333310050267, 0.4, 0.4666666666666667, 0.5333333331005027, 0.6,
        0.6666666666666666, 0.7333333331005026, 0.8, 0.8666666666666667,
        0.9333333331005027, 1,
      ],
      [
        0, 0.06666666666666667, 0.1333333331005027, 0.2, 0.26666666666666666,
        0.33333333310050267, 0.4, 0.4666666666666667, 0.5333333331005027, 0.6,
        0.6666666666666666, 0.7333333331005026, 0.8, 0.8666666666666667,
        0.9333333331005027, 1,
      ],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_normalized_UINT32_MAT4_array", function () {
    const propertyName = "example_fixed_length_normalized_UINT32_MAT4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [
        0, 0.06666666666666667, 0.1333333331005027, 0.2, 0.26666666666666666,
        0.33333333310050267, 0.4, 0.4666666666666667, 0.5333333331005027, 0.6,
        0.6666666666666666, 0.7333333331005026, 0.8, 0.8666666666666667,
        0.9333333331005027, 1,
      ],
      [
        0, 0.06666666666666667, 0.1333333331005027, 0.2, 0.26666666666666666,
        0.33333333310050267, 0.4, 0.4666666666666667, 0.5333333331005027, 0.6,
        0.6666666666666666, 0.7333333331005026, 0.8, 0.8666666666666667,
        0.9333333331005027, 1,
      ],
      [
        0, 0.06666666666666667, 0.1333333331005027, 0.2, 0.26666666666666666,
        0.33333333310050267, 0.4, 0.4666666666666667, 0.5333333331005027, 0.6,
        0.6666666666666666, 0.7333333331005026, 0.8, 0.8666666666666667,
        0.9333333331005027, 1,
      ],
      [
        0, 0.06666666666666667, 0.1333333331005027, 0.2, 0.26666666666666666,
        0.33333333310050267, 0.4, 0.4666666666666667, 0.5333333331005027, 0.6,
        0.6666666666666666, 0.7333333331005026, 0.8, 0.8666666666666667,
        0.9333333331005027, 1,
      ],
      [
        0, 0.06666666666666667, 0.1333333331005027, 0.2, 0.26666666666666666,
        0.33333333310050267, 0.4, 0.4666666666666667, 0.5333333331005027, 0.6,
        0.6666666666666666, 0.7333333331005026, 0.8, 0.8666666666666667,
        0.9333333331005027, 1,
      ],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_INT64_MAT4", function () {
    const propertyName = "example_INT64_MAT4";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      -9223372036854776000n,
      -7993589097992581000n,
      -6763806160975060000n,
      -5534023222112865000n,
      -4304240283250670600n,
      -3074457346233150000n,
      -1844674407370955300n,
      -614891468508760200n,
      614891468508760200n,
      1844674407370955300n,
      3074457346233150000n,
      4304240283250670600n,
      5534023222112865000n,
      6763806160975060000n,
      7993589097992581000n,
      9223372036854776000n,
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_INT64_MAT4_array", function () {
    const propertyName = "example_variable_length_INT64_MAT4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [
        -9223372036854776000n,
        -7993589097992581000n,
        -6763806160975060000n,
        -5534023222112865000n,
        -4304240283250670600n,
        -3074457346233150000n,
        -1844674407370955300n,
        -614891468508760200n,
        614891468508760200n,
        1844674407370955300n,
        3074457346233150000n,
        4304240283250670600n,
        5534023222112865000n,
        6763806160975060000n,
        7993589097992581000n,
        9223372036854776000n,
      ],
      [
        -9223372036854776000n,
        -7993589097992581000n,
        -6763806160975060000n,
        -5534023222112865000n,
        -4304240283250670600n,
        -3074457346233150000n,
        -1844674407370955300n,
        -614891468508760200n,
        614891468508760200n,
        1844674407370955300n,
        3074457346233150000n,
        4304240283250670600n,
        5534023222112865000n,
        6763806160975060000n,
        7993589097992581000n,
        9223372036854776000n,
      ],
      [
        -9223372036854776000n,
        -7993589097992581000n,
        -6763806160975060000n,
        -5534023222112865000n,
        -4304240283250670600n,
        -3074457346233150000n,
        -1844674407370955300n,
        -614891468508760200n,
        614891468508760200n,
        1844674407370955300n,
        3074457346233150000n,
        4304240283250670600n,
        5534023222112865000n,
        6763806160975060000n,
        7993589097992581000n,
        9223372036854776000n,
      ],
      [
        -9223372036854776000n,
        -7993589097992581000n,
        -6763806160975060000n,
        -5534023222112865000n,
        -4304240283250670600n,
        -3074457346233150000n,
        -1844674407370955300n,
        -614891468508760200n,
        614891468508760200n,
        1844674407370955300n,
        3074457346233150000n,
        4304240283250670600n,
        5534023222112865000n,
        6763806160975060000n,
        7993589097992581000n,
        9223372036854776000n,
      ],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_INT64_MAT4_array", function () {
    const propertyName = "example_fixed_length_INT64_MAT4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [
        -9223372036854776000n,
        -7993589097992581000n,
        -6763806160975060000n,
        -5534023222112865000n,
        -4304240283250670600n,
        -3074457346233150000n,
        -1844674407370955300n,
        -614891468508760200n,
        614891468508760200n,
        1844674407370955300n,
        3074457346233150000n,
        4304240283250670600n,
        5534023222112865000n,
        6763806160975060000n,
        7993589097992581000n,
        9223372036854776000n,
      ],
      [
        -9223372036854776000n,
        -7993589097992581000n,
        -6763806160975060000n,
        -5534023222112865000n,
        -4304240283250670600n,
        -3074457346233150000n,
        -1844674407370955300n,
        -614891468508760200n,
        614891468508760200n,
        1844674407370955300n,
        3074457346233150000n,
        4304240283250670600n,
        5534023222112865000n,
        6763806160975060000n,
        7993589097992581000n,
        9223372036854776000n,
      ],
      [
        -9223372036854776000n,
        -7993589097992581000n,
        -6763806160975060000n,
        -5534023222112865000n,
        -4304240283250670600n,
        -3074457346233150000n,
        -1844674407370955300n,
        -614891468508760200n,
        614891468508760200n,
        1844674407370955300n,
        3074457346233150000n,
        4304240283250670600n,
        5534023222112865000n,
        6763806160975060000n,
        7993589097992581000n,
        9223372036854776000n,
      ],
      [
        -9223372036854776000n,
        -7993589097992581000n,
        -6763806160975060000n,
        -5534023222112865000n,
        -4304240283250670600n,
        -3074457346233150000n,
        -1844674407370955300n,
        -614891468508760200n,
        614891468508760200n,
        1844674407370955300n,
        3074457346233150000n,
        4304240283250670600n,
        5534023222112865000n,
        6763806160975060000n,
        7993589097992581000n,
        9223372036854776000n,
      ],
      [
        -9223372036854776000n,
        -7993589097992581000n,
        -6763806160975060000n,
        -5534023222112865000n,
        -4304240283250670600n,
        -3074457346233150000n,
        -1844674407370955300n,
        -614891468508760200n,
        614891468508760200n,
        1844674407370955300n,
        3074457346233150000n,
        4304240283250670600n,
        5534023222112865000n,
        6763806160975060000n,
        7993589097992581000n,
        9223372036854776000n,
      ],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_normalized_INT64_MAT4", function () {
    const propertyName = "example_normalized_INT64_MAT4";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      -1, -0.8666666666, -0.7333333334, -0.6, -0.4666666666, -0.3333333334,
      -0.2, -0.0666666666, 0.0666666666, 0.2, 0.3333333334, 0.4666666666, 0.6,
      0.7333333334, 0.8666666666, 1,
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_normalized_INT64_MAT4_array", function () {
    const propertyName = "example_variable_length_normalized_INT64_MAT4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [
        -1, -0.8666666666, -0.7333333334, -0.6, -0.4666666666, -0.3333333334,
        -0.2, -0.0666666666, 0.0666666666, 0.2, 0.3333333334, 0.4666666666, 0.6,
        0.7333333334, 0.8666666666, 1,
      ],
      [
        -1, -0.8666666666, -0.7333333334, -0.6, -0.4666666666, -0.3333333334,
        -0.2, -0.0666666666, 0.0666666666, 0.2, 0.3333333334, 0.4666666666, 0.6,
        0.7333333334, 0.8666666666, 1,
      ],
      [
        -1, -0.8666666666, -0.7333333334, -0.6, -0.4666666666, -0.3333333334,
        -0.2, -0.0666666666, 0.0666666666, 0.2, 0.3333333334, 0.4666666666, 0.6,
        0.7333333334, 0.8666666666, 1,
      ],
      [
        -1, -0.8666666666, -0.7333333334, -0.6, -0.4666666666, -0.3333333334,
        -0.2, -0.0666666666, 0.0666666666, 0.2, 0.3333333334, 0.4666666666, 0.6,
        0.7333333334, 0.8666666666, 1,
      ],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_normalized_INT64_MAT4_array", function () {
    const propertyName = "example_fixed_length_normalized_INT64_MAT4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [
        -1, -0.8666666666, -0.7333333334, -0.6, -0.4666666666, -0.3333333334,
        -0.2, -0.0666666666, 0.0666666666, 0.2, 0.3333333334, 0.4666666666, 0.6,
        0.7333333334, 0.8666666666, 1,
      ],
      [
        -1, -0.8666666666, -0.7333333334, -0.6, -0.4666666666, -0.3333333334,
        -0.2, -0.0666666666, 0.0666666666, 0.2, 0.3333333334, 0.4666666666, 0.6,
        0.7333333334, 0.8666666666, 1,
      ],
      [
        -1, -0.8666666666, -0.7333333334, -0.6, -0.4666666666, -0.3333333334,
        -0.2, -0.0666666666, 0.0666666666, 0.2, 0.3333333334, 0.4666666666, 0.6,
        0.7333333334, 0.8666666666, 1,
      ],
      [
        -1, -0.8666666666, -0.7333333334, -0.6, -0.4666666666, -0.3333333334,
        -0.2, -0.0666666666, 0.0666666666, 0.2, 0.3333333334, 0.4666666666, 0.6,
        0.7333333334, 0.8666666666, 1,
      ],
      [
        -1, -0.8666666666, -0.7333333334, -0.6, -0.4666666666, -0.3333333334,
        -0.2, -0.0666666666, 0.0666666666, 0.2, 0.3333333334, 0.4666666666, 0.6,
        0.7333333334, 0.8666666666, 1,
      ],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_UINT64_MAT4", function () {
    const propertyName = "example_UINT64_MAT4";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      0,
      1229782938862195000n,
      2459565875879715300n,
      3689348814741910500n,
      4919131753604105000n,
      6148914690621625000n,
      7378697629483821000n,
      8608480568346016000n,
      9838263505363536000n,
      11068046444225730000n,
      12297829383087925000n,
      13527612320105445000n,
      14757395258967642000n,
      15987178197829837000n,
      17216961134847357000n,
      18446744073709552000n,
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_UINT64_MAT4_array", function () {
    const propertyName = "example_variable_length_UINT64_MAT4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [
        0,
        1229782938862195000n,
        2459565875879715300n,
        3689348814741910500n,
        4919131753604105000n,
        6148914690621625000n,
        7378697629483821000n,
        8608480568346016000n,
        9838263505363536000n,
        11068046444225730000n,
        12297829383087925000n,
        13527612320105445000n,
        14757395258967642000n,
        15987178197829837000n,
        17216961134847357000n,
        18446744073709552000n,
      ],
      [
        0,
        1229782938862195000n,
        2459565875879715300n,
        3689348814741910500n,
        4919131753604105000n,
        6148914690621625000n,
        7378697629483821000n,
        8608480568346016000n,
        9838263505363536000n,
        11068046444225730000n,
        12297829383087925000n,
        13527612320105445000n,
        14757395258967642000n,
        15987178197829837000n,
        17216961134847357000n,
        18446744073709552000n,
      ],
      [
        0,
        1229782938862195000n,
        2459565875879715300n,
        3689348814741910500n,
        4919131753604105000n,
        6148914690621625000n,
        7378697629483821000n,
        8608480568346016000n,
        9838263505363536000n,
        11068046444225730000n,
        12297829383087925000n,
        13527612320105445000n,
        14757395258967642000n,
        15987178197829837000n,
        17216961134847357000n,
        18446744073709552000n,
      ],
      [
        0,
        1229782938862195000n,
        2459565875879715300n,
        3689348814741910500n,
        4919131753604105000n,
        6148914690621625000n,
        7378697629483821000n,
        8608480568346016000n,
        9838263505363536000n,
        11068046444225730000n,
        12297829383087925000n,
        13527612320105445000n,
        14757395258967642000n,
        15987178197829837000n,
        17216961134847357000n,
        18446744073709552000n,
      ],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_UINT64_MAT4_array", function () {
    const propertyName = "example_fixed_length_UINT64_MAT4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [
        0,
        1229782938862195000n,
        2459565875879715300n,
        3689348814741910500n,
        4919131753604105000n,
        6148914690621625000n,
        7378697629483821000n,
        8608480568346016000n,
        9838263505363536000n,
        11068046444225730000n,
        12297829383087925000n,
        13527612320105445000n,
        14757395258967642000n,
        15987178197829837000n,
        17216961134847357000n,
        18446744073709552000n,
      ],
      [
        0,
        1229782938862195000n,
        2459565875879715300n,
        3689348814741910500n,
        4919131753604105000n,
        6148914690621625000n,
        7378697629483821000n,
        8608480568346016000n,
        9838263505363536000n,
        11068046444225730000n,
        12297829383087925000n,
        13527612320105445000n,
        14757395258967642000n,
        15987178197829837000n,
        17216961134847357000n,
        18446744073709552000n,
      ],
      [
        0,
        1229782938862195000n,
        2459565875879715300n,
        3689348814741910500n,
        4919131753604105000n,
        6148914690621625000n,
        7378697629483821000n,
        8608480568346016000n,
        9838263505363536000n,
        11068046444225730000n,
        12297829383087925000n,
        13527612320105445000n,
        14757395258967642000n,
        15987178197829837000n,
        17216961134847357000n,
        18446744073709552000n,
      ],
      [
        0,
        1229782938862195000n,
        2459565875879715300n,
        3689348814741910500n,
        4919131753604105000n,
        6148914690621625000n,
        7378697629483821000n,
        8608480568346016000n,
        9838263505363536000n,
        11068046444225730000n,
        12297829383087925000n,
        13527612320105445000n,
        14757395258967642000n,
        15987178197829837000n,
        17216961134847357000n,
        18446744073709552000n,
      ],
      [
        0,
        1229782938862195000n,
        2459565875879715300n,
        3689348814741910500n,
        4919131753604105000n,
        6148914690621625000n,
        7378697629483821000n,
        8608480568346016000n,
        9838263505363536000n,
        11068046444225730000n,
        12297829383087925000n,
        13527612320105445000n,
        14757395258967642000n,
        15987178197829837000n,
        17216961134847357000n,
        18446744073709552000n,
      ],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_normalized_UINT64_MAT4", function () {
    const propertyName = "example_normalized_UINT64_MAT4";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      0, 0.0666666667, 0.1333333333, 0.2, 0.2666666667, 0.3333333333, 0.4,
      0.4666666667, 0.5333333333, 0.6, 0.6666666667, 0.7333333333, 0.8,
      0.8666666667, 0.9333333333, 1,
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_normalized_UINT64_MAT4_array", function () {
    const propertyName = "example_variable_length_normalized_UINT64_MAT4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [
        0, 0.0666666667, 0.1333333333, 0.2, 0.2666666667, 0.3333333333, 0.4,
        0.4666666667, 0.5333333333, 0.6, 0.6666666667, 0.7333333333, 0.8,
        0.8666666667, 0.9333333333, 1,
      ],
      [
        0, 0.0666666667, 0.1333333333, 0.2, 0.2666666667, 0.3333333333, 0.4,
        0.4666666667, 0.5333333333, 0.6, 0.6666666667, 0.7333333333, 0.8,
        0.8666666667, 0.9333333333, 1,
      ],
      [
        0, 0.0666666667, 0.1333333333, 0.2, 0.2666666667, 0.3333333333, 0.4,
        0.4666666667, 0.5333333333, 0.6, 0.6666666667, 0.7333333333, 0.8,
        0.8666666667, 0.9333333333, 1,
      ],
      [
        0, 0.0666666667, 0.1333333333, 0.2, 0.2666666667, 0.3333333333, 0.4,
        0.4666666667, 0.5333333333, 0.6, 0.6666666667, 0.7333333333, 0.8,
        0.8666666667, 0.9333333333, 1,
      ],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_normalized_UINT64_MAT4_array", function () {
    const propertyName = "example_fixed_length_normalized_UINT64_MAT4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [
        0, 0.0666666667, 0.1333333333, 0.2, 0.2666666667, 0.3333333333, 0.4,
        0.4666666667, 0.5333333333, 0.6, 0.6666666667, 0.7333333333, 0.8,
        0.8666666667, 0.9333333333, 1,
      ],
      [
        0, 0.0666666667, 0.1333333333, 0.2, 0.2666666667, 0.3333333333, 0.4,
        0.4666666667, 0.5333333333, 0.6, 0.6666666667, 0.7333333333, 0.8,
        0.8666666667, 0.9333333333, 1,
      ],
      [
        0, 0.0666666667, 0.1333333333, 0.2, 0.2666666667, 0.3333333333, 0.4,
        0.4666666667, 0.5333333333, 0.6, 0.6666666667, 0.7333333333, 0.8,
        0.8666666667, 0.9333333333, 1,
      ],
      [
        0, 0.0666666667, 0.1333333333, 0.2, 0.2666666667, 0.3333333333, 0.4,
        0.4666666667, 0.5333333333, 0.6, 0.6666666667, 0.7333333333, 0.8,
        0.8666666667, 0.9333333333, 1,
      ],
      [
        0, 0.0666666667, 0.1333333333, 0.2, 0.2666666667, 0.3333333333, 0.4,
        0.4666666667, 0.5333333333, 0.6, 0.6666666667, 0.7333333333, 0.8,
        0.8666666667, 0.9333333333, 1,
      ],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_FLOAT32_MAT4", function () {
    const propertyName = "example_FLOAT32_MAT4";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      -1, -0.8666666666, -0.7333333334, -0.6, -0.4666666666, -0.3333333334,
      -0.2, -0.0666666666, 0.0666666666, 0.2, 0.3333333334, 0.4666666666, 0.6,
      0.7333333334, 0.8666666666, 1,
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_FLOAT32_MAT4_array", function () {
    const propertyName = "example_variable_length_FLOAT32_MAT4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [
        -1, -0.8666666666, -0.7333333334, -0.6, -0.4666666666, -0.3333333334,
        -0.2, -0.0666666666, 0.0666666666, 0.2, 0.3333333334, 0.4666666666, 0.6,
        0.7333333334, 0.8666666666, 1,
      ],
      [
        -1, -0.8666666666, -0.7333333334, -0.6, -0.4666666666, -0.3333333334,
        -0.2, -0.0666666666, 0.0666666666, 0.2, 0.3333333334, 0.4666666666, 0.6,
        0.7333333334, 0.8666666666, 1,
      ],
      [
        -1, -0.8666666666, -0.7333333334, -0.6, -0.4666666666, -0.3333333334,
        -0.2, -0.0666666666, 0.0666666666, 0.2, 0.3333333334, 0.4666666666, 0.6,
        0.7333333334, 0.8666666666, 1,
      ],
      [
        -1, -0.8666666666, -0.7333333334, -0.6, -0.4666666666, -0.3333333334,
        -0.2, -0.0666666666, 0.0666666666, 0.2, 0.3333333334, 0.4666666666, 0.6,
        0.7333333334, 0.8666666666, 1,
      ],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_FLOAT32_MAT4_array", function () {
    const propertyName = "example_fixed_length_FLOAT32_MAT4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [
        -1, -0.8666666666, -0.7333333334, -0.6, -0.4666666666, -0.3333333334,
        -0.2, -0.0666666666, 0.0666666666, 0.2, 0.3333333334, 0.4666666666, 0.6,
        0.7333333334, 0.8666666666, 1,
      ],
      [
        -1, -0.8666666666, -0.7333333334, -0.6, -0.4666666666, -0.3333333334,
        -0.2, -0.0666666666, 0.0666666666, 0.2, 0.3333333334, 0.4666666666, 0.6,
        0.7333333334, 0.8666666666, 1,
      ],
      [
        -1, -0.8666666666, -0.7333333334, -0.6, -0.4666666666, -0.3333333334,
        -0.2, -0.0666666666, 0.0666666666, 0.2, 0.3333333334, 0.4666666666, 0.6,
        0.7333333334, 0.8666666666, 1,
      ],
      [
        -1, -0.8666666666, -0.7333333334, -0.6, -0.4666666666, -0.3333333334,
        -0.2, -0.0666666666, 0.0666666666, 0.2, 0.3333333334, 0.4666666666, 0.6,
        0.7333333334, 0.8666666666, 1,
      ],
      [
        -1, -0.8666666666, -0.7333333334, -0.6, -0.4666666666, -0.3333333334,
        -0.2, -0.0666666666, 0.0666666666, 0.2, 0.3333333334, 0.4666666666, 0.6,
        0.7333333334, 0.8666666666, 1,
      ],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_FLOAT64_MAT4", function () {
    const propertyName = "example_FLOAT64_MAT4";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      -1, -0.8666666666, -0.7333333334, -0.6, -0.4666666666, -0.3333333334,
      -0.2, -0.0666666666, 0.0666666666, 0.2, 0.3333333334, 0.4666666666, 0.6,
      0.7333333334, 0.8666666666, 1,
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_variable_length_FLOAT64_MAT4_array", function () {
    const propertyName = "example_variable_length_FLOAT64_MAT4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [
        -1, -0.8666666666, -0.7333333334, -0.6, -0.4666666666, -0.3333333334,
        -0.2, -0.0666666666, 0.0666666666, 0.2, 0.3333333334, 0.4666666666, 0.6,
        0.7333333334, 0.8666666666, 1,
      ],
      [
        -1, -0.8666666666, -0.7333333334, -0.6, -0.4666666666, -0.3333333334,
        -0.2, -0.0666666666, 0.0666666666, 0.2, 0.3333333334, 0.4666666666, 0.6,
        0.7333333334, 0.8666666666, 1,
      ],
      [
        -1, -0.8666666666, -0.7333333334, -0.6, -0.4666666666, -0.3333333334,
        -0.2, -0.0666666666, 0.0666666666, 0.2, 0.3333333334, 0.4666666666, 0.6,
        0.7333333334, 0.8666666666, 1,
      ],
      [
        -1, -0.8666666666, -0.7333333334, -0.6, -0.4666666666, -0.3333333334,
        -0.2, -0.0666666666, 0.0666666666, 0.2, 0.3333333334, 0.4666666666, 0.6,
        0.7333333334, 0.8666666666, 1,
      ],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains the right value for example_fixed_length_FLOAT64_MAT4_array", function () {
    const propertyName = "example_fixed_length_FLOAT64_MAT4_array";
    const value = metadataEntityModel.getPropertyValue(propertyName);
    const expected = [
      [
        -1, -0.8666666666, -0.7333333334, -0.6, -0.4666666666, -0.3333333334,
        -0.2, -0.0666666666, 0.0666666666, 0.2, 0.3333333334, 0.4666666666, 0.6,
        0.7333333334, 0.8666666666, 1,
      ],
      [
        -1, -0.8666666666, -0.7333333334, -0.6, -0.4666666666, -0.3333333334,
        -0.2, -0.0666666666, 0.0666666666, 0.2, 0.3333333334, 0.4666666666, 0.6,
        0.7333333334, 0.8666666666, 1,
      ],
      [
        -1, -0.8666666666, -0.7333333334, -0.6, -0.4666666666, -0.3333333334,
        -0.2, -0.0666666666, 0.0666666666, 0.2, 0.3333333334, 0.4666666666, 0.6,
        0.7333333334, 0.8666666666, 1,
      ],
      [
        -1, -0.8666666666, -0.7333333334, -0.6, -0.4666666666, -0.3333333334,
        -0.2, -0.0666666666, 0.0666666666, 0.2, 0.3333333334, 0.4666666666, 0.6,
        0.7333333334, 0.8666666666, 1,
      ],
      [
        -1, -0.8666666666, -0.7333333334, -0.6, -0.4666666666, -0.3333333334,
        -0.2, -0.0666666666, 0.0666666666, 0.2, 0.3333333334, 0.4666666666, 0.6,
        0.7333333334, 0.8666666666, 1,
      ],
    ];
    expect(SpecHelpers.genericEquals(value, expected, epsilon)).toBeTrue();
  });
});

import { BinaryPropertyTableBuilder } from "3d-tiles-tools";
import { PropertyTableModels } from "3d-tiles-tools";
import { BinaryPropertyTableModel } from "3d-tiles-tools";

import { Schema } from "3d-tiles-tools";
import { MetadataClass } from "3d-tiles-tools";
import { MetadataEnum } from "3d-tiles-tools";

const exampleMetadataClass: MetadataClass = {
  name: "Example metadata class",
  description: "An example metadata class with complex types",
  properties: {
    example_variable_length_ARRAY_normalized_UINT8: {
      name: "Example variable-length ARRAY normalized INT8 property",
      type: "SCALAR",
      array: true,
      componentType: "UINT8",
      normalized: true,
    },
    example_fixed_length_ARRAY_BOOLEAN: {
      name: "Example fixed-length ARRAY BOOLEAN property",
      type: "BOOLEAN",
      array: true,
      count: 10,
    },
    example_variable_length_ARRAY_STRING: {
      name: "Example variable-length ARRAY STRING property",
      type: "STRING",
      array: true,
    },
    example_fixed_length_ARRAY_ENUM: {
      name: "Example fixed-length ARRAY ENUM property",
      type: "ENUM",
      array: true,
      enumType: "exampleEnumType",
      count: 2,
    },
  },
};

const exampleEnumType: MetadataEnum = {
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

const exampleSchema: Schema = {
  id: "EXAMPLE_ID",
  classes: {
    exampleMetadataClass: exampleMetadataClass,
  },
  enums: {
    exampleEnumType: exampleEnumType,
  },
};

function runDemo() {
  const builder = BinaryPropertyTableBuilder.create(
    exampleSchema,
    "exampleMetadataClass",
    "Example property table"
  );

  builder
    .addProperty("example_variable_length_ARRAY_normalized_UINT8", [
      [0, 255],
      [0, 128, 255],
      [0, 85, 170, 255],
      [0, 64, 128, 192, 255],
    ])
    .addProperty("example_fixed_length_ARRAY_BOOLEAN", [
      [true, false, true, false, true, false, true, false, true, false],
      [true, true, false, false, true, true, false, false, true, true],
      [false, false, true, true, false, false, true, true, false, false],
      [false, true, false, true, false, true, false, true, false, true],
    ])
    .addProperty("example_variable_length_ARRAY_STRING", [
      ["One"],
      ["One", "Two"],
      ["One", "Two", "Three"],
      ["One", "Two", "Theee", "Four"],
    ])
    .addProperty("example_fixed_length_ARRAY_ENUM", [
      ["ExampleEnumValueA", "ExampleEnumValueB"],
      ["ExampleEnumValueB", "ExampleEnumValueC"],
      ["ExampleEnumValueC", "ExampleEnumValueA"],
      ["ExampleEnumValueB", "ExampleEnumValueC"],
    ]);

  const binaryPropertyTable = builder.build();
  const propertyTableModel = new BinaryPropertyTableModel(binaryPropertyTable);

  const s = PropertyTableModels.createString(propertyTableModel);
  console.log(s);
}
runDemo();

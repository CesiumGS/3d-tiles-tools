import { BinaryPropertyTableModelBuilder } from "../src/metadata/binary/BinaryPropertyTableModelBuilder";
import { PropertyTableModels } from "../src/metadata/PropertyTableModels";

import { Schema } from "../src/structure/Metadata/Schema";
import { MetadataClass } from "../src/structure/Metadata/MetadataClass";
import { MetadataEnum } from "../src/structure/Metadata/MetadataEnum";

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
  const builder = BinaryPropertyTableModelBuilder.create(
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

  const propertyTableModel = builder.build();

  const s = PropertyTableModels.createString(propertyTableModel);
  console.log(s);
}
runDemo();

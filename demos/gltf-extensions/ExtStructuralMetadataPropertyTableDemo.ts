import { Document } from "@gltf-transform/core";
import { NodeIO } from "@gltf-transform/core";

import { EXTStructuralMetadata } from "3d-tiles-tools";
import { StructuralMetadata } from "3d-tiles-tools";

import { BinaryPropertyTableBuilder } from "3d-tiles-tools";
import { BinaryPropertyTableModel } from "3d-tiles-tools";
import { PropertyTableModels } from "3d-tiles-tools";

import { StructuralMetadataPropertyTables } from "3d-tiles-tools";

// An example metadata schema
const exampleSchema = {
  id: "EXAMPLE_SCHEMA_ID",
  classes: {
    exampleClass: {
      name: "Example Class",
      properties: {
        example_STRING: {
          name: "Example STRING property",
          type: "STRING",
        },
        example_fixed_length_FLOAT32_VEC2_array: {
          name: "Example fixed-length VEC2 array property with FLOAT32 components",
          type: "VEC2",
          componentType: "FLOAT32",
          array: true,
          count: 5,
        },
      },
    },
  },
};

async function createExampleDocument(): Promise<Document> {
  // Create a glTF-Transform document
  const document = new Document();
  document.createBuffer();

  // Create the extension object that will be used for
  // creating the extension 'model' class instances
  const extStructuralMetadata = document.createExtension(EXTStructuralMetadata);

  // Create a 'StructuralMetadata' object, and assign it to the
  // document root. This object will contain the schema and
  // the definition of the property tables.
  const structuralMetadata = extStructuralMetadata.createStructuralMetadata();
  const root = document.getRoot();
  root.setExtension<StructuralMetadata>(
    "EXT_structural_metadata",
    structuralMetadata
  );

  // Create a 'Schema' object from the JSON input, and assign it
  // to the 'StructuralMetadata'
  const schema = extStructuralMetadata.createSchemaFrom(exampleSchema as any);
  structuralMetadata.setSchema(schema);

  // Use the `BinaryPropertyTableBuilder` to create a `BinaryPropertyTable`.
  // (Note: This class is not part of the actual extension implementation.
  // It is a convenience class for creating the low-level, binary
  // representation of a binary property table, including the actual
  // buffer data, based on JSON-like input)
  const b = BinaryPropertyTableBuilder.create(
    exampleSchema,
    "exampleClass",
    "Property Table"
  );
  b.addProperty("example_STRING", ["This", "is", "an", "example"]);
  b.addProperty("example_fixed_length_FLOAT32_VEC2_array", [
    [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
    ],
    [
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
    ],
    [
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7],
    ],
    [
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 8],
    ],
  ]);

  const binaryPropertyTable = b.build();

  //*/
  // Print debug information:
  {
    const m = new BinaryPropertyTableModel(binaryPropertyTable);
    const s = PropertyTableModels.createString(m);
    console.log("Creating structural metadata property table from");
    console.log(s);
  }
  //*/

  // Create the glTF-Transform `PropertyTable` object, and assign
  // it to the 'StructuralMetadata' object
  const propertyTable = StructuralMetadataPropertyTables.create(
    extStructuralMetadata,
    binaryPropertyTable
  );

  structuralMetadata.addPropertyTable(propertyTable);

  return document;
}

async function runCreationExample() {
  const document = await createExampleDocument();

  // Create an IO object and register the extension
  const io = new NodeIO();
  io.registerExtensions([EXTStructuralMetadata]);

  // Write the document and print its JSON to the console
  const written = await io.writeJSON(document);
  console.log(JSON.stringify(written.json, null, 2));
}

runCreationExample();

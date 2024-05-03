import { Document } from "@gltf-transform/core";

import { EXTStructuralMetadata } from "../../../src/gltf-extensions";
import { StructuralMetadata } from "../../../src/gltf-extensions";
import { StructuralMetadataSchema as Schema } from "../../../src/gltf-extensions";
import { StructuralMetadataClass as Class } from "../../../src/gltf-extensions";
import { StructuralMetadataPropertyTable as PropertyTable } from "../../../src/gltf-extensions";

import { BinaryPropertyTableBuilder } from "../../../src/metadata/";

import { StructuralMetadataPropertyTables } from "../../../src/tools/";
import { StructuralMetadataMerger } from "../../../src/tools/";

// A dummy resolver for the `schemaUri` that may be found in metadata
const specSchemaUriResolver = async (schemaUri: string) => {
  console.error("The specSchemaUriResolver should not be called!");
  const schema = {
    id: "SPEC_SCHEMA_FROM_URI_" + schemaUri,
  };
  return schema;
};

/**
 * Returns the Schema from the `EXT_structural_metadata` extension in
 * the given document, or `null` if the extension does not exist or
 * it does not contain a Schema.
 *
 * @param document - The glTF-Transform document
 * @returns The metadata schema
 */
function getMetadataSchema(document: Document): Schema | null {
  const root = document.getRoot();
  const structuralMetadata = root.getExtension<StructuralMetadata>(
    "EXT_structural_metadata"
  );
  if (structuralMetadata === null) {
    return null;
  }
  const schema = structuralMetadata.getSchema();
  return schema;
}

/**
 * Returns the names of the classes in the Schema of the
 * `EXT_structural_metadata` extension in the given document,
 * or an empty array if the extension or schema do not
 * exist
 *
 * @param document - The glTF-Transform document
 * @returns The metadata class names
 */
function getMetadataClassNames(document: Document): string[] {
  const schema = getMetadataSchema(document);
  if (schema === null) {
    return [];
  }
  const classKeys = schema.listClassKeys();
  return classKeys;
}

/**
 * Returns the names of the enums in the Schema of the
 * `EXT_structural_metadata` extension in the given document,
 * or an empty array if the extension or schema do not
 * exist
 *
 * @param document - The glTF-Transform document
 * @returns The metadata enum names
 */
function getMetadataEnumNames(document: Document): string[] {
  const schema = getMetadataSchema(document);
  if (schema === null) {
    return [];
  }
  const enumKeys = schema.listEnumKeys();
  return enumKeys;
}

/**
 * Returns the class with the specified name from the schema
 * of the structural metadata extension, throwing up if it
 * does not exist
 *
 * @param document - The glTF-Transform document
 * @returns The metadata class
 */
function getMetadataClass(document: Document, className: string): Class {
  const schema = getMetadataSchema(document);
  if (schema === null) {
    throw new Error("Document does not contain metadata with schema");
  }
  const classObject = schema.getClass(className);
  if (classObject == null) {
    throw new Error("Document does not contain metadata class " + className);
  }
  return classObject;
}

/**
 * Returns the number of property tables of the `EXT_structural_metadata`
 * extension in the given document, or -1 if the extension does not
 * exist.
 *
 * @param document - The glTF-Transform document
 * @returns The number of property tables
 */
function getNumPropertyTables(document: Document): number {
  const root = document.getRoot();
  const structuralMetadata = root.getExtension<StructuralMetadata>(
    "EXT_structural_metadata"
  );
  if (structuralMetadata === null) {
    return -1;
  }
  const propertyTables = structuralMetadata.listPropertyTables();
  return propertyTables.length;
}

/**
 * Returns the property table with the given index from the
 * `EXT_structural_metadata`, throwing up if this does not
 * exist.
 *
 * @param document - The glTF-Transform document
 * @param index The index of the property table
 * @returns The property table
 */
function getPropertyTable(document: Document, index: number): PropertyTable {
  const root = document.getRoot();
  const structuralMetadata = root.getExtension<StructuralMetadata>(
    "EXT_structural_metadata"
  );
  if (structuralMetadata === null) {
    throw new Error("Document does not contain metadata");
  }
  const propertyTables = structuralMetadata.listPropertyTables();
  return propertyTables[index];
}

/**
 * Obtain the StructuralMetadata object from the given document, creating
 * it if it did not exist yet.
 *
 * @param document - The document
 * @returns The StructuralMetadata object
 */
function obtainStructuralMetadata(document: Document): StructuralMetadata {
  const extStructuralMetadata = document.createExtension(EXTStructuralMetadata);
  const root = document.getRoot();
  let structuralMetadata = root.getExtension<StructuralMetadata>(
    "EXT_structural_metadata"
  );
  if (structuralMetadata === null) {
    structuralMetadata = extStructuralMetadata.createStructuralMetadata();
    root.setExtension<StructuralMetadata>(
      "EXT_structural_metadata",
      structuralMetadata
    );
  }
  return structuralMetadata;
}

/**
 * Assign a Schema to the StructuralMetadata in the given document,
 * creating the StructuralMetadata if it did not exist yet
 *
 * @param document - The document
 * @param schemaJson - The schema JSON
 */
function assignMetadataSchema(document: Document, schemaJson: any) {
  const extStructuralMetadata = document.createExtension(EXTStructuralMetadata);
  const structuralMetadata = obtainStructuralMetadata(document);
  const metadataSchema = extStructuralMetadata.createSchemaFrom(schemaJson);
  structuralMetadata.setSchema(metadataSchema);
}

/**
 * Add a property table to the StructuralMetadata in the given document.
 *
 * The property table JSON is assumed to be an object that has the following
 * properties:
 *
 * - `className`: The name of a class from the schema
 * - `properties`: A dictionary that maps names of class properties to
 *    arrays of values that should be put into the table column
 *
 * @param document - The document
 * @param schemaJson - The schema JSON
 * @param propertyTableJson - The property table JSON
 */
function addPropertyTable(
  document: Document,
  schemaJson: any,
  propertyTableJson: any
) {
  const extStructuralMetadata = document.createExtension(EXTStructuralMetadata);
  const structuralMetadata = obtainStructuralMetadata(document);
  const className = propertyTableJson.class;
  const b = BinaryPropertyTableBuilder.create(
    schemaJson,
    className,
    "Property Table"
  );
  for (const p of Object.keys(propertyTableJson.properties)) {
    const v = propertyTableJson.properties[p];
    b.addProperty(p, v);
  }
  const binaryPropertyTable = b.build();
  const propertyTable = StructuralMetadataPropertyTables.create(
    extStructuralMetadata,
    binaryPropertyTable
  );
  structuralMetadata.addPropertyTable(propertyTable);
}

fdescribe("StructuralMetadataMerger", function () {
  //==========================================================================
  // Basic class merging

  it("creates one class if the input classes have the same name/key and they are structurally equal", async function () {
    // The classes have the same name/key
    // The classes are structurally equal
    // The result should be:
    // One class

    const schemaA = {
      id: "EXAMPLE_SCHEMA_ID",
      classes: {
        exampleClass: {
          name: "Example Class",
          properties: {
            example_STRING: {
              name: "Example STRING property",
              type: "STRING",
            },
          },
        },
      },
    };

    const schemaB = {
      id: "EXAMPLE_SCHEMA_ID",
      classes: {
        exampleClass: {
          name: "Example Class",
          properties: {
            example_STRING: {
              name: "Example STRING property",
              type: "STRING",
            },
          },
        },
      },
    };

    const documentA = new Document();
    documentA.createBuffer();
    assignMetadataSchema(documentA, schemaA);

    const documentB = new Document();
    documentB.createBuffer();
    assignMetadataSchema(documentB, schemaB);

    const document = new Document();
    StructuralMetadataMerger.mergeDocumentsWithStructuralMetadata(
      document,
      documentA,
      specSchemaUriResolver
    );

    // After merging in the first document:
    // There should be one class
    expect(getMetadataClassNames(document).length).toBe(1);

    StructuralMetadataMerger.mergeDocumentsWithStructuralMetadata(
      document,
      documentB,
      specSchemaUriResolver
    );

    // After merging in the second document:
    // There should still be one class
    expect(getMetadataClassNames(document).length).toBe(1);
  });

  it("creates two classes if the input classes have different keys/names (even though they are structurally equal)", async function () {
    // The classes have different names/keys
    // The classes are structurally equal
    // The result should be:
    // Two classes

    const schemaA = {
      id: "EXAMPLE_SCHEMA_ID",
      classes: {
        exampleClass: {
          name: "Example Class",
          properties: {
            example_STRING: {
              name: "Example STRING property",
              type: "STRING",
            },
          },
        },
      },
    };

    const schemaB = {
      id: "EXAMPLE_SCHEMA_ID",
      classes: {
        // Different name here!
        exampleClassButWithDifferentName: {
          name: "Example Class",
          properties: {
            example_STRING: {
              name: "Example STRING property",
              type: "STRING",
            },
          },
        },
      },
    };

    const documentA = new Document();
    documentA.createBuffer();
    assignMetadataSchema(documentA, schemaA);

    const documentB = new Document();
    documentB.createBuffer();
    assignMetadataSchema(documentB, schemaB);

    const document = new Document();
    StructuralMetadataMerger.mergeDocumentsWithStructuralMetadata(
      document,
      documentA,
      specSchemaUriResolver
    );

    // After merging in the first document:
    // There should be one class
    expect(getMetadataClassNames(document)).toEqual(["exampleClass"]);

    StructuralMetadataMerger.mergeDocumentsWithStructuralMetadata(
      document,
      documentB,
      specSchemaUriResolver
    );

    // After merging in the second document:
    // There should be two classes
    expect(getMetadataClassNames(document).sort()).toEqual(
      ["exampleClass", "exampleClassButWithDifferentName"].sort()
    );
  });

  it("creates two classes if the input classes have the same keys/names but are NOT structurally equal", async function () {
    // The classes have the same name/key
    // The classes are structurally different
    // The result should be:
    // Two classes (one disambiguated)

    const schemaA = {
      id: "EXAMPLE_SCHEMA_ID",
      classes: {
        exampleClass: {
          name: "Example Class",
          properties: {
            example_STRING: {
              name: "Example STRING property",
              type: "STRING",
            },
          },
        },
      },
    };

    const schemaB = {
      id: "EXAMPLE_SCHEMA_ID",
      classes: {
        exampleClass: {
          name: "Example Class but with a difference", // Structural difference!
          properties: {
            example_STRING: {
              name: "Example STRING property",
              type: "STRING",
            },
          },
        },
      },
    };

    const documentA = new Document();
    documentA.createBuffer();
    assignMetadataSchema(documentA, schemaA);

    const documentB = new Document();
    documentB.createBuffer();
    assignMetadataSchema(documentB, schemaB);

    const document = new Document();
    StructuralMetadataMerger.mergeDocumentsWithStructuralMetadata(
      document,
      documentA,
      specSchemaUriResolver
    );

    // After merging in the first document:
    // There should be one class
    expect(getMetadataClassNames(document)).toEqual(["exampleClass"]);

    StructuralMetadataMerger.mergeDocumentsWithStructuralMetadata(
      document,
      documentB,
      specSchemaUriResolver
    );

    // After merging in the second document:
    // There should be two classes, with the second one have a disambiguated name/key
    expect(getMetadataClassNames(document).sort()).toEqual(
      ["exampleClass", "exampleClass_0"].sort()
    );
  });

  it("creates two classes if the input classes have the same keys/names and appear to be structurally equal, but are no longer equal after disambiguating enums", async function () {
    // The enums have the same name/key
    // The enums are structurally different
    // The classes have the same name/key
    // The classes are structurally equal INITIALLY,
    // but are different after disambiguating the enums
    // The result should be:
    // Two enums (one disambiguated)
    // Two classes (one disambiguated)

    const schemaA = {
      id: "EXAMPLE_SCHEMA_ID",
      enums: {
        exampleEnum: {
          valueType: "UINT8",
          values: [
            {
              name: "EXAMPLE_ENUM_VALUE_A",
              value: 12,
            },
            {
              name: "EXAMPLE_ENUM_VALUE_B",
              value: 34,
            },
          ],
        },
      },
      classes: {
        exampleClass: {
          name: "Example Class",
          properties: {
            example_ENUM: {
              name: "Example ENUM property",
              type: "ENUM",
              enumType: "exampleEnum",
            },
          },
        },
      },
    };

    const schemaB = {
      id: "EXAMPLE_SCHEMA_ID",
      enums: {
        exampleEnum: {
          valueType: "UINT8",
          values: [
            {
              name: "EXAMPLE_ENUM_VALUE_A",
              value: 0,
            },
            {
              name: "EXAMPLE_ENUM_VALUE_B",
              value: 1,
            },
          ],
        },
      },
      classes: {
        exampleClass: {
          name: "Example Class",
          properties: {
            example_ENUM: {
              name: "Example ENUM property",
              type: "ENUM",
              enumType: "exampleEnum",
            },
          },
        },
      },
    };

    const documentA = new Document();
    documentA.createBuffer();
    assignMetadataSchema(documentA, schemaA);

    const documentB = new Document();
    documentB.createBuffer();
    assignMetadataSchema(documentB, schemaB);

    const document = new Document();
    StructuralMetadataMerger.mergeDocumentsWithStructuralMetadata(
      document,
      documentA,
      specSchemaUriResolver
    );

    // After merging in the first document:
    // There should be one enum and one class
    expect(getMetadataEnumNames(document)).toEqual(["exampleEnum"]);
    expect(getMetadataClassNames(document)).toEqual(["exampleClass"]);

    StructuralMetadataMerger.mergeDocumentsWithStructuralMetadata(
      document,
      documentB,
      specSchemaUriResolver
    );

    // After merging in the second document:
    // There should be two enums and two classes,
    // with the second enum and class each having a disambiguated name/key
    expect(getMetadataEnumNames(document).sort()).toEqual(
      ["exampleEnum", "exampleEnum_0"].sort()
    );
    expect(getMetadataClassNames(document).sort()).toEqual(
      ["exampleClass", "exampleClass_0"].sort()
    );

    // Expect the enumType of the property to be updated for
    // the disambiguated class, according to the disambiguated
    // enum name
    const exampleClass_0 = getMetadataClass(document, "exampleClass_0");
    const property = exampleClass_0.getProperty("example_ENUM");
    expect(property?.getEnumType()).toEqual("exampleEnum_0");
  });

  //==========================================================================
  // Basic property table merging

  it("merges the set of property tables for one resulting class", async function () {
    // The classes have the same name/key
    // The classes are structurally equal
    // The property tables refer to the respective class (which turns out to be equal)
    // The result should be:
    // One class
    // Two property tables

    const schemaA = {
      id: "EXAMPLE_SCHEMA_ID",
      classes: {
        exampleClass: {
          name: "Example Class",
          properties: {
            example_STRING: {
              name: "Example STRING property",
              type: "STRING",
            },
          },
        },
      },
    };

    const schemaB = {
      id: "EXAMPLE_SCHEMA_ID",
      classes: {
        exampleClass: {
          name: "Example Class",
          properties: {
            example_STRING: {
              name: "Example STRING property",
              type: "STRING",
            },
          },
        },
      },
    };

    const propertyTableA = {
      class: "exampleClass",
      properties: {
        example_STRING: ["This", "is", "an", "example"],
      },
    };

    const propertyTableB = {
      class: "exampleClass",
      properties: {
        example_STRING: ["Yet", "another", "example", "table"],
      },
    };

    const documentA = new Document();
    documentA.createBuffer();
    assignMetadataSchema(documentA, schemaA);
    addPropertyTable(documentA, schemaA, propertyTableA);

    const documentB = new Document();
    documentB.createBuffer();
    assignMetadataSchema(documentB, schemaB);
    addPropertyTable(documentB, schemaB, propertyTableB);

    const document = new Document();
    StructuralMetadataMerger.mergeDocumentsWithStructuralMetadata(
      document,
      documentA,
      specSchemaUriResolver
    );

    // After merging in the first document:
    // There should be one class
    // There should be one property table
    expect(getMetadataClassNames(document)).toEqual(["exampleClass"]);
    expect(getNumPropertyTables(document)).toBe(1);

    StructuralMetadataMerger.mergeDocumentsWithStructuralMetadata(
      document,
      documentB,
      specSchemaUriResolver
    );

    // After merging in the second document:
    // There should still be one class
    // There should be two property tables
    expect(getMetadataClassNames(document)).toEqual(["exampleClass"]);
    expect(getNumPropertyTables(document)).toBe(2);
  });

  it("merges the set of property tables and updates their class for disambiguated classes", async function () {
    // The classes have the same name/key
    // The classes are structurally equal
    // The property tables refer to the respective class (which turns out to be equal)
    // The result should be:
    // One class
    // Two property tables

    const schemaA = {
      id: "EXAMPLE_SCHEMA_ID",
      classes: {
        exampleClass: {
          name: "Example Class",
          properties: {
            example_STRING: {
              name: "Example STRING property",
              type: "STRING",
            },
          },
        },
      },
    };

    const schemaB = {
      id: "EXAMPLE_SCHEMA_ID",
      classes: {
        exampleClass: {
          name: "Example Class but with a difference", // Structural difference!
          properties: {
            example_STRING: {
              name: "Example STRING property",
              type: "STRING",
            },
          },
        },
      },
    };

    const propertyTableA = {
      class: "exampleClass",
      properties: {
        example_STRING: ["This", "is", "an", "example"],
      },
    };

    const propertyTableB = {
      class: "exampleClass",
      properties: {
        example_STRING: ["Yet", "another", "example", "table"],
      },
    };

    const documentA = new Document();
    documentA.createBuffer();
    assignMetadataSchema(documentA, schemaA);
    addPropertyTable(documentA, schemaA, propertyTableA);

    const documentB = new Document();
    documentB.createBuffer();
    assignMetadataSchema(documentB, schemaB);
    addPropertyTable(documentB, schemaB, propertyTableB);

    const document = new Document();
    StructuralMetadataMerger.mergeDocumentsWithStructuralMetadata(
      document,
      documentA,
      specSchemaUriResolver
    );

    // After merging in the first document:
    // There should be one class
    // There should be one property table
    expect(getMetadataClassNames(document)).toEqual(["exampleClass"]);
    expect(getNumPropertyTables(document)).toBe(1);

    StructuralMetadataMerger.mergeDocumentsWithStructuralMetadata(
      document,
      documentB,
      specSchemaUriResolver
    );

    // After merging in the second document:
    // There should be two classes
    // There should be two property tables
    expect(getMetadataClassNames(document).sort()).toEqual(
      ["exampleClass", "exampleClass_0"].sort()
    );
    expect(getNumPropertyTables(document)).toBe(2);

    // Expect the second property table to refer to the
    // renamed class
    const propertyTable1 = getPropertyTable(document, 1);
    expect(propertyTable1.getClass()).toBe("exampleClass_0");
  });
});

import { Document } from "@gltf-transform/core";

import NdArray from "ndarray";
import { savePixels } from "ndarray-pixels";

import { EXTStructuralMetadata } from "../../../src/gltf-extensions";
import { MeshPrimitiveStructuralMetadata } from "../../../src/gltf-extensions";
import { StructuralMetadata } from "../../../src/gltf-extensions";
import { StructuralMetadataSchema as Schema } from "../../../src/gltf-extensions";
import { StructuralMetadataClass as Class } from "../../../src/gltf-extensions";
import { StructuralMetadataPropertyTable as PropertyTable } from "../../../src/gltf-extensions";
import { StructuralMetadataPropertyAttribute as PropertyAttribute } from "../../../src/gltf-extensions";
import { StructuralMetadataPropertyTexture as PropertyTexture } from "../../../src/gltf-extensions";

import { BinaryPropertyTableBuilder } from "../../../src/metadata/";

import { GltfTransform } from "../../../src/tools/";
import { StructuralMetadataPropertyTables } from "../../../src/tools/";
import { StructuralMetadataMerger } from "../../../src/tools/";

// A compile-time flag that indicates that the documents that result
// from the merge operation should be serialized with glTF-Transform.
// This does impose an overhead, but should usually be `true`, because
// it is a very thorough consistency check.
const SERIALIZE_DOCUMENTS = true;

// A compile-time flag that indicates that the documents that are
// created due to the SERIALIZE_DOCUMENTS flag should be logged
// to the console. This should be `true` ONLY for debugging!
const LOG_SERIALIZED_DOCUMENTS = false;

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
 * Returns the number of property attributes of the `EXT_structural_metadata`
 * extension in the given document, or -1 if the extension does not
 * exist.
 *
 * @param document - The glTF-Transform document
 * @returns The number of property attributes
 */
function getNumPropertyAttributes(document: Document): number {
  const root = document.getRoot();
  const structuralMetadata = root.getExtension<StructuralMetadata>(
    "EXT_structural_metadata"
  );
  if (structuralMetadata === null) {
    return -1;
  }
  const propertyAttributes = structuralMetadata.listPropertyAttributes();
  return propertyAttributes.length;
}

/**
 * Returns the number of property textures of the `EXT_structural_metadata`
 * extension in the given document, or -1 if the extension does not
 * exist.
 *
 * @param document - The glTF-Transform document
 * @returns The number of property textures
 */
function getNumPropertyTextures(document: Document): number {
  const root = document.getRoot();
  const structuralMetadata = root.getExtension<StructuralMetadata>(
    "EXT_structural_metadata"
  );
  if (structuralMetadata === null) {
    return -1;
  }
  const propertyTextures = structuralMetadata.listPropertyTextures();
  return propertyTextures.length;
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
 * Returns the property attribute with the given index from the
 * `EXT_structural_metadata`, throwing up if this does not
 * exist.
 *
 * @param document - The glTF-Transform document
 * @param index The index of the property attribute
 * @returns The property attribute
 */
function getPropertyAttribute(
  document: Document,
  index: number
): PropertyAttribute {
  const root = document.getRoot();
  const structuralMetadata = root.getExtension<StructuralMetadata>(
    "EXT_structural_metadata"
  );
  if (structuralMetadata === null) {
    throw new Error("Document does not contain metadata");
  }
  const propertyAttributes = structuralMetadata.listPropertyAttributes();
  return propertyAttributes[index];
}

/**
 * Returns the property texture with the given index from the
 * `EXT_structural_metadata`, throwing up if this does not
 * exist.
 *
 * @param document - The glTF-Transform document
 * @param index The index of the property texture
 * @returns The property texture
 */
function getPropertyTexture(
  document: Document,
  index: number
): PropertyTexture {
  const root = document.getRoot();
  const structuralMetadata = root.getExtension<StructuralMetadata>(
    "EXT_structural_metadata"
  );
  if (structuralMetadata === null) {
    throw new Error("Document does not contain metadata");
  }
  const propertyTextures = structuralMetadata.listPropertyTextures();
  return propertyTextures[index];
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

/**
 * Add a property attribute to the StructuralMetadata in the given document.
 *
 * This method does name assumptions about the structure of the
 * metadata class. It assumes that the class contains a property
 * that is called "example_INT8_SCALAR" (with UINT8 scalar type)
 * and it will create...
 *
 * - a property attribute in the top-level metadata extension object for
 *   such a property. It will refer to a mesh primitive attribute that
 *   will be called "_EXAMPLE_ATTRIBUTE"
 * - a mesh with a primitive that contains such a "_EXAMPLE_ATTRIBUTE"
 *   containing "dummy" data for such an attribute
 *
 * @param document - The document
 * @param className - The metadata class name
 */
function addSpecPropertyAttribute(document: Document, className: string) {
  const propertyName = "example_INT8_SCALAR";
  const attributeName = "_EXAMPLE_ATTRIBUTE";

  // Obtain the top-level extension object
  const extStructuralMetadata = document.createExtension(EXTStructuralMetadata);
  const structuralMetadata = obtainStructuralMetadata(document);

  // Create and add a property attribute with the following structure:
  // {
  //   className: className
  //   properties: {
  //     example_INT8_SCALAR : {
  //       attribute: "_EXAMPLE_ATTRIBUTE"
  //     }
  //   }
  // }
  const propertyAttribute = extStructuralMetadata.createPropertyAttribute();
  propertyAttribute.setClass(className);
  const propertyAttributeProperty =
    extStructuralMetadata.createPropertyAttributeProperty();
  propertyAttributeProperty.setAttribute(attributeName);
  propertyAttribute.setProperty(propertyName, propertyAttributeProperty);
  structuralMetadata.addPropertyAttribute(propertyAttribute);

  // Create a dummy mesh with one primitive
  const mesh = document.createMesh();
  const primitive = document.createPrimitive();
  mesh.addPrimitive(primitive);

  // Create an accessor with dummy UINT8 scalar data
  // to hold the property attribute values, and store
  // it as the "_EXAMPLE_ATTRIBUTE" in the primitive
  const accessor = document.createAccessor();
  const buffer = document.getRoot().listBuffers()[0];
  accessor.setBuffer(buffer);
  accessor.setType("SCALAR");
  const array = new Int8Array([0, 1, 2, 3]);
  accessor.setArray(array);
  primitive.setAttribute(attributeName, accessor);

  // Define the metadata for the mesh primitive, and let it
  // refer to the property attribute that was created above
  const meshPrimitiveStructuralMetadata =
    extStructuralMetadata.createMeshPrimitiveStructuralMetadata();
  meshPrimitiveStructuralMetadata.addPropertyAttribute(propertyAttribute);
  primitive.setExtension<MeshPrimitiveStructuralMetadata>(
    "EXT_structural_metadata",
    meshPrimitiveStructuralMetadata
  );
}

/**
 * Add a property texture to the StructuralMetadata in the given document.
 *
 * This method does name assumptions about the structure of the
 * metadata class. It assumes that the class contains a property
 * that is called "example_INT8_SCALAR" (with UINT8 scalar type)
 * and it will create...
 *
 * - a property texture in the top-level metadata extension object for
 *   such a property. It will refer to the texture with index 0,
 *   texture coordinate set 0, and channels [0]
 * - a texture that contains dummy data in channel 0
 *
 * @param document - The document
 * @param className - The metadata class name
 * @param redPixelValue - The value of the 'red' component of the
 * pixels, i.e. the values in channel 0
 */
async function addSpecPropertyTexture(
  document: Document,
  className: string,
  redPixelValue: number
) {
  const propertyName = "example_INT8_SCALAR";

  // Obtain the top-level extension object
  const extStructuralMetadata = document.createExtension(EXTStructuralMetadata);
  const structuralMetadata = obtainStructuralMetadata(document);

  // Create an image with integer values in channel 0,
  // and a texture that refers to this image
  const sizeX = 2;
  const sizeY = 2;
  const pixels = NdArray(new Uint8Array(sizeX * sizeY), [sizeX, sizeY, 4]);
  for (let x = 0; x < pixels.shape[0]; x++) {
    for (let y = 0; y < pixels.shape[1]; y++) {
      pixels.set(x, y, 0, redPixelValue);
    }
  }
  const image = await savePixels(pixels, "image/png");
  const texture = document.createTexture();
  texture.setImage(image);
  texture.setURI("propertyTexture.png");

  // Create and add a property texture with the following structure:
  // {
  //   className: className
  //   properties: {
  //     example_INT8_SCALAR : {
  //       index: 0,
  //       texCoord: 0,
  //       channels: [0]
  //     }
  //   }
  // }
  // (The texture and texCoord will be filled in by glTF-Transform,
  // due to the reference to the texture that was created above)
  const propertyTexture = extStructuralMetadata.createPropertyTexture();
  propertyTexture.setClass(className);
  const propertyTextureProperty =
    extStructuralMetadata.createPropertyTextureProperty();
  propertyTextureProperty.setTexture(texture);
  propertyTextureProperty.setChannels([0]);
  propertyTexture.setProperty(propertyName, propertyTextureProperty);
  structuralMetadata.addPropertyTexture(propertyTexture);

  // Create a dummy mesh with one primitive
  const mesh = document.createMesh();
  const primitive = document.createPrimitive();
  mesh.addPrimitive(primitive);

  // Define the metadata for the mesh primitive, and let it
  // refer to the property texture that was created above
  const meshPrimitiveStructuralMetadata =
    extStructuralMetadata.createMeshPrimitiveStructuralMetadata();
  meshPrimitiveStructuralMetadata.addPropertyTexture(propertyTexture);
  primitive.setExtension<MeshPrimitiveStructuralMetadata>(
    "EXT_structural_metadata",
    meshPrimitiveStructuralMetadata
  );
}

describe("StructuralMetadataMerger", function () {
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
    await StructuralMetadataMerger.mergeDocumentsWithStructuralMetadata(
      document,
      documentA,
      specSchemaUriResolver
    );

    // After merging in the first document:
    // There should be one class
    expect(getMetadataClassNames(document).length).toBe(1);

    await StructuralMetadataMerger.mergeDocumentsWithStructuralMetadata(
      document,
      documentB,
      specSchemaUriResolver
    );

    // After merging in the second document:
    // There should still be one class
    expect(getMetadataClassNames(document).length).toBe(1);

    if (SERIALIZE_DOCUMENTS) {
      const io = await GltfTransform.getIO();
      const jsonDocument = await io.writeJSON(document);
      if (LOG_SERIALIZED_DOCUMENTS) {
        console.log(JSON.stringify(jsonDocument.json, null, 2));
      }
    }
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
    await StructuralMetadataMerger.mergeDocumentsWithStructuralMetadata(
      document,
      documentA,
      specSchemaUriResolver
    );

    // After merging in the first document:
    // There should be one class
    expect(getMetadataClassNames(document)).toEqual(["exampleClass"]);

    await StructuralMetadataMerger.mergeDocumentsWithStructuralMetadata(
      document,
      documentB,
      specSchemaUriResolver
    );

    // After merging in the second document:
    // There should be two classes
    expect(getMetadataClassNames(document).sort()).toEqual(
      ["exampleClass", "exampleClassButWithDifferentName"].sort()
    );

    if (SERIALIZE_DOCUMENTS) {
      const io = await GltfTransform.getIO();
      const jsonDocument = await io.writeJSON(document);
      if (LOG_SERIALIZED_DOCUMENTS) {
        console.log(JSON.stringify(jsonDocument.json, null, 2));
      }
    }
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
    await StructuralMetadataMerger.mergeDocumentsWithStructuralMetadata(
      document,
      documentA,
      specSchemaUriResolver
    );

    // After merging in the first document:
    // There should be one class
    expect(getMetadataClassNames(document)).toEqual(["exampleClass"]);

    await StructuralMetadataMerger.mergeDocumentsWithStructuralMetadata(
      document,
      documentB,
      specSchemaUriResolver
    );

    // After merging in the second document:
    // There should be two classes, with the second one have a disambiguated name/key
    expect(getMetadataClassNames(document).sort()).toEqual(
      ["exampleClass", "exampleClass_0"].sort()
    );

    if (SERIALIZE_DOCUMENTS) {
      const io = await GltfTransform.getIO();
      const jsonDocument = await io.writeJSON(document);
      if (LOG_SERIALIZED_DOCUMENTS) {
        console.log(JSON.stringify(jsonDocument.json, null, 2));
      }
    }
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
    await StructuralMetadataMerger.mergeDocumentsWithStructuralMetadata(
      document,
      documentA,
      specSchemaUriResolver
    );

    // After merging in the first document:
    // There should be one enum and one class
    expect(getMetadataEnumNames(document)).toEqual(["exampleEnum"]);
    expect(getMetadataClassNames(document)).toEqual(["exampleClass"]);

    await StructuralMetadataMerger.mergeDocumentsWithStructuralMetadata(
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

    if (SERIALIZE_DOCUMENTS) {
      const io = await GltfTransform.getIO();
      const jsonDocument = await io.writeJSON(document);
      if (LOG_SERIALIZED_DOCUMENTS) {
        console.log(JSON.stringify(jsonDocument.json, null, 2));
      }
    }
  });

  //==========================================================================
  // Handling of schemaUri

  it("resolve schemas from schemaUri and merges them into one that is inlined", async function () {
    // These objects will be returned by the "localSchemaUriResolver"
    // that is defined below, emulating the schemas that are resolved
    // from schema URIs
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

    const localSchemaUriResolver = async (schemaUri: string) => {
      if (schemaUri === "schemaA.json") {
        return schemaA;
      }
      if (schemaUri === "schemaB.json") {
        return schemaB;
      }
      console.error("Unexpected schema URI: " + schemaUri);
      const schema = {
        id: "SPEC_SCHEMA_FROM_URI_" + schemaUri,
      };
      return schema;
    };

    const documentA = new Document();
    documentA.createBuffer();
    const structuralMetadataA = obtainStructuralMetadata(documentA);
    structuralMetadataA.setSchemaUri("schemaA.json");

    const documentB = new Document();
    documentB.createBuffer();
    const structuralMetadataB = obtainStructuralMetadata(documentB);
    structuralMetadataB.setSchemaUri("schemaB.json");

    const document = new Document();
    await StructuralMetadataMerger.mergeDocumentsWithStructuralMetadata(
      document,
      documentA,
      localSchemaUriResolver
    );

    // After merging in the first document:
    // There should be one class
    expect(getMetadataClassNames(document).length).toBe(1);

    // The schemaUri in the result should be "null"
    const root = document.getRoot();
    const structuralMetadata = root.getExtension<StructuralMetadata>(
      "EXT_structural_metadata"
    );
    expect(structuralMetadata?.getSchemaUri()).toBe(null);

    await StructuralMetadataMerger.mergeDocumentsWithStructuralMetadata(
      document,
      documentB,
      localSchemaUriResolver
    );

    // After merging in the second document:
    // There should be two classes
    expect(getMetadataClassNames(document).length).toBe(2);

    // The schemaUri in the result should still be "null"
    expect(structuralMetadata?.getSchemaUri()).toBe(null);

    if (SERIALIZE_DOCUMENTS) {
      const io = await GltfTransform.getIO();
      const jsonDocument = await io.writeJSON(document);
      if (LOG_SERIALIZED_DOCUMENTS) {
        console.log(JSON.stringify(jsonDocument.json, null, 2));
      }
    }
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
    await StructuralMetadataMerger.mergeDocumentsWithStructuralMetadata(
      document,
      documentA,
      specSchemaUriResolver
    );

    // After merging in the first document:
    // There should be one class
    // There should be one property table
    expect(getMetadataClassNames(document)).toEqual(["exampleClass"]);
    expect(getNumPropertyTables(document)).toBe(1);

    await StructuralMetadataMerger.mergeDocumentsWithStructuralMetadata(
      document,
      documentB,
      specSchemaUriResolver
    );

    // After merging in the second document:
    // There should still be one class
    // There should be two property tables
    expect(getMetadataClassNames(document)).toEqual(["exampleClass"]);
    expect(getNumPropertyTables(document)).toBe(2);

    if (SERIALIZE_DOCUMENTS) {
      const io = await GltfTransform.getIO();
      const jsonDocument = await io.writeJSON(document);
      if (LOG_SERIALIZED_DOCUMENTS) {
        console.log(JSON.stringify(jsonDocument.json, null, 2));
      }
    }
  });

  it("merges the set of property tables and updates their class for disambiguated classes", async function () {
    // The classes have the same name/key
    // The classes are structurally different
    // The property tables refer to the respective class
    // The result should be:
    // One class
    // Two property tables
    // One referring to the disambiguated class

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
    await StructuralMetadataMerger.mergeDocumentsWithStructuralMetadata(
      document,
      documentA,
      specSchemaUriResolver
    );

    // After merging in the first document:
    // There should be one class
    // There should be one property table
    expect(getMetadataClassNames(document)).toEqual(["exampleClass"]);
    expect(getNumPropertyTables(document)).toBe(1);

    await StructuralMetadataMerger.mergeDocumentsWithStructuralMetadata(
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

    if (SERIALIZE_DOCUMENTS) {
      const io = await GltfTransform.getIO();
      const jsonDocument = await io.writeJSON(document);
      if (LOG_SERIALIZED_DOCUMENTS) {
        console.log(JSON.stringify(jsonDocument.json, null, 2));
      }
    }
  });

  //==========================================================================
  // Basic property attribute merging

  it("merges the set of property attributes for one resulting class", async function () {
    // The classes have the same name/key
    // The classes are structurally equal
    // The property attributes refer to the respective class (which turns out to be equal)
    // The result should be:
    // One class
    // ONE property attribute (because the property attributes turn out to be equal as well!)

    const schemaA = {
      id: "EXAMPLE_SCHEMA_ID",
      classes: {
        exampleClass: {
          name: "Example Class",
          properties: {
            example_INT8_SCALAR: {
              name: "Example SCALAR property with INT8 components",
              description:
                "An example property, with type SCALAR, with component type INT8",
              type: "SCALAR",
              componentType: "INT8",
              array: false,
              normalized: false,
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
            example_INT8_SCALAR: {
              name: "Example SCALAR property with INT8 components",
              description:
                "An example property, with type SCALAR, with component type INT8",
              type: "SCALAR",
              componentType: "INT8",
              array: false,
              normalized: false,
            },
          },
        },
      },
    };

    const documentA = new Document();
    documentA.createBuffer();
    assignMetadataSchema(documentA, schemaA);
    addSpecPropertyAttribute(documentA, "exampleClass");

    const documentB = new Document();
    documentB.createBuffer();
    assignMetadataSchema(documentB, schemaB);
    addSpecPropertyAttribute(documentB, "exampleClass");

    const document = new Document();
    await StructuralMetadataMerger.mergeDocumentsWithStructuralMetadata(
      document,
      documentA,
      specSchemaUriResolver
    );

    // After merging in the first document:
    // There should be one class
    // There should be one property attribute
    expect(getMetadataClassNames(document)).toEqual(["exampleClass"]);
    expect(getNumPropertyAttributes(document)).toBe(1);

    await StructuralMetadataMerger.mergeDocumentsWithStructuralMetadata(
      document,
      documentB,
      specSchemaUriResolver
    );

    // After merging in the second document:
    // There should still be one class
    // There should be ONE property attribute (because they are equal)
    expect(getMetadataClassNames(document)).toEqual(["exampleClass"]);
    expect(getNumPropertyAttributes(document)).toBe(1);

    if (SERIALIZE_DOCUMENTS) {
      const io = await GltfTransform.getIO();
      const jsonDocument = await io.writeJSON(document);
      if (LOG_SERIALIZED_DOCUMENTS) {
        console.log(JSON.stringify(jsonDocument.json, null, 2));
      }
    }
  });

  it("merges the set of property attributes and updates their class for disambiguated classes", async function () {
    // The classes have the same name/key
    // The classes are structurally different
    // The property attributes refer to the respective class
    // The result should be:
    // Two classes
    // Two property attributes (because the second one refers to a different class now!)

    const schemaA = {
      id: "EXAMPLE_SCHEMA_ID",
      classes: {
        exampleClass: {
          name: "Example Class",
          properties: {
            example_INT8_SCALAR: {
              name: "Example SCALAR property with INT8 components",
              description:
                "An example property, with type SCALAR, with component type INT8",
              type: "SCALAR",
              componentType: "INT8",
              array: false,
              normalized: false,
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
            example_INT8_SCALAR: {
              name: "Example SCALAR property with INT8 components",
              description:
                "An example property, with type SCALAR, with component type INT8",
              type: "SCALAR",
              componentType: "INT8",
              array: false,
              normalized: false,
            },
          },
        },
      },
    };

    const documentA = new Document();
    documentA.createBuffer();
    assignMetadataSchema(documentA, schemaA);
    addSpecPropertyAttribute(documentA, "exampleClass");

    const documentB = new Document();
    documentB.createBuffer();
    assignMetadataSchema(documentB, schemaB);
    addSpecPropertyAttribute(documentB, "exampleClass");

    const document = new Document();
    await StructuralMetadataMerger.mergeDocumentsWithStructuralMetadata(
      document,
      documentA,
      specSchemaUriResolver
    );

    // After merging in the first document:
    // There should be one class
    // There should be one property attribute
    expect(getMetadataClassNames(document)).toEqual(["exampleClass"]);
    expect(getNumPropertyAttributes(document)).toBe(1);

    await StructuralMetadataMerger.mergeDocumentsWithStructuralMetadata(
      document,
      documentB,
      specSchemaUriResolver
    );

    // After merging in the second document:
    // There should be two classes
    // There should be two property attributes
    expect(getMetadataClassNames(document).sort()).toEqual(
      ["exampleClass", "exampleClass_0"].sort()
    );
    expect(getNumPropertyAttributes(document)).toBe(2);

    // Expect the second property attribute to refer to the
    // renamed class
    const propertyAttribute1 = getPropertyAttribute(document, 1);
    expect(propertyAttribute1.getClass()).toBe("exampleClass_0");

    if (SERIALIZE_DOCUMENTS) {
      const io = await GltfTransform.getIO();
      const jsonDocument = await io.writeJSON(document);
      if (LOG_SERIALIZED_DOCUMENTS) {
        console.log(JSON.stringify(jsonDocument.json, null, 2));
      }
    }
  });

  //==========================================================================
  // Basic property texture merging

  it("merges the set of equal property textures for one resulting class", async function () {
    // The classes have the same name/key
    // The classes are structurally equal
    // The property textures refer to the respective class (which turns out to be equal)
    // The property textures have the same content (i.e. they are equal)
    // The result should be:
    // One class
    // ONE property texture (because they turn out to be equal)

    const schemaA = {
      id: "EXAMPLE_SCHEMA_ID",
      classes: {
        exampleClass: {
          name: "Example Class",
          properties: {
            example_INT8_SCALAR: {
              name: "Example SCALAR property with INT8 components",
              description:
                "An example property, with type SCALAR, with component type INT8",
              type: "SCALAR",
              componentType: "INT8",
              array: false,
              normalized: false,
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
            example_INT8_SCALAR: {
              name: "Example SCALAR property with INT8 components",
              description:
                "An example property, with type SCALAR, with component type INT8",
              type: "SCALAR",
              componentType: "INT8",
              array: false,
              normalized: false,
            },
          },
        },
      },
    };

    const documentA = new Document();
    documentA.createBuffer();
    assignMetadataSchema(documentA, schemaA);
    await addSpecPropertyTexture(documentA, "exampleClass", 12); // Same as below

    const documentB = new Document();
    documentB.createBuffer();
    assignMetadataSchema(documentB, schemaB);
    await addSpecPropertyTexture(documentB, "exampleClass", 12); // Same as above

    const document = new Document();
    await StructuralMetadataMerger.mergeDocumentsWithStructuralMetadata(
      document,
      documentA,
      specSchemaUriResolver
    );

    // After merging in the first document:
    // There should be one class
    // There should be one property texture
    expect(getMetadataClassNames(document)).toEqual(["exampleClass"]);
    expect(getNumPropertyTextures(document)).toBe(1);

    await StructuralMetadataMerger.mergeDocumentsWithStructuralMetadata(
      document,
      documentB,
      specSchemaUriResolver
    );

    // After merging in the second document:
    // There should still be one class
    // There should be ONE property texture (because the inputs are equal)
    expect(getMetadataClassNames(document)).toEqual(["exampleClass"]);
    expect(getNumPropertyTextures(document)).toBe(1);

    if (SERIALIZE_DOCUMENTS) {
      const io = await GltfTransform.getIO();
      const jsonDocument = await io.writeJSON(document);
      if (LOG_SERIALIZED_DOCUMENTS) {
        console.log(JSON.stringify(jsonDocument.json, null, 2));
      }
    }
  });

  it("merges the set of different property textures for one resulting class", async function () {
    // The classes have the same name/key
    // The classes are structurally equal
    // The property textures refer to the respective class (which turns out to be equal)
    // The property textures have different content (i.e. they are not equal)
    // The result should be:
    // One class
    // Two property textures

    const schemaA = {
      id: "EXAMPLE_SCHEMA_ID",
      classes: {
        exampleClass: {
          name: "Example Class",
          properties: {
            example_INT8_SCALAR: {
              name: "Example SCALAR property with INT8 components",
              description:
                "An example property, with type SCALAR, with component type INT8",
              type: "SCALAR",
              componentType: "INT8",
              array: false,
              normalized: false,
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
            example_INT8_SCALAR: {
              name: "Example SCALAR property with INT8 components",
              description:
                "An example property, with type SCALAR, with component type INT8",
              type: "SCALAR",
              componentType: "INT8",
              array: false,
              normalized: false,
            },
          },
        },
      },
    };

    const documentA = new Document();
    documentA.createBuffer();
    assignMetadataSchema(documentA, schemaA);
    await addSpecPropertyTexture(documentA, "exampleClass", 12); // Other than below

    const documentB = new Document();
    documentB.createBuffer();
    assignMetadataSchema(documentB, schemaB);
    await addSpecPropertyTexture(documentB, "exampleClass", 23); // Other than above

    const document = new Document();
    await StructuralMetadataMerger.mergeDocumentsWithStructuralMetadata(
      document,
      documentA,
      specSchemaUriResolver
    );

    // After merging in the first document:
    // There should be one class
    // There should be one property texture
    expect(getMetadataClassNames(document)).toEqual(["exampleClass"]);
    expect(getNumPropertyTextures(document)).toBe(1);

    await StructuralMetadataMerger.mergeDocumentsWithStructuralMetadata(
      document,
      documentB,
      specSchemaUriResolver
    );

    // After merging in the second document:
    // There should still be one class
    // There should be two property textures
    expect(getMetadataClassNames(document)).toEqual(["exampleClass"]);
    expect(getNumPropertyTextures(document)).toBe(2);

    if (SERIALIZE_DOCUMENTS) {
      const io = await GltfTransform.getIO();
      const jsonDocument = await io.writeJSON(document);
      if (LOG_SERIALIZED_DOCUMENTS) {
        console.log(JSON.stringify(jsonDocument.json, null, 2));
      }
    }
  });

  it("merges the set of property textures and updates their class for disambiguated classes", async function () {
    // The classes have the same name/key
    // The classes are structurally different
    // The property textures refer to the respective class
    // The result should be:
    // One class
    // Two property textures
    // One referring to the disambiguated class

    const schemaA = {
      id: "EXAMPLE_SCHEMA_ID",
      classes: {
        exampleClass: {
          name: "Example Class",
          properties: {
            example_INT8_SCALAR: {
              name: "Example SCALAR property with INT8 components",
              description:
                "An example property, with type SCALAR, with component type INT8",
              type: "SCALAR",
              componentType: "INT8",
              array: false,
              normalized: false,
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
            example_INT8_SCALAR: {
              name: "Example SCALAR property with INT8 components",
              description:
                "An example property, with type SCALAR, with component type INT8",
              type: "SCALAR",
              componentType: "INT8",
              array: false,
              normalized: false,
            },
          },
        },
      },
    };

    const documentA = new Document();
    documentA.createBuffer();
    assignMetadataSchema(documentA, schemaA);
    await addSpecPropertyTexture(documentA, "exampleClass", 12);

    const documentB = new Document();
    documentB.createBuffer();
    assignMetadataSchema(documentB, schemaB);
    await addSpecPropertyTexture(documentB, "exampleClass", 23);

    const document = new Document();
    await StructuralMetadataMerger.mergeDocumentsWithStructuralMetadata(
      document,
      documentA,
      specSchemaUriResolver
    );

    // After merging in the first document:
    // There should be one class
    // There should be one property texture
    expect(getMetadataClassNames(document)).toEqual(["exampleClass"]);
    expect(getNumPropertyTextures(document)).toBe(1);

    await StructuralMetadataMerger.mergeDocumentsWithStructuralMetadata(
      document,
      documentB,
      specSchemaUriResolver
    );

    // After merging in the second document:
    // There should be two classes
    // There should be two property textures
    expect(getMetadataClassNames(document).sort()).toEqual(
      ["exampleClass", "exampleClass_0"].sort()
    );
    expect(getNumPropertyTextures(document)).toBe(2);

    // Expect the second property texture to refer to the
    // renamed class
    const propertyTexture1 = getPropertyTexture(document, 1);
    expect(propertyTexture1.getClass()).toBe("exampleClass_0");

    if (SERIALIZE_DOCUMENTS) {
      const io = await GltfTransform.getIO();
      const jsonDocument = await io.writeJSON(document);
      if (LOG_SERIALIZED_DOCUMENTS) {
        console.log(JSON.stringify(jsonDocument.json, null, 2));
      }
    }
  });
});

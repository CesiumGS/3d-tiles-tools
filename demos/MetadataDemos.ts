import { defaultValue } from "../src/base/defaultValue";
import { readJsonUnchecked } from "./readJsonUnchecked";

import { MetadataClass } from "../src/structure/Metadata/MetadataClass";
import { Tileset } from "../src/structure/Tileset";

import { MetadataEntityModels } from "../src/metadata/MetadataEntityModels";

/**
 * Test the `MetadataEntityModels` class for the type
 * "exampleScalarInt32"
 */
function testExampleScalarInt32() {
  console.log("exampleScalarInt32:");
  const metadataClass: MetadataClass = {
    properties: {
      testProperty: {
        type: "SCALAR",
        componentType: "INT32",
      },
    },
  };
  const entityJson = {
    testProperty: 1234,
  };
  const entity = MetadataEntityModels.createFromClass(
    metadataClass,
    entityJson
  );

  const value = entity.getPropertyValue("testProperty");
  console.log("  Property value: " + value);
}

/**
 * Test the `MetadataEntityModels` class for the type
 * "exampleArrayInt16WithDefault"
 */
function testExampleArrayInt16WithDefault() {
  console.log("exampleArrayInt16WithDefault:");
  const metadataClass: MetadataClass = {
    properties: {
      testProperty: {
        array: true,
        type: "SCALAR",
        componentType: "INT16",
        required: false,
        noData: [],
        default: [1, 1, 1],
      },
    },
  };
  const entityJson = {
    testProperty: undefined,
  };
  const entity = MetadataEntityModels.createFromClass(
    metadataClass,
    entityJson
  );
  const value = entity.getPropertyValue("testProperty");
  console.log("  Property value: " + value);
}

/**
 * Test the `MetadataEntityModels` class for the type
 * "exampleVec3Uint16Normalized"
 */
function testExampleVec3Uint16Normalized() {
  console.log("exampleVec3Uint16Normalized:");
  const metadataClass: MetadataClass = {
    properties: {
      testProperty: {
        type: "VEC3",
        componentType: "UINT16",
        normalized: true,
      },
    },
  };
  const entityJson = {
    testProperty: [0, 32767, 65535],
  };
  const entity = MetadataEntityModels.createFromClass(
    metadataClass,
    entityJson
  );
  const value = entity.getPropertyValue("testProperty");
  console.log("  Property value: " + value);
}

/**
 * Creates a string for a (metadata property) value.
 * The exact format is not specified. This is only
 * intended for the demo. But the string will be
 * exhaustive.
 *
 * @param value - The value
 * @returns The string
 */
function createValueString(value: any) {
  let result = "";
  if (Array.isArray(value)) {
    result += "[";
    for (let i = 0; i < value.length; i++) {
      if (i > 0) {
        result += ", ";
      }
      result += createValueString(value[i]);
    }
    result += "]";
    return result;
  }
  if (typeof value === "string") {
    return '"' + value + '"';
  }
  return value.toString();
}

/**
 * Prints all properties of the `TilesetWithFullMetadata` sample
 * data, as they are obtained via a `MetadataEntityModel`.
 */
async function testTilesetWithFullMetadata() {
  // Note: This is making some assumptions about
  // the input, and only intended for the basic
  // demo of the `MetadataEntityModels` class
  const tileset: Tileset = readJsonUnchecked(
    "./specs/data/TilesetWithFullMetadata/tileset.json"
  );
  const metadataSchema = tileset.schema;
  const metadataEntity = tileset.metadata;
  if (!metadataSchema || !metadataEntity) {
    console.log("Test input was invalid");
    return;
  }
  const entity = MetadataEntityModels.create(metadataSchema, metadataEntity);

  console.log("Metadata property values:");
  const metadataClasses = defaultValue(metadataSchema.classes, {});
  const metadataClass = metadataClasses["exampleClass"];
  const properties = metadataClass.properties ?? {};
  for (const propertyName of Object.keys(properties)) {
    const nameString = propertyName.padStart(60);
    const value = entity.getPropertyValue(propertyName);
    const valueString = createValueString(value);
    console.log(`  Property value of ${nameString}: ${valueString}`);
  }
}

function runDemos() {
  testExampleScalarInt32();
  testExampleArrayInt16WithDefault();
  testExampleVec3Uint16Normalized();
  testTilesetWithFullMetadata();
}

runDemos();

/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { readJsonUnchecked } from "./metadata/readJsonUnchecked";

import { Tileset } from "../src/structure/Tileset";

import { BatchTableClassProperties } from "../src/migration/BatchTableClassProperties";

describe("BatchTableClassProperties", function () {
  it("obtains the right type for example_fixed_length_STRING_array", async function () {
    const propertyName = "example_fixed_length_STRING_array";
    const tileset = (await readJsonUnchecked(
      "specs/data/TilesetWithFullMetadata/tileset.json"
    )) as Tileset;
    const metadata = tileset.metadata!;
    const value = metadata.properties![propertyName];

    const classProperty = BatchTableClassProperties.createClassProperty(
      propertyName,
      value
    );
    expect(classProperty.type).toBe("STRING");
    expect(classProperty.componentType).toBeUndefined();
    expect(classProperty.array).toBeFalsy();
    expect(classProperty.count).toBeUndefined();
  });
});

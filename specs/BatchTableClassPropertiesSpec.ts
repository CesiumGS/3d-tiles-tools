import { readJsonUnchecked } from "./metadata/readJsonUnchecked";
import { BatchTableClassProperties } from "../src/migration/BatchTableClassProperties";

describe("BatchTableClassProperties", function () {
  it("obtains the right type for example_STRING", async function () {
    const propertyName = "example_STRING";
    const tileset = await readJsonUnchecked(
      "specs/data/TilesetWithFullMetadata/tileset.json"
    );
    const metadata = tileset.metadata;
    const value = metadata[propertyName];

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

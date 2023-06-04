import { readJsonUnchecked } from "./metadata/readJsonUnchecked";
import { BatchTableClassProperties } from "../src/migration/BatchTableClassProperties";

describe("BatchTableClassProperties", function () {
  beforeEach(async function () {
    const tileset = await readJsonUnchecked(
      "specs/data/TilesetWithFullMetadata/tileset.json"
    );
    this.metadata = tileset.metadata;
  });

  it("obtains the right type for example_STRING", function () {
    const propertyName = "example_STRING";
    const value = this.metadata[propertyName];

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

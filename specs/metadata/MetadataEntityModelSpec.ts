import { MetadataEntityModels } from "../../src/metadata/MetadataEntityModels";
import { MetadataClass } from "../../src/structure/Metadata/MetadataClass";

// NOTE: The tests here aim at testing the handling of default- and noData
// values, as well as the handling of offset/scale and the mechanism of
// overriding the offset/scale from the property definition with an
// offset/scale in the entity itself. The values are chosen to not
// require any "epslion" of the comparisons.

describe("metadata/MetadataEntityModel", function () {
  it("throws when the value of an unknown property is accessed", function () {
    expect(function () {
      const testMetadataClass: MetadataClass = {
        properties: {},
      };
      const entityJson = {
        testProperty: 1234,
      };
      const entity = MetadataEntityModels.createFromClass(
        testMetadataClass,
        entityJson
      );
      entity.getPropertyValue("testProperty");
    }).toThrow();
  });

  it("obtains a default value for a scalar int32 value", function () {
    const testMetadataClass: MetadataClass = {
      properties: {
        testProperty: {
          type: "SCALAR",
          componentType: "INT32",
          default: 1234,
        },
      },
    };
    const entityJson = {
      testProperty: undefined,
    };
    const entity = MetadataEntityModels.createFromClass(
      testMetadataClass,
      entityJson
    );
    const value = entity.getPropertyValue("testProperty");
    expect(value).toBe(1234);
  });

  it("obtains a default value for a scalar int32 noData value", function () {
    const testMetadataClass: MetadataClass = {
      properties: {
        testProperty: {
          type: "SCALAR",
          componentType: "INT32",
          noData: 2345,
          default: 1234,
        },
      },
    };
    const entityJson = {
      testProperty: 2345,
    };
    const entity = MetadataEntityModels.createFromClass(
      testMetadataClass,
      entityJson
    );
    const value = entity.getPropertyValue("testProperty");
    expect(value).toBe(1234);
  });

  it("obtains a value for a vec3 float32 value with offset in property definition", function () {
    const testMetadataClass: MetadataClass = {
      properties: {
        testProperty: {
          type: "VEC3",
          componentType: "FLOAT32",
          offset: [1.0, 2.0, 3.0],
        },
      },
    };
    const entityJson = {
      testProperty: [3.0, 4.0, 5.0],
    };
    const entity = MetadataEntityModels.createFromClass(
      testMetadataClass,
      entityJson
    );
    const value = entity.getPropertyValue("testProperty");
    const expected = [4.0, 6.0, 8.0];
    expect(value).toEqual(expected);
  });

  it("obtains a value for a vec3 float32 value with scale in property definition", function () {
    const testMetadataClass: MetadataClass = {
      properties: {
        testProperty: {
          type: "VEC3",
          componentType: "FLOAT32",
          scale: [2.0, 3.0, 4.0],
        },
      },
    };
    const entityJson = {
      testProperty: [3.0, 4.0, 5.0],
    };
    const entity = MetadataEntityModels.createFromClass(
      testMetadataClass,
      entityJson
    );
    const value = entity.getPropertyValue("testProperty");
    const expected = [6.0, 12.0, 20.0];
    expect(value).toEqual(expected);
  });

  it("obtains a value for a vec3 float32 value with offset and scale in property definition", function () {
    const testMetadataClass: MetadataClass = {
      properties: {
        testProperty: {
          type: "VEC3",
          componentType: "FLOAT32",
          offset: [1.0, 2.0, 3.0],
          scale: [2.0, 3.0, 4.0],
        },
      },
    };
    const entityJson = {
      testProperty: [3.0, 4.0, 5.0],
    };
    const entity = MetadataEntityModels.createFromClass(
      testMetadataClass,
      entityJson
    );
    const value = entity.getPropertyValue("testProperty");
    const expected = [7.0, 14.0, 23.0];
    expect(value).toEqual(expected);
  });

  it("obtains a value for a vec3 float32 value with offset in property definition and scale in entity", function () {
    const testMetadataClass: MetadataClass = {
      properties: {
        testProperty: {
          type: "VEC3",
          componentType: "FLOAT32",
          offset: [1.0, 2.0, 3.0],
        },
      },
    };
    const entityJson = {
      testProperty: [3.0, 4.0, 5.0],
      scale: [2.0, 3.0, 4.0],
    };
    const entity = MetadataEntityModels.createFromClass(
      testMetadataClass,
      entityJson
    );
    const value = entity.getPropertyValue("testProperty");
    const expected = [7.0, 14.0, 23.0];
    expect(value).toEqual(expected);
  });

  it("obtains a value for a vec3 float32 value with offset in entity and scale in property definition", function () {
    const testMetadataClass: MetadataClass = {
      properties: {
        testProperty: {
          type: "VEC3",
          componentType: "FLOAT32",
          scale: [2.0, 3.0, 4.0],
        },
      },
    };
    const entityJson = {
      testProperty: [3.0, 4.0, 5.0],
      offset: [1.0, 2.0, 3.0],
    };
    const entity = MetadataEntityModels.createFromClass(
      testMetadataClass,
      entityJson
    );
    const value = entity.getPropertyValue("testProperty");
    const expected = [7.0, 14.0, 23.0];
    expect(value).toEqual(expected);
  });

  it("obtains a value for a vec3 float32 value with offset in property definition, and overriding offset in entity", function () {
    const testMetadataClass: MetadataClass = {
      properties: {
        testProperty: {
          type: "VEC3",
          componentType: "FLOAT32",
          offset: [100.0, 200.0, 300.0],
        },
      },
    };
    const entityJson = {
      testProperty: [3.0, 4.0, 5.0],
      offset: [1.0, 2.0, 3.0],
    };
    const entity = MetadataEntityModels.createFromClass(
      testMetadataClass,
      entityJson
    );
    const value = entity.getPropertyValue("testProperty");
    const expected = [4.0, 6.0, 8.0];
    expect(value).toEqual(expected);
  });

  it("obtains a value for a vec3 float32 value with scale in property definition, and overriding scale in entity", function () {
    const testMetadataClass: MetadataClass = {
      properties: {
        testProperty: {
          type: "VEC3",
          componentType: "FLOAT32",
          scale: [200.0, 300.0, 400.0],
        },
      },
    };
    const entityJson = {
      testProperty: [3.0, 4.0, 5.0],
      scale: [2.0, 3.0, 4.0],
    };
    const entity = MetadataEntityModels.createFromClass(
      testMetadataClass,
      entityJson
    );
    const value = entity.getPropertyValue("testProperty");
    const expected = [6.0, 12.0, 20.0];
    expect(value).toEqual(expected);
  });

  it("obtains a value for a vec3 float32 value with offset and scale in property definition, and overriding offset and scale in entity", function () {
    const testMetadataClass: MetadataClass = {
      properties: {
        testProperty: {
          type: "VEC3",
          componentType: "FLOAT32",
          offset: [100.0, 200.0, 300.0],
          scale: [200.0, 300.0, 400.0],
        },
      },
    };
    const entityJson = {
      testProperty: [3.0, 4.0, 5.0],
      offset: [1.0, 2.0, 3.0],
      scale: [2.0, 3.0, 4.0],
    };
    const entity = MetadataEntityModels.createFromClass(
      testMetadataClass,
      entityJson
    );
    const value = entity.getPropertyValue("testProperty");
    const expected = [7.0, 14.0, 23.0];
    expect(value).toEqual(expected);
  });
});

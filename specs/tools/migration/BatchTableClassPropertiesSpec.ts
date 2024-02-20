import { BatchTableClassProperties } from "../../../src/tools";

describe("BatchTableClassProperties", function () {
  it("obtains the right type for STRING values", async function () {
    const propertyName = "specProperty";
    const value = ["a", "b", "c"];
    const classProperty = BatchTableClassProperties.createClassProperty(
      propertyName,
      value
    );
    expect(classProperty.type).toBe("STRING");
    expect(classProperty.componentType).toBeUndefined();
    expect(classProperty.array).toBeFalsy();
    expect(classProperty.count).toBeUndefined();
  });

  it("obtains the right type for STRING array values", async function () {
    const propertyName = "specProperty";
    const value = [
      ["a", "b"],
      ["c", "d"],
    ];
    const classProperty = BatchTableClassProperties.createClassProperty(
      propertyName,
      value
    );
    expect(classProperty.type).toBe("STRING");
    expect(classProperty.componentType).toBeUndefined();
    expect(classProperty.array).toBeTrue();
    expect(classProperty.count).toBe(2);
  });

  it("obtains the right type for BOOLEAN values", async function () {
    const propertyName = "specProperty";
    const value = [true, false, true, false];
    const classProperty = BatchTableClassProperties.createClassProperty(
      propertyName,
      value
    );
    expect(classProperty.type).toBe("BOOLEAN");
    expect(classProperty.componentType).toBeUndefined();
    expect(classProperty.array).toBeFalsy();
    expect(classProperty.count).toBeUndefined();
  });

  it("obtains the right type for BOOLEAN array values", async function () {
    const propertyName = "specProperty";
    const value = [
      [true, false],
      [true, false],
    ];
    const classProperty = BatchTableClassProperties.createClassProperty(
      propertyName,
      value
    );
    expect(classProperty.type).toBe("BOOLEAN");
    expect(classProperty.componentType).toBeUndefined();
    expect(classProperty.array).toBeTrue();
    expect(classProperty.count).toBe(2);
  });

  it("obtains the right type for UINT8 values", async function () {
    const propertyName = "specProperty";
    const value = [12, 23, 34, 45];
    const classProperty = BatchTableClassProperties.createClassProperty(
      propertyName,
      value
    );
    expect(classProperty.type).toBe("SCALAR");
    expect(classProperty.componentType).toBe("UINT8");
    expect(classProperty.array).toBeFalse();
    expect(classProperty.count).toBeUndefined();
  });

  it("obtains the right type for UINT8 array values", async function () {
    const propertyName = "specProperty";
    const value = [
      [12, 23],
      [34, 45],
    ];
    const classProperty = BatchTableClassProperties.createClassProperty(
      propertyName,
      value
    );
    expect(classProperty.type).toBe("SCALAR");
    expect(classProperty.componentType).toBe("UINT8");
    expect(classProperty.array).toBeTrue();
    expect(classProperty.count).toBe(2);
  });

  it("obtains the right type for INT8 values", async function () {
    const propertyName = "specProperty";
    const value = [12, -23, 34, -45];
    const classProperty = BatchTableClassProperties.createClassProperty(
      propertyName,
      value
    );
    expect(classProperty.type).toBe("SCALAR");
    expect(classProperty.componentType).toBe("INT8");
    expect(classProperty.array).toBeFalse();
    expect(classProperty.count).toBeUndefined();
  });

  it("obtains the right type for INT8 values", async function () {
    const propertyName = "specProperty";
    const value = [
      [12, -23],
      [34, -45],
    ];
    const classProperty = BatchTableClassProperties.createClassProperty(
      propertyName,
      value
    );
    expect(classProperty.type).toBe("SCALAR");
    expect(classProperty.componentType).toBe("INT8");
    expect(classProperty.array).toBeTrue();
    expect(classProperty.count).toBe(2);
  });

  it("obtains the right type for FLOAT32 values", async function () {
    const propertyName = "specProperty";
    const value = [12.34, 23.45, 34.56, 45.67];
    const classProperty = BatchTableClassProperties.createClassProperty(
      propertyName,
      value
    );
    expect(classProperty.type).toBe("SCALAR");
    expect(classProperty.componentType).toBe("FLOAT32");
    expect(classProperty.array).toBeFalse();
    expect(classProperty.count).toBeUndefined();
  });

  it("obtains the right type for FLOAT32 array values", async function () {
    const propertyName = "specProperty";
    const value = [
      [12.34, 23.45],
      [34.56, 45.67],
    ];
    const classProperty = BatchTableClassProperties.createClassProperty(
      propertyName,
      value
    );
    expect(classProperty.type).toBe("SCALAR");
    expect(classProperty.componentType).toBe("FLOAT32");
    expect(classProperty.array).toBeTrue();
    expect(classProperty.count).toBe(2);
  });

  it("obtains the right type for FLOAT32 variable length array values with", async function () {
    const propertyName = "specProperty";
    const value = [
      [12.34, 23.45],
      [34.56, 45.67, 56.78, 67.89],
    ];
    const classProperty = BatchTableClassProperties.createClassProperty(
      propertyName,
      value
    );
    expect(classProperty.type).toBe("SCALAR");
    expect(classProperty.componentType).toBe("FLOAT32");
    expect(classProperty.array).toBeTrue();
    expect(classProperty.count).toBeUndefined();
  });
});

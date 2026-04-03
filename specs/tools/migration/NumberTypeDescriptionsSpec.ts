import { NumberTypeDescriptions } from "../../../src/tools";

describe("NumberTypeDescriptions", function () {
  //==========================================================================
  // Single values

  it("detects UINT8 from a single value", function () {
    const input = 0;
    const actual = NumberTypeDescriptions.computeComponentType(input);
    const expected = "UINT8";
    expect(actual).toBe(expected);
  });

  it("detects FLOAT32 from a single value", function () {
    const input = 12.34;
    const actual = NumberTypeDescriptions.computeComponentType(input);
    const expected = "FLOAT32";
    expect(actual).toBe(expected);
  });

  it("detects UINT8 from a single value", function () {
    const input = 255;
    const actual = NumberTypeDescriptions.computeComponentType(input);
    const expected = "UINT8";
    expect(actual).toBe(expected);
  });

  it("detects UINT16 from a single value", function () {
    const input = 256;
    const actual = NumberTypeDescriptions.computeComponentType(input);
    const expected = "UINT16";
    expect(actual).toBe(expected);
  });

  it("detects INT8 from a single value", function () {
    const input = -128;
    const actual = NumberTypeDescriptions.computeComponentType(input);
    const expected = "INT8";
    expect(actual).toBe(expected);
  });

  it("detects INT16 from a single value", function () {
    const input = -129;
    const actual = NumberTypeDescriptions.computeComponentType(input);
    const expected = "INT16";
    expect(actual).toBe(expected);
  });

  it("detects UINT16 from a single value", function () {
    const input = 65535;
    const actual = NumberTypeDescriptions.computeComponentType(input);
    const expected = "UINT16";
    expect(actual).toBe(expected);
  });

  it("detects UINT32 from a single value", function () {
    const input = 65536;
    const actual = NumberTypeDescriptions.computeComponentType(input);
    const expected = "UINT32";
    expect(actual).toBe(expected);
  });

  it("detects INT16 from a single value", function () {
    const input = -32768;
    const actual = NumberTypeDescriptions.computeComponentType(input);
    const expected = "INT16";
    expect(actual).toBe(expected);
  });

  it("detects INT32 from a single value", function () {
    const input = -32769;
    const actual = NumberTypeDescriptions.computeComponentType(input);
    const expected = "INT32";
    expect(actual).toBe(expected);
  });

  it("detects UINT32 from a single value", function () {
    const input = 4294967295;
    const actual = NumberTypeDescriptions.computeComponentType(input);
    const expected = "UINT32";
    expect(actual).toBe(expected);
  });

  it("detects UINT64 from a single value", function () {
    const input = 4294967296;
    const actual = NumberTypeDescriptions.computeComponentType(input);
    const expected = "UINT64";
    expect(actual).toBe(expected);
  });

  it("detects INT32 from a single value", function () {
    const input = -2147483648;
    const actual = NumberTypeDescriptions.computeComponentType(input);
    const expected = "INT32";
    expect(actual).toBe(expected);
  });

  it("detects INT64 from a single value", function () {
    const input = -2147483649;
    const actual = NumberTypeDescriptions.computeComponentType(input);
    const expected = "INT64";
    expect(actual).toBe(expected);
  });

  //==========================================================================
  // Arrays

  it("detects UINT8 from an array", function () {
    const input = [0, 0];
    const actual = NumberTypeDescriptions.computeComponentType(input);
    const expected = "UINT8";
    expect(actual).toBe(expected);
  });

  it("detects FLOAT32 from an array", function () {
    const input = [12.34, 0];
    const actual = NumberTypeDescriptions.computeComponentType(input);
    const expected = "FLOAT32";
    expect(actual).toBe(expected);
  });

  it("detects UINT8 from an array", function () {
    const input = [255, 0];
    const actual = NumberTypeDescriptions.computeComponentType(input);
    const expected = "UINT8";
    expect(actual).toBe(expected);
  });

  it("detects UINT16 from an array", function () {
    const input = [256, 0];
    const actual = NumberTypeDescriptions.computeComponentType(input);
    const expected = "UINT16";
    expect(actual).toBe(expected);
  });

  it("detects INT8 from an array", function () {
    const input = [-128, 0];
    const actual = NumberTypeDescriptions.computeComponentType(input);
    const expected = "INT8";
    expect(actual).toBe(expected);
  });

  it("detects INT16 from an array", function () {
    const input = [-129, 0];
    const actual = NumberTypeDescriptions.computeComponentType(input);
    const expected = "INT16";
    expect(actual).toBe(expected);
  });

  it("detects UINT16 from an array", function () {
    const input = [65535, 0];
    const actual = NumberTypeDescriptions.computeComponentType(input);
    const expected = "UINT16";
    expect(actual).toBe(expected);
  });

  it("detects UINT32 from an array", function () {
    const input = [65536, 0];
    const actual = NumberTypeDescriptions.computeComponentType(input);
    const expected = "UINT32";
    expect(actual).toBe(expected);
  });

  it("detects INT16 from an array", function () {
    const input = [-32768, 0];
    const actual = NumberTypeDescriptions.computeComponentType(input);
    const expected = "INT16";
    expect(actual).toBe(expected);
  });

  it("detects INT32 from an array", function () {
    const input = [-32769, 0];
    const actual = NumberTypeDescriptions.computeComponentType(input);
    const expected = "INT32";
    expect(actual).toBe(expected);
  });

  it("detects UINT32 from an array", function () {
    const input = [4294967295, 0];
    const actual = NumberTypeDescriptions.computeComponentType(input);
    const expected = "UINT32";
    expect(actual).toBe(expected);
  });

  it("detects UINT64 from an array", function () {
    const input = [4294967296, 0];
    const actual = NumberTypeDescriptions.computeComponentType(input);
    const expected = "UINT64";
    expect(actual).toBe(expected);
  });

  it("detects INT32 from an array", function () {
    const input = [-2147483648, 0];
    const actual = NumberTypeDescriptions.computeComponentType(input);
    const expected = "INT32";
    expect(actual).toBe(expected);
  });

  it("detects INT64 from an array", function () {
    const input = [-2147483649, 0];
    const actual = NumberTypeDescriptions.computeComponentType(input);
    const expected = "INT64";
    expect(actual).toBe(expected);
  });
});

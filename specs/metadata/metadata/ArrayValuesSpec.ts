import { ArrayValues } from "../../../src/metadata";

describe("metadata/ArrayValues", function () {
  //==========================================================================
  // deepMultiply

  it("performs deepMultiply for number,number", function () {
    const value = 2;
    const factor = 3;
    const expected = 2 * 3;
    const actual = ArrayValues.deepMultiply(value, factor);
    expect(actual).toEqual(expected);
  });

  it("performs deepMultiply for number[],number[]", function () {
    const value = [2, 3];
    const factor = [3, 4];
    const expected = [2 * 3, 3 * 4];
    const actual = ArrayValues.deepMultiply(value, factor);
    expect(actual).toEqual(expected);
  });

  it("performs deepMultiply for number[][],number[][]", function () {
    const value = [
      [2, 3],
      [4, 5],
    ];
    const factor = [
      [3, 4],
      [5, 6],
    ];
    const expected = [
      [2 * 3, 3 * 4],
      [4 * 5, 5 * 6],
    ];
    const actual = ArrayValues.deepMultiply(value, factor);
    expect(actual).toEqual(expected);
  });

  //==========================================================================
  // deepAdd

  it("performs deepAdd for number,number", function () {
    const value = 2;
    const factor = 3;
    const expected = 2 + 3;
    const actual = ArrayValues.deepAdd(value, factor);
    expect(actual).toEqual(expected);
  });

  it("performs deepAdd for number[],number[]", function () {
    const value = [2, 3];
    const factor = [3, 4];
    const expected = [2 + 3, 3 + 4];
    const actual = ArrayValues.deepAdd(value, factor);
    expect(actual).toEqual(expected);
  });

  it("performs deepAdd for number[][],number[][]", function () {
    const value = [
      [2, 3],
      [4, 5],
    ];
    const factor = [
      [3, 4],
      [5, 6],
    ];
    const expected = [
      [2 + 3, 3 + 4],
      [4 + 5, 5 + 6],
    ];
    const actual = ArrayValues.deepAdd(value, factor);
    expect(actual).toEqual(expected);
  });

  //==========================================================================
  // deepMin number,number

  it("performs deepMin for number,number", function () {
    const a = 2;
    const b = 3;
    const expected = 2;
    const actual = ArrayValues.deepMin(a, b);
    expect(actual).toEqual(expected);
  });

  it("performs deepMin for number[],number[]", function () {
    const a = [5, 2];
    const b = [3, 4];
    const expected = [3, 2];
    const actual = ArrayValues.deepMin(a, b);
    expect(actual).toEqual(expected);
  });

  it("performs deepMin for number[][],number[][]", function () {
    const a = [
      [5, 2],
      [1, 7],
    ];
    const b = [
      [3, 4],
      [5, 6],
    ];
    const expected = [
      [3, 2],
      [1, 6],
    ];
    const actual = ArrayValues.deepMin(a, b);
    expect(actual).toEqual(expected);
  });

  //==========================================================================
  // deepMin number,bigint

  it("performs deepMin for number,bigint", function () {
    const a = 2;
    const b = BigInt(3);
    const expected = 2;
    const actual = ArrayValues.deepMin(a, b);
    expect(actual).toEqual(expected);
  });

  it("performs deepMin for number[],bigint[]", function () {
    const a = [5, 2];
    const b = [BigInt(3), BigInt(4)];
    const expected = [BigInt(3), 2];
    const actual = ArrayValues.deepMin(a, b);
    expect(actual).toEqual(expected);
  });

  it("performs deepMin for number[][],bigint[][]", function () {
    const a = [
      [5, 2],
      [1, 7],
    ];
    const b = [
      [BigInt(3), BigInt(4)],
      [BigInt(5), BigInt(6)],
    ];
    const expected = [
      [BigInt(3), 2],
      [1, BigInt(6)],
    ];
    const actual = ArrayValues.deepMin(a, b);
    expect(actual).toEqual(expected);
  });

  //==========================================================================
  // deepMin bigint,number

  it("performs deepMin for bigint,number", function () {
    const a = BigInt(2);
    const b = 3;
    const expected = BigInt(2);
    const actual = ArrayValues.deepMin(a, b);
    expect(actual).toEqual(expected);
  });

  it("performs deepMin for bigint[],number[]", function () {
    const a = [BigInt(2), BigInt(3)];
    const b = [3, 4];
    const expected = [BigInt(2), BigInt(3)];
    const actual = ArrayValues.deepMin(a, b);
    expect(actual).toEqual(expected);
  });

  it("performs deepMin for bigint[][],number[][]", function () {
    const a = [
      [BigInt(5), BigInt(2)],
      [BigInt(1), BigInt(7)],
    ];
    const b = [
      [3, 4],
      [5, 6],
    ];
    const expected = [
      [3, BigInt(2)],
      [BigInt(1), 6],
    ];
    const actual = ArrayValues.deepMin(a, b);
    expect(actual).toEqual(expected);
  });

  //==========================================================================
  // deepMin bigint,bigint

  it("performs deepMin for bigint,bigint", function () {
    const a = BigInt(2);
    const b = BigInt(3);
    const expected = BigInt(2);
    const actual = ArrayValues.deepMin(a, b);
    expect(actual).toEqual(expected);
  });

  it("performs deepMin for bigint[],bigint[]", function () {
    const a = [BigInt(5), BigInt(2)];
    const b = [BigInt(3), BigInt(4)];
    const expected = [BigInt(3), BigInt(2)];
    const actual = ArrayValues.deepMin(a, b);
    expect(actual).toEqual(expected);
  });

  it("performs deepMin for bigint[][],bigint[][]", function () {
    const a = [
      [BigInt(5), BigInt(2)],
      [BigInt(1), BigInt(7)],
    ];
    const b = [
      [BigInt(3), BigInt(4)],
      [BigInt(5), BigInt(6)],
    ];
    const expected = [
      [BigInt(3), BigInt(2)],
      [BigInt(1), BigInt(6)],
    ];
    const actual = ArrayValues.deepMin(a, b);
    expect(actual).toEqual(expected);
  });

  //==========================================================================
  // deepMax number,number

  it("performs deepMax for number,number", function () {
    const a = 2;
    const b = 3;
    const expected = 3;
    const actual = ArrayValues.deepMax(a, b);
    expect(actual).toEqual(expected);
  });

  it("performs deepMax for number[],number[]", function () {
    const a = [5, 2];
    const b = [3, 4];
    const expected = [5, 4];
    const actual = ArrayValues.deepMax(a, b);
    expect(actual).toEqual(expected);
  });

  it("performs deepMax for number[][],number[][]", function () {
    const a = [
      [5, 2],
      [1, 7],
    ];
    const b = [
      [3, 4],
      [5, 6],
    ];
    const expected = [
      [5, 4],
      [5, 7],
    ];
    const actual = ArrayValues.deepMax(a, b);
    expect(actual).toEqual(expected);
  });

  //==========================================================================
  // deepMax number,bigint

  it("performs deepMax for number,bigint", function () {
    const a = 2;
    const b = BigInt(3);
    const expected = BigInt(3);
    const actual = ArrayValues.deepMax(a, b);
    expect(actual).toEqual(expected);
  });

  it("performs deepMax for number[],bigint[]", function () {
    const a = [5, 2];
    const b = [BigInt(3), BigInt(4)];
    const expected = [5, BigInt(4)];
    const actual = ArrayValues.deepMax(a, b);
    expect(actual).toEqual(expected);
  });

  it("performs deepMax for number[][],bigint[][]", function () {
    const a = [
      [5, 2],
      [1, 7],
    ];
    const b = [
      [BigInt(3), BigInt(4)],
      [BigInt(5), BigInt(6)],
    ];
    const expected = [
      [5, BigInt(4)],
      [BigInt(5), 7],
    ];
    const actual = ArrayValues.deepMax(a, b);
    expect(actual).toEqual(expected);
  });

  //==========================================================================
  // deepMax bigint,number

  it("performs deepMax for bigint,number", function () {
    const a = BigInt(2);
    const b = 3;
    const expected = 3;
    const actual = ArrayValues.deepMax(a, b);
    expect(actual).toEqual(expected);
  });

  it("performs deepMax for bigint[],number[]", function () {
    const a = [BigInt(5), BigInt(2)];
    const b = [3, 4];
    const expected = [BigInt(5), 4];
    const actual = ArrayValues.deepMax(a, b);
    expect(actual).toEqual(expected);
  });

  it("performs deepMax for bigint[][],number[][]", function () {
    const a = [
      [BigInt(5), BigInt(2)],
      [BigInt(1), BigInt(7)],
    ];
    const b = [
      [3, 4],
      [5, 6],
    ];
    const expected = [
      [BigInt(5), 4],
      [5, BigInt(7)],
    ];
    const actual = ArrayValues.deepMax(a, b);
    expect(actual).toEqual(expected);
  });

  //==========================================================================
  // deepMax bigint,bigint

  it("performs deepMax for bigint,bigint", function () {
    const a = BigInt(2);
    const b = BigInt(3);
    const expected = BigInt(3);
    const actual = ArrayValues.deepMax(a, b);
    expect(actual).toEqual(expected);
  });

  it("performs deepMax for bigint[],bigint[]", function () {
    const a = [BigInt(5), BigInt(2)];
    const b = [BigInt(3), BigInt(4)];
    const expected = [BigInt(5), BigInt(4)];
    const actual = ArrayValues.deepMax(a, b);
    expect(actual).toEqual(expected);
  });

  it("performs deepMax for bigint[][],bigint[][]", function () {
    const a = [
      [BigInt(5), BigInt(2)],
      [BigInt(1), BigInt(7)],
    ];
    const b = [
      [BigInt(3), BigInt(4)],
      [BigInt(5), BigInt(6)],
    ];
    const expected = [
      [BigInt(5), BigInt(4)],
      [BigInt(5), BigInt(7)],
    ];
    const actual = ArrayValues.deepMax(a, b);
    expect(actual).toEqual(expected);
  });

  //==========================================================================
  // anyDeepLessThan number, number

  it("performs anyDeepLessThan for number,number", function () {
    const a = 4;
    const b = 5;
    const expected = true;
    const actual = ArrayValues.anyDeepLessThan(a, b);
    expect(actual).toEqual(expected);
  });

  it("performs anyDeepLessThan for number,number", function () {
    const a = 6;
    const b = 5;
    const expected = false;
    const actual = ArrayValues.anyDeepLessThan(a, b);
    expect(actual).toEqual(expected);
  });

  it("performs anyDeepLessThan for number[],number[]", function () {
    const a = [4, 5];
    const b = [5, 5];
    const expected = true;
    const actual = ArrayValues.anyDeepLessThan(a, b);
    expect(actual).toEqual(expected);
  });
  it("performs anyDeepLessThan for number[],number[]", function () {
    const a = [6, 5];
    const b = [5, 5];
    const expected = false;
    const actual = ArrayValues.anyDeepLessThan(a, b);
    expect(actual).toEqual(expected);
  });

  //==========================================================================
  // anyDeepLessThan bigint, number

  it("performs anyDeepLessThan for bigint,number", function () {
    const a = BigInt(4);
    const b = 5;
    const expected = true;
    const actual = ArrayValues.anyDeepLessThan(a, b);
    expect(actual).toEqual(expected);
  });

  it("performs anyDeepLessThan for bigint,number", function () {
    const a = BigInt(6);
    const b = 5;
    const expected = false;
    const actual = ArrayValues.anyDeepLessThan(a, b);
    expect(actual).toEqual(expected);
  });

  it("performs anyDeepLessThan for bigint[],number[]", function () {
    const a = [BigInt(4), BigInt(5)];
    const b = [5, 5];
    const expected = true;
    const actual = ArrayValues.anyDeepLessThan(a, b);
    expect(actual).toEqual(expected);
  });
  it("performs anyDeepLessThan for bigint[],number[]", function () {
    const a = [BigInt(6), BigInt(5)];
    const b = [5, 5];
    const expected = false;
    const actual = ArrayValues.anyDeepLessThan(a, b);
    expect(actual).toEqual(expected);
  });

  //==========================================================================
  // anyDeepLessThan number, bigint

  it("performs anyDeepLessThan for number,bigint", function () {
    const a = 4;
    const b = BigInt(5);
    const expected = true;
    const actual = ArrayValues.anyDeepLessThan(a, b);
    expect(actual).toEqual(expected);
  });

  it("performs anyDeepLessThan for number,bigint", function () {
    const a = 6;
    const b = BigInt(5);
    const expected = false;
    const actual = ArrayValues.anyDeepLessThan(a, b);
    expect(actual).toEqual(expected);
  });

  it("performs anyDeepLessThan for number[],bigint[]", function () {
    const a = [4, 5];
    const b = [BigInt(5), BigInt(5)];
    const expected = true;
    const actual = ArrayValues.anyDeepLessThan(a, b);
    expect(actual).toEqual(expected);
  });
  it("performs anyDeepLessThan for number[],bigint[]", function () {
    const a = [6, 5];
    const b = [BigInt(5), BigInt(5)];
    const expected = false;
    const actual = ArrayValues.anyDeepLessThan(a, b);
    expect(actual).toEqual(expected);
  });

  //==========================================================================
  // anyDeepLessThan bigint,bigint

  it("performs anyDeepLessThan for bigint,bigint", function () {
    const a = BigInt(4);
    const b = BigInt(5);
    const expected = true;
    const actual = ArrayValues.anyDeepLessThan(a, b);
    expect(actual).toEqual(expected);
  });

  it("performs anyDeepLessThan for bigint,bigint", function () {
    const a = BigInt(6);
    const b = BigInt(5);
    const expected = false;
    const actual = ArrayValues.anyDeepLessThan(a, b);
    expect(actual).toEqual(expected);
  });

  it("performs anyDeepLessThan for bigint[],bigint[]", function () {
    const a = [BigInt(4), BigInt(5)];
    const b = [BigInt(5), BigInt(5)];
    const expected = true;
    const actual = ArrayValues.anyDeepLessThan(a, b);
    expect(actual).toEqual(expected);
  });
  it("performs anyDeepLessThan for bigint[],bigint[]", function () {
    const a = [BigInt(6), BigInt(5)];
    const b = [BigInt(5), BigInt(5)];
    const expected = false;
    const actual = ArrayValues.anyDeepLessThan(a, b);
    expect(actual).toEqual(expected);
  });

  //==========================================================================
  // anyDeepGreaterThan number, number

  it("performs anyDeepGreaterThan for number,number", function () {
    const a = 4;
    const b = 5;
    const expected = false;
    const actual = ArrayValues.anyDeepGreaterThan(a, b);
    expect(actual).toEqual(expected);
  });

  it("performs anyDeepGreaterThan for number,number", function () {
    const a = 6;
    const b = 5;
    const expected = true;
    const actual = ArrayValues.anyDeepGreaterThan(a, b);
    expect(actual).toEqual(expected);
  });

  it("performs anyDeepGreaterThan for number[],number[]", function () {
    const a = [4, 5];
    const b = [5, 5];
    const expected = false;
    const actual = ArrayValues.anyDeepGreaterThan(a, b);
    expect(actual).toEqual(expected);
  });
  it("performs anyDeepGreaterThan for number[],number[]", function () {
    const a = [6, 5];
    const b = [5, 5];
    const expected = true;
    const actual = ArrayValues.anyDeepGreaterThan(a, b);
    expect(actual).toEqual(expected);
  });

  //==========================================================================
  // anyDeepGreaterThan bigint, number

  it("performs anyDeepGreaterThan for bigint,number", function () {
    const a = BigInt(4);
    const b = 5;
    const expected = false;
    const actual = ArrayValues.anyDeepGreaterThan(a, b);
    expect(actual).toEqual(expected);
  });

  it("performs anyDeepGreaterThan for bigint,number", function () {
    const a = BigInt(6);
    const b = 5;
    const expected = true;
    const actual = ArrayValues.anyDeepGreaterThan(a, b);
    expect(actual).toEqual(expected);
  });

  it("performs anyDeepGreaterThan for bigint[],number[]", function () {
    const a = [BigInt(4), BigInt(5)];
    const b = [5, 5];
    const expected = false;
    const actual = ArrayValues.anyDeepGreaterThan(a, b);
    expect(actual).toEqual(expected);
  });
  it("performs anyDeepGreaterThan for bigint[],number[]", function () {
    const a = [BigInt(6), BigInt(5)];
    const b = [5, 5];
    const expected = true;
    const actual = ArrayValues.anyDeepGreaterThan(a, b);
    expect(actual).toEqual(expected);
  });

  //==========================================================================
  // anyDeepGreaterThan number, bigint

  it("performs anyDeepGreaterThan for number,bigint", function () {
    const a = 4;
    const b = BigInt(5);
    const expected = false;
    const actual = ArrayValues.anyDeepGreaterThan(a, b);
    expect(actual).toEqual(expected);
  });

  it("performs anyDeepGreaterThan for number,bigint", function () {
    const a = 6;
    const b = BigInt(5);
    const expected = true;
    const actual = ArrayValues.anyDeepGreaterThan(a, b);
    expect(actual).toEqual(expected);
  });

  it("performs anyDeepGreaterThan for number[],bigint[]", function () {
    const a = [4, 5];
    const b = [BigInt(5), BigInt(5)];
    const expected = false;
    const actual = ArrayValues.anyDeepGreaterThan(a, b);
    expect(actual).toEqual(expected);
  });
  it("performs anyDeepGreaterThan for number[],bigint[]", function () {
    const a = [6, 5];
    const b = [BigInt(5), BigInt(5)];
    const expected = true;
    const actual = ArrayValues.anyDeepGreaterThan(a, b);
    expect(actual).toEqual(expected);
  });

  //==========================================================================
  // anyDeepGreaterThan bigint,bigint

  it("performs anyDeepGreaterThan for bigint,bigint", function () {
    const a = BigInt(4);
    const b = BigInt(5);
    const expected = false;
    const actual = ArrayValues.anyDeepGreaterThan(a, b);
    expect(actual).toEqual(expected);
  });

  it("performs anyDeepGreaterThan for bigint,bigint", function () {
    const a = BigInt(6);
    const b = BigInt(5);
    const expected = true;
    const actual = ArrayValues.anyDeepGreaterThan(a, b);
    expect(actual).toEqual(expected);
  });

  it("performs anyDeepGreaterThan for bigint[],bigint[]", function () {
    const a = [BigInt(4), BigInt(5)];
    const b = [BigInt(5), BigInt(5)];
    const expected = false;
    const actual = ArrayValues.anyDeepGreaterThan(a, b);
    expect(actual).toEqual(expected);
  });
  it("performs anyDeepGreaterThan for bigint[],bigint[]", function () {
    const a = [BigInt(6), BigInt(5)];
    const b = [BigInt(5), BigInt(5)];
    const expected = true;
    const actual = ArrayValues.anyDeepGreaterThan(a, b);
    expect(actual).toEqual(expected);
  });

  //==========================================================================
  // Error cases for deepMin/deepMax

  it("throws error for non-numeric types in deepMin", function () {
    expect(function () {
      const a = [5, 2];
      const b = [3, "NOT_A_NUMBER"];
      ArrayValues.deepMin(a, b);
    }).toThrowError();
  });

  it("throws error for non-numeric types in deepMax", function () {
    expect(function () {
      const a = [5, 2];
      const b = [3, "NOT_A_NUMBER"];
      ArrayValues.deepMax(a, b);
    }).toThrowError();
  });
});

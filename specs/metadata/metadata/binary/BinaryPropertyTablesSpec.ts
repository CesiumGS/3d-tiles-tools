/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Schema } from "../../../../src/structure";
import { BinaryPropertyTables } from "../../../../src/metadata";

// NOTE:
// Some internals of the `BinaryPropertyTables` class are ported from the "MetadataTester"
// at https://github.com/CesiumGS/cesium/blob/67f3ed464a99d148f418cda37a9557425895e439/Specs/MetadataTester.js.
// In CesiumJS, this class is mainly intended for building test/"dummy" data WITHIN the specs.
// As part of the 3D Tiles Tools and the BinaryPropertyTables class, this functionality
// becomes (internal but) "public". This would make it necessary to create test coverage
// for this functionality as well.
// Most of this IS already covered implicitly via the 'PropertyTableModelsSpec.ts', but certain
// cases may warrant dedicated tests here.
// For now, the only test here is a regression test for an issue in the MetadataTester part
// that was fixed via https://github.com/CesiumGS/3d-tiles-tools/pull/96

describe("metadata/binary/BinaryPropertyTables", function () {
  it("creates propertyTableProperty for STRING property including null and undefined", function () {
    const classProperty = {
      type: "STRING",
    };
    const schema: Schema = {
      id: "SPEC_SCHEMA",
    };

    // The values that are used for building the property table property.
    const inputValue0 = "Zero";
    const inputValue1 = null;
    const inputValue2 = "Two";
    const inputValue3 = undefined;
    const inputValue4 = "Four";

    // Build the property table property
    const values = [
      inputValue0,
      inputValue1,
      inputValue2,
      inputValue3,
      inputValue4,
    ];
    const arrayOffsetType = "INT32";
    const stringOffsetType = "INT32";
    const bufferViewsData: Buffer[] = [];
    const propertyTableProperty =
      BinaryPropertyTables.createPropertyTableProperty(
        classProperty,
        schema,
        values,
        arrayOffsetType,
        stringOffsetType,
        bufferViewsData
      );

    // Obtain the values- and stringOffsets buffers
    const valuesIndex = propertyTableProperty.values;
    const stringOffsetsIndex = propertyTableProperty.stringOffsets!;
    const valuesBuffer = bufferViewsData[valuesIndex];
    const stringOffsetsBuffer = bufferViewsData[stringOffsetsIndex];

    // Obtain the offsets. The null/undefined entries should
    // result in two consecutive offsets being equal
    const offset0 = stringOffsetsBuffer.readInt32LE(0);
    const offset1 = stringOffsetsBuffer.readInt32LE(4);
    const offset2 = stringOffsetsBuffer.readInt32LE(8);
    const offset3 = stringOffsetsBuffer.readInt32LE(12);
    const offset4 = stringOffsetsBuffer.readInt32LE(16);
    const offset5 = stringOffsetsBuffer.readInt32LE(20);

    expect(offset0).toBe(0);
    expect(offset1).toBe(4);
    expect(offset2).toBe(4);
    expect(offset3).toBe(7);
    expect(offset4).toBe(7);
    expect(offset5).toBe(11);

    // The values are given by the "slice" that is defined via
    // the difference of two consecutive offsets within the
    // values buffer
    const actualValue0 = valuesBuffer.subarray(offset0, offset1).toString();
    const actualValue1 = valuesBuffer.subarray(offset1, offset2).toString();
    const actualValue2 = valuesBuffer.subarray(offset2, offset3).toString();
    const actualValue3 = valuesBuffer.subarray(offset3, offset4).toString();
    const actualValue4 = valuesBuffer.subarray(offset4, offset5).toString();

    // The "null" and "undefined" are expected to result in empty strings
    expect(actualValue0).toBe(inputValue0);
    expect(actualValue1).toBe("");
    expect(actualValue2).toBe(inputValue2);
    expect(actualValue3).toBe("");
    expect(actualValue4).toBe(inputValue4);
  });
});

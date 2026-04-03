import { ContentDataTypes } from "../../../src/base";
import { ContentDataTypeChecks } from "../../../src/base";

describe("ContentDataTypeChecks", function () {
  it("returns true when included is undefined and excluded is undefined", async function () {
    const checkedType = ContentDataTypes.CONTENT_TYPE_GLB;
    const included = undefined;
    const excluded = undefined;
    const check = ContentDataTypeChecks.createTypeCheck(included, excluded);
    const result = check(checkedType);
    expect(result).toBeTrue();
  });
  it("returns false when included is empty and excluded is undefined", async function () {
    const checkedType = ContentDataTypes.CONTENT_TYPE_GLB;
    const included: string[] = [];
    const excluded = undefined;
    const check = ContentDataTypeChecks.createTypeCheck(included, excluded);
    const result = check(checkedType);
    expect(result).toBeFalse();
  });
  it("returns true when included is undefined and excluded is empty", async function () {
    const checkedType = ContentDataTypes.CONTENT_TYPE_GLB;
    const included = undefined;
    const excluded: string[] = [];
    const check = ContentDataTypeChecks.createTypeCheck(included, excluded);
    const result = check(checkedType);
    expect(result).toBeTrue();
  });
  it("returns false when included is empty and excluded is empty", async function () {
    const checkedType = ContentDataTypes.CONTENT_TYPE_GLB;
    const included: string[] = [];
    const excluded: string[] = [];
    const check = ContentDataTypeChecks.createTypeCheck(included, excluded);
    const result = check(checkedType);
    expect(result).toBeFalse();
  });

  it("returns true when included contains element and excluded is undefined", async function () {
    const checkedType = ContentDataTypes.CONTENT_TYPE_GLB;
    const included = [
      checkedType,
      ContentDataTypes.CONTENT_TYPE_B3DM,
      ContentDataTypes.CONTENT_TYPE_I3DM,
      ContentDataTypes.CONTENT_TYPE_CMPT,
    ];
    const excluded = undefined;
    const check = ContentDataTypeChecks.createTypeCheck(included, excluded);
    const result = check(checkedType);
    expect(result).toBeTrue();
  });

  it("returns true when included contains element and excluded is empty", async function () {
    const checkedType = ContentDataTypes.CONTENT_TYPE_GLB;
    const included = [
      checkedType,
      ContentDataTypes.CONTENT_TYPE_B3DM,
      ContentDataTypes.CONTENT_TYPE_I3DM,
      ContentDataTypes.CONTENT_TYPE_CMPT,
    ];
    const excluded: string[] = [];
    const check = ContentDataTypeChecks.createTypeCheck(included, excluded);
    const result = check(checkedType);
    expect(result).toBeTrue();
  });

  it("returns false when included contains element and excluded contains element", async function () {
    const checkedType = ContentDataTypes.CONTENT_TYPE_GLB;
    const included = [
      checkedType,
      ContentDataTypes.CONTENT_TYPE_B3DM,
      ContentDataTypes.CONTENT_TYPE_I3DM,
      ContentDataTypes.CONTENT_TYPE_CMPT,
    ];
    const excluded = [checkedType, ContentDataTypes.CONTENT_TYPE_JPEG];
    const check = ContentDataTypeChecks.createTypeCheck(included, excluded);
    const result = check(checkedType);
    expect(result).toBeFalse();
  });
  it("returns false when included does not contain element", async function () {
    const checkedType = ContentDataTypes.CONTENT_TYPE_GLB;
    const included = [
      ContentDataTypes.CONTENT_TYPE_B3DM,
      ContentDataTypes.CONTENT_TYPE_I3DM,
      ContentDataTypes.CONTENT_TYPE_CMPT,
    ];
    const excluded = undefined;
    const check = ContentDataTypeChecks.createTypeCheck(included, excluded);
    const result = check(checkedType);
    expect(result).toBeFalse();
  });

  it("returns true when included is undefined and excluded is undefined and type is undefined", async function () {
    const checkedType = undefined;
    const included = undefined;
    const excluded = undefined;
    const check = ContentDataTypeChecks.createTypeCheck(included, excluded);
    const result = check(checkedType);
    expect(result).toBeTrue();
  });

  it("returns false when included is undefined and excluded contains undefined and type is undefined", async function () {
    const checkedType = undefined;
    const included = undefined;
    const excluded = [undefined];
    const check = ContentDataTypeChecks.createTypeCheck(included, excluded);
    const result = check(checkedType);
    expect(result).toBeFalse();
  });
});

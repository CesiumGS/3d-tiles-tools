import { TilesetSource3dtiles } from "../../../src/tilesets";

import { SpecHelpers } from "../../SpecHelpers";

const SPECS_DATA_BASE_DIRECTORY = SpecHelpers.getSpecsDataBaseDirectory();

describe("TilesetSource3dtiles", function () {
  it("throws for invalidColumnName0", function () {
    const tilesetSource = new TilesetSource3dtiles();
    expect(function () {
      tilesetSource.open(
        SPECS_DATA_BASE_DIRECTORY + "/packages/invalidColumnName0.3dtiles"
      );
    }).toThrowError();
  });

  it("throws for invalidColumnName1", function () {
    const tilesetSource = new TilesetSource3dtiles();
    expect(function () {
      tilesetSource.open(
        SPECS_DATA_BASE_DIRECTORY + "/packages/invalidColumnName1.3dtiles"
      );
    }).toThrowError();
  });
  it("throws for invalidColumnType0", function () {
    const tilesetSource = new TilesetSource3dtiles();
    expect(function () {
      tilesetSource.open(
        SPECS_DATA_BASE_DIRECTORY + "/packages/invalidColumnType0.3dtiles"
      );
    }).toThrowError();
  });
  it("throws for invalidColumnType1", function () {
    const tilesetSource = new TilesetSource3dtiles();
    expect(function () {
      tilesetSource.open(
        SPECS_DATA_BASE_DIRECTORY + "/packages/invalidColumnType1.3dtiles"
      );
    }).toThrowError();
  });
  it("throws for invalidTableName", function () {
    const tilesetSource = new TilesetSource3dtiles();
    expect(function () {
      tilesetSource.open(
        SPECS_DATA_BASE_DIRECTORY + "/packages/invalidTableName.3dtiles"
      );
    }).toThrowError();
  });
  it("throws for missingColumn", function () {
    const tilesetSource = new TilesetSource3dtiles();
    expect(function () {
      tilesetSource.open(
        SPECS_DATA_BASE_DIRECTORY + "/packages/missingColumn.3dtiles"
      );
    }).toThrowError();
  });
  it("throws for superflousColumn", function () {
    const tilesetSource = new TilesetSource3dtiles();
    expect(function () {
      tilesetSource.open(
        SPECS_DATA_BASE_DIRECTORY + "/packages/superflousColumn.3dtiles"
      );
    }).toThrowError();
  });
  it("finally works with a valid package", function () {
    const tilesetSource = new TilesetSource3dtiles();
    tilesetSource.open(SPECS_DATA_BASE_DIRECTORY + "/packages/valid.3dtiles");
    tilesetSource.close();
  });
});

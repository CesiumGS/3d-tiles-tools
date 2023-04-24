import { TilesetSource3dtiles } from "../src/packages/TilesetSource3dtiles";

describe("TilesetSource3dtiles", function () {
  it("throws for invalidColumnName0", function () {
    const tilesetSource = new TilesetSource3dtiles();
    expect(function () {
      tilesetSource.open("./specs/data/packages/invalidColumnName0.3dtiles");
    }).toThrowError();
  });

  it("throws for invalidColumnName1", function () {
    const tilesetSource = new TilesetSource3dtiles();
    expect(function () {
      tilesetSource.open("./specs/data/packages/invalidColumnName1.3dtiles");
    }).toThrowError();
  });
  it("throws for invalidColumnType0", function () {
    const tilesetSource = new TilesetSource3dtiles();
    expect(function () {
      tilesetSource.open("./specs/data/packages/invalidColumnType0.3dtiles");
    }).toThrowError();
  });
  it("throws for invalidColumnType1", function () {
    const tilesetSource = new TilesetSource3dtiles();
    expect(function () {
      tilesetSource.open("./specs/data/packages/invalidColumnType1.3dtiles");
    }).toThrowError();
  });
  it("throws for invalidTableName", function () {
    const tilesetSource = new TilesetSource3dtiles();
    expect(function () {
      tilesetSource.open("./specs/data/packages/invalidTableName.3dtiles");
    }).toThrowError();
  });
  it("throws for missingColumn", function () {
    const tilesetSource = new TilesetSource3dtiles();
    expect(function () {
      tilesetSource.open("./specs/data/packages/missingColumn.3dtiles");
    }).toThrowError();
  });
  it("throws for superflousColumn", function () {
    const tilesetSource = new TilesetSource3dtiles();
    expect(function () {
      tilesetSource.open("./specs/data/packages/superflousColumn.3dtiles");
    }).toThrowError();
  });
  it("finally works with a valid package", function () {
    const tilesetSource = new TilesetSource3dtiles();
    tilesetSource.open("./specs/data/packages/valid.3dtiles");
    tilesetSource.close();
  });
});

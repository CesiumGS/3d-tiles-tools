import { TilesetSource } from "../src/tilesetData/TilesetSource";
import { TilesetSourceFs } from "../src/tilesetData/TilesetSourceFs";

describe("TilesetSource", function () {
  let tilesetSource: TilesetSource;
  let sourceName: string;

  // TODO This should be done for each implementation
  // of the TilesetSource interface
  beforeEach(function () {
    tilesetSource = new TilesetSourceFs();
    sourceName = "./specs/data/Tileset/tileset.json";
  });

  it("throws when trying to access it before calling 'open'", function () {
    expect(function () {
      tilesetSource.getValue("KEY_FOR_SPEC");
    }).toThrowError();
  });

  it("throws when trying to call 'close' before calling 'open'", function () {
    expect(function () {
      tilesetSource.close();
    }).toThrowError();
  });

  it("throws when trying to call 'open' twice", function () {
    tilesetSource.open(sourceName);
    expect(function () {
      tilesetSource.open(sourceName);
    }).toThrowError();
  });

  it("allows access after calling 'open' and before calling 'close'", function () {
    tilesetSource.open(sourceName);
    const value = tilesetSource.getValue("KEY_FOR_SPEC");
    expect(value).not.toBeDefined();
  });

  it("throws when trying to access it after calling 'close'", function () {
    tilesetSource.open(sourceName);
    tilesetSource.close();
    expect(function () {
      tilesetSource.getValue("KEY_FOR_SPEC");
    }).toThrowError();
  });

  it("throws when trying to call 'close' twice", function () {
    tilesetSource.open(sourceName);
    tilesetSource.close();
    expect(function () {
      tilesetSource.close();
    }).toThrowError();
  });
});

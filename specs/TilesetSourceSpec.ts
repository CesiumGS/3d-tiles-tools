import { TilesetSource } from "../src/tilesetData/TilesetSource";
import { TilesetSourceFs } from "../src/tilesetData/TilesetSourceFs";
import { TilesetSource3tz } from "../src/packages/TilesetSource3tz";
import { TilesetSource3dtiles } from "../src/packages/TilesetSource3dtiles";

// The basic contract that is established by the `TilesetSource`
// interface is checked for these implementations:
const testCases = [
  {
    description: "TilesetSourceFs",
    constructorFunction: TilesetSourceFs,
    sourceName: "./specs/data/Tileset/",
  },
  {
    description: "TilesetSource3tz",
    constructorFunction: TilesetSource3tz,
    sourceName: "./specs/data/tileset.3tz",
  },
  {
    description: "TilesetSource3dtiles",
    constructorFunction: TilesetSource3dtiles,
    sourceName: "./specs/data/tileset.3dtiles",
  },
];

for (const testCase of testCases) {
  describe(testCase.description, function () {
    let tilesetSource: TilesetSource;
    let sourceName: string;

    beforeEach(function () {
      tilesetSource = new testCase.constructorFunction();
      sourceName = testCase.sourceName;
    });

    it("throws when trying to access it before calling 'open'", function () {
      expect(function () {
        tilesetSource.getValue("tileset.json");
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
      const value = tilesetSource.getValue("tileset.json");
      expect(value).toBeDefined();
    });

    it("throws when trying to access it after calling 'close'", function () {
      tilesetSource.open(sourceName);
      tilesetSource.close();
      expect(function () {
        tilesetSource.getValue("tileset.json");
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
}

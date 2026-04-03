import { Iterables } from "../../../src/base";

import { TilesetSource } from "../../../src/tilesets";
import { TilesetSourceFs } from "../../../src/tilesets";
import { TilesetInMemory } from "../../../src/tilesets";

import { TilesetSource3tz } from "../../../src/tilesets";
import { TilesetSource3dtiles } from "../../../src/tilesets";

import { SpecHelpers } from "../../SpecHelpers";

const SPECS_DATA_BASE_DIRECTORY = SpecHelpers.getSpecsDataBaseDirectory();

async function createTilesetInMemory() {
  const tileset = new TilesetInMemory();
  await tileset.begin("", true);
  await tileset.addEntry("tileset.json", Buffer.alloc(0));
  await tileset.end();
  return tileset;
}

// The basic contract that is established by the `TilesetSource`
// interface is checked for these implementations:
const testCases = [
  {
    description: "TilesetSourceFs",
    creationFunction: () => new TilesetSourceFs(),
    sourceName: SPECS_DATA_BASE_DIRECTORY + "/Tileset/",
  },
  {
    description: "TilesetSource3tz",
    creationFunction: () => new TilesetSource3tz(),
    sourceName: SPECS_DATA_BASE_DIRECTORY + "/tileset.3tz",
  },
  {
    description: "TilesetSource3dtiles",
    creationFunction: () => new TilesetSource3dtiles(),
    sourceName: SPECS_DATA_BASE_DIRECTORY + "/tileset.3dtiles",
  },
  {
    description: "TilesetInMemory",
    creationFunction: createTilesetInMemory,
    sourceName: SPECS_DATA_BASE_DIRECTORY + "/tileset.3dtiles",
  },
];

for (const testCase of testCases) {
  describe(testCase.description, function () {
    let tilesetSource: TilesetSource;
    let sourceName: string;

    beforeEach(async function () {
      tilesetSource = await testCase.creationFunction();
      sourceName = testCase.sourceName;
    });

    it("throws when trying to access it before calling 'open'", async function () {
      await expectAsync(
        (async function () {
          await tilesetSource.getValue("tileset.json");
        })()
        //  ^ This () is important to really CALL the anonymous function
        // and return a promise.
      ).toBeRejectedWithError();
    });

    it("throws when trying to call 'close' before calling 'open'", async function () {
      await expectAsync(
        (async function () {
          await tilesetSource.close();
        })()
        //  ^ This () is important to really CALL the anonymous function
        // and return a promise.
      ).toBeRejectedWithError();
    });

    it("throws when trying to call 'open' twice", async function () {
      await tilesetSource.open(sourceName);
      await expectAsync(
        (async function () {
          await tilesetSource.open(sourceName);
        })()
        //  ^ This () is important to really CALL the anonymous function
        // and return a promise.
      ).toBeRejectedWithError();
    });

    it("allows access after calling 'open' and before calling 'close'", async function () {
      await tilesetSource.open(sourceName);
      const value = await tilesetSource.getValue("tileset.json");
      expect(value).toBeDefined();
    });

    it("allows iterating over the keys, multiple times, yielding the same results", async function () {
      await tilesetSource.open(sourceName);
      const keys = await tilesetSource.getKeys();
      const keysA = await Iterables.asyncToArray(keys);
      const keysB = await Iterables.asyncToArray(keys);
      expect(keysA).toEqual(keysB);
    });

    it("throws when trying to access it after calling 'close'", async function () {
      await tilesetSource.open(sourceName);
      await tilesetSource.close();
      await expectAsync(
        (async function () {
          await tilesetSource.getValue("tileset.json");
        })()
        //  ^ This () is important to really CALL the anonymous function
        // and return a promise.
      ).toBeRejectedWithError();
    });

    it("throws when trying to call 'close' twice", async function () {
      await tilesetSource.open(sourceName);
      await tilesetSource.close();
      await expectAsync(
        (async function () {
          await tilesetSource.close();
        })()
        //  ^ This () is important to really CALL the anonymous function
        // and return a promise.
      ).toBeRejectedWithError();
    });
  });
}

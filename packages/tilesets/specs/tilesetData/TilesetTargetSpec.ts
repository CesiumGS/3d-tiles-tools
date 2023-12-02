import { TilesetTarget } from "../../src/tilesetData/TilesetTarget.js";
import { TilesetTargetFs } from "../../src/tilesetData/TilesetTargetFs.js";
import { TilesetInMemory } from "../../src/tilesetData/TilesetInMemory.js";

import { TilesetTarget3tz } from "../../src/packages/TilesetTarget3tz.js";
import { TilesetTarget3dtiles } from "../../src/packages/TilesetTarget3dtiles.js";

import { SpecHelpers } from "@3d-tiles-tools/spec-helpers";

const SPECS_DATA_BASE_DIRECTORY = SpecHelpers.getSpecsDataBaseDirectory();

// The basic contract that is established by the `TilesetTarget`
// interface is checked for these implementations:
const testCases = [
  {
    description: "TilesetTargetFs",
    creationFunction: () => new TilesetTargetFs(),
    targetName: SPECS_DATA_BASE_DIRECTORY + "/output/target/Tileset/",
  },
  {
    description: "TilesetTarget3tz",
    creationFunction: () => new TilesetTarget3tz(),
    targetName: SPECS_DATA_BASE_DIRECTORY + "/output/target/tileset.3tz",
  },
  {
    description: "TilesetTarget3dtiles",
    creationFunction: () => new TilesetTarget3dtiles(),
    targetName: SPECS_DATA_BASE_DIRECTORY + "/output/target/tileset.3dtiles",
  },
  {
    description: "TilesetInMemory",
    creationFunction: () => new TilesetInMemory(),
    targetName: "",
  },
];

for (const testCase of testCases) {
  describe(testCase.description, function () {
    let tilesetTarget: TilesetTarget;
    let targetName: string;

    beforeEach(async function () {
      tilesetTarget = testCase.creationFunction();
      targetName = testCase.targetName;
    });

    afterEach(function () {
      SpecHelpers.forceDeleteDirectory(
        SPECS_DATA_BASE_DIRECTORY + "/output/target"
      );
    });

    it("throws when trying to access it before calling 'begin'", function () {
      expect(function () {
        tilesetTarget.addEntry("tileset.json", Buffer.alloc(1));
      }).toThrowError();
    });

    it("throws when trying to call 'end' before calling 'begin'", async function () {
      await expectAsync(
        (async function () {
          return await tilesetTarget.end();
        })()
        //  ^ This () is important to really CALL the anonymous function
        // and return a promise.
      ).toBeRejectedWithError();
    });

    it("throws when trying to call 'begin' twice", async function () {
      tilesetTarget.begin(targetName, true);
      expect(function () {
        tilesetTarget.begin(targetName, true);
      }).toThrowError();
      await tilesetTarget.end();
    });

    it("allows access after calling 'begin' and before calling 'end'", async function () {
      tilesetTarget.begin(targetName, true);
      tilesetTarget.addEntry("tileset.json", Buffer.alloc(1));
      await tilesetTarget.end();
    });

    it("throws when trying to access it after calling 'end'", async function () {
      tilesetTarget.begin(targetName, true);
      await tilesetTarget.end();
      expect(function () {
        tilesetTarget.addEntry("tileset.json", Buffer.alloc(1));
      }).toThrowError();
    });

    it("throws when trying to call 'end' twice", async function () {
      tilesetTarget.begin(targetName, true);
      await tilesetTarget.end();
      await expectAsync(
        (async function () {
          return await tilesetTarget.end();
        })()
        //  ^ This () is important to really CALL the anonymous function
        // and return a promise.
      ).toBeRejectedWithError();
    });
  });
}

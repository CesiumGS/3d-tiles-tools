import { TilesetTarget } from "../../../src/tilesets";
import { TilesetTargetFs } from "../../../src/tilesets";
import { TilesetInMemory } from "../../../src/tilesets";

import { TilesetTarget3tz } from "../../../src/tilesets";
import { TilesetTarget3dtiles } from "../../../src/tilesets";

import { SpecHelpers } from "../../SpecHelpers";

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

    afterEach(async function () {
      // If there is an open target, then make sure that
      // 'end' was called to release the output file
      // (ignoring possible errors)
      if (tilesetTarget) {
        try {
          await tilesetTarget.end();
        } catch (e) {
          // Ignored
        }
      }
      SpecHelpers.forceDeleteDirectory(
        SPECS_DATA_BASE_DIRECTORY + "/output/target"
      );
    });

    it("throws when trying to access it before calling 'begin'", async function () {
      await expectAsync(
        (async function () {
          return await tilesetTarget.addEntry("tileset.json", Buffer.alloc(1));
        })()
        //  ^ This () is important to really CALL the anonymous function
        // and return a promise.
      ).toBeRejectedWithError();
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
      await expectAsync(
        (async function () {
          await tilesetTarget.begin(targetName, true);
          await tilesetTarget.begin(targetName, true);
          return await tilesetTarget.end();
        })()
        //  ^ This () is important to really CALL the anonymous function
        // and return a promise.
      ).toBeRejectedWithError();
    });

    it("allows access after calling 'begin' and before calling 'end'", async function () {
      await tilesetTarget.begin(targetName, true);
      await tilesetTarget.addEntry("tileset.json", Buffer.alloc(1));
      await tilesetTarget.end();
    });

    it("throws when trying to access it after calling 'end'", async function () {
      await expectAsync(
        (async function () {
          await tilesetTarget.begin(targetName, true);
          await tilesetTarget.end();
          return await tilesetTarget.addEntry("tileset.json", Buffer.alloc(1));
        })()
        //  ^ This () is important to really CALL the anonymous function
        // and return a promise.
      ).toBeRejectedWithError();
    });

    it("throws when trying to call 'end' twice", async function () {
      await expectAsync(
        (async function () {
          await tilesetTarget.begin(targetName, true);
          await tilesetTarget.end();
          return await tilesetTarget.end();
        })()
        //  ^ This () is important to really CALL the anonymous function
        // and return a promise.
      ).toBeRejectedWithError();
    });
  });
}

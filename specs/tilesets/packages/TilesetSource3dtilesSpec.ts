import { TilesetSource3dtiles } from "../../../src/tilesets";

import { SpecHelpers } from "../../SpecHelpers";

const SPECS_DATA_BASE_DIRECTORY = SpecHelpers.getSpecsDataBaseDirectory();

describe("TilesetSource3dtiles", function () {
  it("throws for invalidColumnName0", async function () {
    const tilesetSource = new TilesetSource3dtiles();
    await expectAsync(
      (async function () {
        return await tilesetSource.open(
          SPECS_DATA_BASE_DIRECTORY + "/packages/invalidColumnName0.3dtiles"
        );
      })()
      //  ^ This () is important to really CALL the anonymous function
      // and return a promise.
    ).toBeRejectedWithError();
  });

  it("throws for invalidColumnName1", async function () {
    const tilesetSource = new TilesetSource3dtiles();
    await expectAsync(
      (async function () {
        await tilesetSource.open(
          SPECS_DATA_BASE_DIRECTORY + "/packages/invalidColumnName1.3dtiles"
        );
      })()
      //  ^ This () is important to really CALL the anonymous function
      // and return a promise.
    ).toBeRejectedWithError();
  });
  it("throws for invalidColumnType0", async function () {
    const tilesetSource = new TilesetSource3dtiles();
    await expectAsync(
      (async function () {
        await tilesetSource.open(
          SPECS_DATA_BASE_DIRECTORY + "/packages/invalidColumnType0.3dtiles"
        );
      })()
      //  ^ This () is important to really CALL the anonymous function
      // and return a promise.
    ).toBeRejectedWithError();
  });
  it("throws for invalidColumnType1", async function () {
    const tilesetSource = new TilesetSource3dtiles();
    await expectAsync(
      (async function () {
        await tilesetSource.open(
          SPECS_DATA_BASE_DIRECTORY + "/packages/invalidColumnType1.3dtiles"
        );
      })()
      //  ^ This () is important to really CALL the anonymous function
      // and return a promise.
    ).toBeRejectedWithError();
  });
  it("throws for invalidTableName", async function () {
    const tilesetSource = new TilesetSource3dtiles();
    await expectAsync(
      (async function () {
        await tilesetSource.open(
          SPECS_DATA_BASE_DIRECTORY + "/packages/invalidTableName.3dtiles"
        );
      })()
      //  ^ This () is important to really CALL the anonymous function
      // and return a promise.
    ).toBeRejectedWithError();
  });
  it("throws for missingColumn", async function () {
    const tilesetSource = new TilesetSource3dtiles();
    await expectAsync(
      (async function () {
        await tilesetSource.open(
          SPECS_DATA_BASE_DIRECTORY + "/packages/missingColumn.3dtiles"
        );
      })()
      //  ^ This () is important to really CALL the anonymous function
      // and return a promise.
    ).toBeRejectedWithError();
  });
  it("throws for superflousColumn", async function () {
    const tilesetSource = new TilesetSource3dtiles();
    await expectAsync(
      (async function () {
        await tilesetSource.open(
          SPECS_DATA_BASE_DIRECTORY + "/packages/superflousColumn.3dtiles"
        );
      })()
      //  ^ This () is important to really CALL the anonymous function
      // and return a promise.
    ).toBeRejectedWithError();
  });
  it("finally works with a valid package", async function () {
    const tilesetSource = new TilesetSource3dtiles();
    await tilesetSource.open(
      SPECS_DATA_BASE_DIRECTORY + "/packages/valid.3dtiles"
    );
    await tilesetSource.close();
  });
});

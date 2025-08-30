import { TilesetSource3tz } from "../../../src/tilesets";

import { SpecHelpers } from "../../SpecHelpers";

const SPECS_DATA_BASE_DIRECTORY = SpecHelpers.getSpecsDataBaseDirectory();

describe("TilesetSource3tz", function () {
  it("works with a valid package", async function () {
    const tilesetSource = new TilesetSource3tz();
    await tilesetSource.open(SPECS_DATA_BASE_DIRECTORY + "/packages/valid.3tz");
    await tilesetSource.close();
  });
  it("works with a valid package", async function () {
    const tilesetSource = new TilesetSource3tz();
    await tilesetSource.open(
      SPECS_DATA_BASE_DIRECTORY + "/packages/validSmall.3tz"
    );
    await tilesetSource.close();
  });
  it("works with a valid package that has extra bytes in ZIP headers", async function () {
    const tilesetSource = new TilesetSource3tz();
    await tilesetSource.open(
      SPECS_DATA_BASE_DIRECTORY +
        "/packages/validWith64byteExtrasInZipFileHeader.3tz"
    );
    await tilesetSource.close();
  });
});

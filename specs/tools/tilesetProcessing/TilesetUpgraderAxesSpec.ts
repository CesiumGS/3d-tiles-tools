import { TilesetOperations } from "../../../src/tools";

import { SpecHelpers } from "../../SpecHelpers";

const SPECS_DATA_BASE_DIRECTORY = SpecHelpers.getSpecsDataBaseDirectory();

const sourceDir =
  SPECS_DATA_BASE_DIRECTORY + "/upgradeTileset/upAxisHandling/input/";
const targetDir =
  SPECS_DATA_BASE_DIRECTORY + "/upgradeTileset/upAxisHandling/output/";
const goldenDir =
  SPECS_DATA_BASE_DIRECTORY + "/upgradeTileset/upAxisHandling/golden/";

describe("TilesetUpgrader Axes", function () {
  afterEach(function () {
    SpecHelpers.forceDeleteDirectory(targetDir);
  });

  it("properly upgrades glTF1-x-up", async function () {
    const testDirectoryName = "glTF1-x-up";
    const input = sourceDir + testDirectoryName;
    const output = targetDir + testDirectoryName;
    const golden = goldenDir + testDirectoryName;

    const overwrite = true;
    const targetVersion = "1.1";
    await TilesetOperations.upgrade(
      input,
      output,
      overwrite,
      targetVersion,
      undefined
    );

    const difference = await SpecHelpers.computePackageDifference(
      output,
      golden
    );
    expect(difference).toBeUndefined();
  });

  it("properly upgrades glTF1-x-up-with-gltfUpAxis-x", async function () {
    const testDirectoryName = "glTF1-x-up-with-gltfUpAxis-x";
    const input = sourceDir + testDirectoryName;
    const output = targetDir + testDirectoryName;
    const golden = goldenDir + testDirectoryName;

    const overwrite = true;
    const targetVersion = "1.1";
    await TilesetOperations.upgrade(
      input,
      output,
      overwrite,
      targetVersion,
      undefined
    );

    const difference = await SpecHelpers.computePackageDifference(
      output,
      golden
    );
    expect(difference).toBeUndefined();
  });

  it("properly upgrades glTF1-y-up", async function () {
    const testDirectoryName = "glTF1-y-up";
    const input = sourceDir + testDirectoryName;
    const output = targetDir + testDirectoryName;
    const golden = goldenDir + testDirectoryName;

    const overwrite = true;
    const targetVersion = "1.1";
    await TilesetOperations.upgrade(
      input,
      output,
      overwrite,
      targetVersion,
      undefined
    );

    const difference = await SpecHelpers.computePackageDifference(
      output,
      golden
    );
    expect(difference).toBeUndefined();
  });

  it("properly upgrades glTF1-y-up-with-gltfUpAxis-y", async function () {
    const testDirectoryName = "glTF1-y-up-with-gltfUpAxis-y";
    const input = sourceDir + testDirectoryName;
    const output = targetDir + testDirectoryName;
    const golden = goldenDir + testDirectoryName;

    const overwrite = true;
    const targetVersion = "1.1";
    await TilesetOperations.upgrade(
      input,
      output,
      overwrite,
      targetVersion,
      undefined
    );

    const difference = await SpecHelpers.computePackageDifference(
      output,
      golden
    );
    expect(difference).toBeUndefined();
  });

  it("properly upgrades glTF1-z-up", async function () {
    const testDirectoryName = "glTF1-z-up";
    const input = sourceDir + testDirectoryName;
    const output = targetDir + testDirectoryName;
    const golden = goldenDir + testDirectoryName;

    const overwrite = true;
    const targetVersion = "1.1";
    await TilesetOperations.upgrade(
      input,
      output,
      overwrite,
      targetVersion,
      undefined
    );

    const difference = await SpecHelpers.computePackageDifference(
      output,
      golden
    );
    expect(difference).toBeUndefined();
  });

  it("properly upgrades glTF1-z-up-with-gltfUpAxis-z", async function () {
    const testDirectoryName = "glTF1-z-up-with-gltfUpAxis-z";
    const input = sourceDir + testDirectoryName;
    const output = targetDir + testDirectoryName;
    const golden = goldenDir + testDirectoryName;

    const overwrite = true;
    const targetVersion = "1.1";
    await TilesetOperations.upgrade(
      input,
      output,
      overwrite,
      targetVersion,
      undefined
    );

    const difference = await SpecHelpers.computePackageDifference(
      output,
      golden
    );
    expect(difference).toBeUndefined();
  });

  it("properly upgrades glTF1-z-up-instanced", async function () {
    const testDirectoryName = "glTF1-z-up-instanced";
    const input = sourceDir + testDirectoryName;
    const output = targetDir + testDirectoryName;
    const golden = goldenDir + testDirectoryName;

    const overwrite = true;
    const targetVersion = "1.1";
    await TilesetOperations.upgrade(
      input,
      output,
      overwrite,
      targetVersion,
      undefined
    );

    const difference = await SpecHelpers.computePackageDifference(
      output,
      golden
    );
    expect(difference).toBeUndefined();
  });

  it("properly upgrades glTF1-z-up-instanced-with-gltfUpAxis-z", async function () {
    const testDirectoryName = "glTF1-z-up-instanced-with-gltfUpAxis-z";
    const input = sourceDir + testDirectoryName;
    const output = targetDir + testDirectoryName;
    const golden = goldenDir + testDirectoryName;

    const overwrite = true;
    const targetVersion = "1.1";
    await TilesetOperations.upgrade(
      input,
      output,
      overwrite,
      targetVersion,
      undefined
    );

    const difference = await SpecHelpers.computePackageDifference(
      output,
      golden
    );
    expect(difference).toBeUndefined();
  });

  it("properly upgrades glTF2", async function () {
    const testDirectoryName = "glTF2";
    const input = sourceDir + testDirectoryName;
    const output = targetDir + testDirectoryName;
    const golden = goldenDir + testDirectoryName;

    const overwrite = true;
    const targetVersion = "1.1";
    await TilesetOperations.upgrade(
      input,
      output,
      overwrite,
      targetVersion,
      undefined
    );

    const difference = await SpecHelpers.computePackageDifference(
      output,
      golden
    );
    expect(difference).toBeUndefined();
  });
});

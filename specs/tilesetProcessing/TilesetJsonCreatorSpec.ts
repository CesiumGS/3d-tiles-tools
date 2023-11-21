import fs from "fs";
import { Paths } from "../../src/base/Paths";

import { TilesetJsonCreator } from "../../src/tilesetProcessing/TilesetJsonCreator";
import { SpecHelpers } from "../SpecHelpers";

const sourceDir = "./specs/data/createTilesetJson/input/";
const targetDir = "./specs/data/createTilesetJson/output/";
const goldenDir = "./specs/data/createTilesetJson/golden/";

describe("TilesetJsonCreator", function () {
  afterEach(function () {
    SpecHelpers.forceDeleteDirectory(targetDir);
  });

  it("creates correct tileset JSON for batchedColors", async function () {
    const tilesetFileName = "batchedColors.json";
    const contentUri = "batchedColors.b3dm";
    const tileset = await TilesetJsonCreator.createTilesetFromContents(
      sourceDir,
      [contentUri]
    );
    const outputJsonString = JSON.stringify(tileset, null, 2);
    Paths.ensureDirectoryExists(targetDir);
    fs.writeFileSync(
      Paths.resolve(targetDir, tilesetFileName),
      outputJsonString
    );
    fs.copyFileSync(
      Paths.resolve(sourceDir, contentUri),
      Paths.resolve(targetDir, contentUri)
    );
    const goldenJsonString = fs
      .readFileSync(Paths.resolve(goldenDir, tilesetFileName))
      .toString();
    expect(outputJsonString).toEqual(goldenJsonString);
  });

  it("creates correct tileset JSON for compositeOfComposite", async function () {
    const tilesetFileName = "compositeOfComposite.json";
    const contentUri = "compositeOfComposite.cmpt";
    const tileset = await TilesetJsonCreator.createTilesetFromContents(
      sourceDir,
      [contentUri]
    );
    const outputJsonString = JSON.stringify(tileset, null, 2);
    Paths.ensureDirectoryExists(targetDir);
    fs.writeFileSync(
      Paths.resolve(targetDir, tilesetFileName),
      outputJsonString
    );
    fs.copyFileSync(
      Paths.resolve(sourceDir, contentUri),
      Paths.resolve(targetDir, contentUri)
    );
    const goldenJsonString = fs
      .readFileSync(Paths.resolve(goldenDir, tilesetFileName))
      .toString();
    expect(outputJsonString).toEqual(goldenJsonString);
  });

  it("creates correct tileset JSON for instancedOrientation", async function () {
    const tilesetFileName = "instancedOrientation.json";
    const contentUri = "instancedOrientation.i3dm";
    const tileset = await TilesetJsonCreator.createTilesetFromContents(
      sourceDir,
      [contentUri]
    );
    const outputJsonString = JSON.stringify(tileset, null, 2);
    Paths.ensureDirectoryExists(targetDir);
    fs.writeFileSync(
      Paths.resolve(targetDir, tilesetFileName),
      outputJsonString
    );
    fs.copyFileSync(
      Paths.resolve(sourceDir, contentUri),
      Paths.resolve(targetDir, contentUri)
    );
    const goldenJsonString = fs
      .readFileSync(Paths.resolve(goldenDir, tilesetFileName))
      .toString();
    expect(outputJsonString).toEqual(goldenJsonString);
  });

  it("creates correct tileset JSON for pointCloudRGB", async function () {
    const tilesetFileName = "pointCloudRGB.json";
    const contentUri = "pointCloudRGB.pnts";
    const tileset = await TilesetJsonCreator.createTilesetFromContents(
      sourceDir,
      [contentUri]
    );
    const outputJsonString = JSON.stringify(tileset, null, 2);
    Paths.ensureDirectoryExists(targetDir);
    fs.writeFileSync(
      Paths.resolve(targetDir, tilesetFileName),
      outputJsonString
    );
    fs.copyFileSync(
      Paths.resolve(sourceDir, contentUri),
      Paths.resolve(targetDir, contentUri)
    );
    const goldenJsonString = fs
      .readFileSync(Paths.resolve(goldenDir, tilesetFileName))
      .toString();
    expect(outputJsonString).toEqual(goldenJsonString);
  });

  it("creates correct tileset JSON for pointCloudQuantized", async function () {
    const tilesetFileName = "pointCloudQuantized.json";
    const contentUri = "pointCloudQuantized.pnts";
    const tileset = await TilesetJsonCreator.createTilesetFromContents(
      sourceDir,
      [contentUri]
    );
    const outputJsonString = JSON.stringify(tileset, null, 2);
    Paths.ensureDirectoryExists(targetDir);
    fs.writeFileSync(
      Paths.resolve(targetDir, tilesetFileName),
      outputJsonString
    );
    fs.copyFileSync(
      Paths.resolve(sourceDir, contentUri),
      Paths.resolve(targetDir, contentUri)
    );
    const goldenJsonString = fs
      .readFileSync(Paths.resolve(goldenDir, tilesetFileName))
      .toString();
    expect(outputJsonString).toEqual(goldenJsonString);
  });

  it("creates correct tileset JSON for plane-ds-p-n-32x32", async function () {
    const tilesetFileName = "plane-ds-p-n-32x32.json";
    const contentUri = "plane-ds-p-n-32x32.glb";
    const tileset = await TilesetJsonCreator.createTilesetFromContents(
      sourceDir,
      [contentUri]
    );
    const outputJsonString = JSON.stringify(tileset, null, 2);
    Paths.ensureDirectoryExists(targetDir);
    fs.writeFileSync(
      Paths.resolve(targetDir, tilesetFileName),
      outputJsonString
    );
    fs.copyFileSync(
      Paths.resolve(sourceDir, contentUri),
      Paths.resolve(targetDir, contentUri)
    );
    const goldenJsonString = fs
      .readFileSync(Paths.resolve(goldenDir, tilesetFileName))
      .toString();
    expect(outputJsonString).toEqual(goldenJsonString);
  });
});

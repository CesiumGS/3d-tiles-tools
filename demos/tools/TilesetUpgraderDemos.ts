import fs from "fs";
import path from "path";

import { Paths } from "3d-tiles-tools";

import { Tileset } from "3d-tiles-tools";

import { TilesetOperations } from "3d-tiles-tools";

const SPECS_DATA_BASE_DIRECTORY = "./specs/data";

// For historical reasons, the "upgrade" functionality
// may sometimes be applied to ONLY the tileset JSON file.
// In this case, the actual data is read manually e.g. from
// a file, parsed into a `Tileset` object, and then passed
// to the `Tilesets.upgradeTileset` function
async function upgradeTilesetJson(
  inputFileName: string,
  outputFileName: string
) {
  const inputBuffer = fs.readFileSync(inputFileName);
  const tileset = JSON.parse(inputBuffer.toString()) as Tileset;
  const inputJsonString = JSON.stringify(tileset, null, 2);

  console.log("Initial:");
  console.log(inputJsonString);

  const targetVersion = "1.0";
  await TilesetOperations.upgradeTileset(tileset, targetVersion);

  const resultJsonString = JSON.stringify(tileset, null, 2);

  console.log("After upgrading content URLs to URIs");
  console.log(resultJsonString);

  const outputBuffer = Buffer.from(resultJsonString);
  Paths.ensureDirectoryExists(path.dirname(outputFileName));
  fs.writeFileSync(outputFileName, outputBuffer);
}

// By default, the `Tilesets.upgrade` function receives a source
// and a target name (which can be file names or packages), and
// perform "all" upgrade operations.
async function upgradeTileset(
  tilesetSourceName: string,
  tilesetTargetName: string
) {
  const overwrite = true;
  const targetVersion = "1.1";
  await TilesetOperations.upgrade(
    tilesetSourceName,
    tilesetTargetName,
    overwrite,
    targetVersion,
    undefined
  );
}

async function tilesetUpgraderDemos() {
  await upgradeTilesetJson(
    SPECS_DATA_BASE_DIRECTORY +
      "/upgradeTileset/tilesetWithContentUrls/tileset.json",
    "./output/upgradeTileset/tilesetWithContentUrls-upgraded/tileset.json"
  );

  await upgradeTileset(
    SPECS_DATA_BASE_DIRECTORY +
      "/upgradeTileset/tilesetWithB3dmWithGltf1/tileset.json",
    "./output/upgradeTileset/tilesetWithB3dmWithGltf1-upgraded/tileset.json"
  );

  await upgradeTileset(
    SPECS_DATA_BASE_DIRECTORY +
      "/upgradeTileset/tilesetWithI3dmWithGltf1/tileset.json",
    "./output/upgradeTileset/tilesetWithI3dmWithGltf1-upgraded/tileset.json"
  );
}

tilesetUpgraderDemos();

import fs from "fs";
import path from "path";

import { Paths } from "../src/base/Paths";

import { Tileset } from "../src/structure/Tileset";

import { Tilesets } from "../src/tilesets/Tilesets";

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

  await Tilesets.upgradeTileset(tileset);

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
  await Tilesets.upgrade(tilesetSourceName, tilesetTargetName, overwrite);
}

async function tilesetUpgraderDemos() {
  await upgradeTilesetJson(
    "./specs/data/upgradeTileset/tilesetWithContentUrls/tileset.json",
    "./specs/data/output/upgradeTileset/tilesetWithContentUrls-upgraded/tileset.json"
  );

  await upgradeTileset(
    "./specs/data/upgradeTileset/tilesetWithB3dmWithGltf1/tileset.json",
    "./specs/data/output/upgradeTileset/tilesetWithB3dmWithGltf1-upgraded/tileset.json"
  );

  await upgradeTileset(
    "./specs/data/upgradeTileset/tilesetWithI3dmWithGltf1/tileset.json",
    "./specs/data/output/upgradeTileset/tilesetWithI3dmWithGltf1-upgraded/tileset.json"
  );
}

tilesetUpgraderDemos();

import fs from "fs";
import path from "path";

import { Paths } from "3d-tiles-tools";

import { Tileset } from "3d-tiles-tools";

import { TilesetOperations } from "3d-tiles-tools";

const SPECS_DATA_BASE_DIRECTORY = "./specs/data";

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

  console.log("After upgrading (only content URL to URI)");
  console.log(resultJsonString);

  const outputBuffer = Buffer.from(resultJsonString);
  Paths.ensureDirectoryExists(path.dirname(outputFileName));
  fs.writeFileSync(outputFileName, outputBuffer);
}

async function combineTilesets(
  inputFileName: string,
  outputDirectoryName: string
) {
  const overwrite = true;
  await TilesetOperations.combine(
    inputFileName,
    outputDirectoryName,
    overwrite
  );
}

async function mergeTilesets(
  inputFileNames: string[],
  outputDirectoryName: string
) {
  const overwrite = true;
  await TilesetOperations.merge(inputFileNames, outputDirectoryName, overwrite);
}

async function tilesetProcessingDemos() {
  await upgradeTilesetJson(
    SPECS_DATA_BASE_DIRECTORY + "/TilesetOfTilesets/tileset.json",
    "./output/TilesetOfTilesets/tileset-upgraded.json"
  );

  await combineTilesets(
    SPECS_DATA_BASE_DIRECTORY + "/combineTilesets/nestedExternal/tileset.json",
    "./output/nestedExternal/combineTilesets"
  );

  await mergeTilesets(
    [
      SPECS_DATA_BASE_DIRECTORY +
        "/mergeTilesets/basicMerge/TilesetA/tileset.json",
      SPECS_DATA_BASE_DIRECTORY +
        "/mergeTilesets/basicMerge/sub/TilesetA/tileset.json",
    ],
    "./output/mergeTilesets/basicMerge.3tz"
  );
}

tilesetProcessingDemos();

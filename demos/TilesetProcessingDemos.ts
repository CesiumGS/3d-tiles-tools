import fs from "fs";

import { Tileset } from "../src/structure/Tileset";

import { Tilesets } from "../src/tilesets/Tilesets";

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

  console.log("After upgrading (only content URL to URI)");
  console.log(resultJsonString);

  const outputBuffer = Buffer.from(resultJsonString);
  fs.writeFileSync(outputFileName, outputBuffer);
}

async function combineTilesets(
  inputFileName: string,
  outputDirectoryName: string
) {
  const overwrite = true;
  await Tilesets.combine(inputFileName, outputDirectoryName, overwrite);
}

async function mergeTilesets(
  inputFileNames: string[],
  outputDirectoryName: string
) {
  const overwrite = true;
  await Tilesets.merge(inputFileNames, outputDirectoryName, overwrite);
}

async function tilesetProcessingDemos() {
  await upgradeTilesetJson(
    "./specs/data/TilesetOfTilesets/tileset.json",
    "./specs/data/TilesetOfTilesets/tileset-upgraded.json"
  );

  await combineTilesets(
    "./specs/data/combineTilesets/input/tileset.json",
    "./specs/data/combineTilesets/output"
  );

  await mergeTilesets(
    [
      "./specs/data/mergeTilesets/input/TilesetA/tileset.json",
      "./specs/data/mergeTilesets/input/sub/TilesetA/tileset.json",
    ],
    "./specs/data/mergeTilesets/output/merged.3tz"
  );
}

tilesetProcessingDemos();

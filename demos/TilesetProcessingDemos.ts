import fs from "fs";
import { ContentDataTypeChecks } from "../src/contentTypes/ContentDataTypeChecks";
import { ContentDataTypes } from "../src/contentTypes/ContentDataTypes";

import { Tileset } from "../src/structure/Tileset";

import { TilesetCombiner } from "../src/tilesetProcessing/TilesetCombiner";
import { TilesetMerger } from "../src/tilesetProcessing/TilesetMerger";
import { TilesetUpgrader } from "../src/tilesetProcessing/TilesetUpgrader";

async function upgradeTilesetJson(
  inputFileName: string,
  outputFileName: string
) {
  const inputBuffer = fs.readFileSync(inputFileName);
  const tileset = JSON.parse(inputBuffer.toString()) as Tileset;

  console.log("Initial:");
  console.log(JSON.stringify(tileset, null, 2));

  const tilesetUpgrader = new TilesetUpgrader();
  await tilesetUpgrader.upgradeTileset(tileset);

  console.log("After upgrading (only content URL to URI)");
  console.log(JSON.stringify(tileset, null, 2));

  const outputBuffer = Buffer.from(JSON.stringify(tileset, null, 2));
  fs.writeFileSync(outputFileName, outputBuffer);
}

async function combineTilesets(
  inputFileName: string,
  outputDirectoryName: string
) {
  const overwrite = true;
  const externalTilesetDetector = ContentDataTypeChecks.createCheck(ContentDataTypes.CONTENT_TYPE_TILESET);
  const tilesetCombiner = new TilesetCombiner(externalTilesetDetector);
  await tilesetCombiner.combine(inputFileName, outputDirectoryName, overwrite);
}

async function mergeTilesets(
  inputFileNames: string[],
  outputDirectoryName: string
) {
  const overwrite = true;
  const tilesetMerger = new TilesetMerger();
  await tilesetMerger.merge(inputFileNames, outputDirectoryName, overwrite);
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

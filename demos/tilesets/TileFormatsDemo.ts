import fs from "fs";

import { Paths } from "3d-tiles-tools";

import { GltfUtilities } from "3d-tiles-tools";
import { TileFormats } from "3d-tiles-tools";

const SPECS_DATA_BASE_DIRECTORY = "./specs/data";

function glbToB3dm(inputFileName: string, outputFileName: string) {
  console.log("Converting " + inputFileName);
  console.log("to         " + outputFileName);
  const inputBuffer = fs.readFileSync(inputFileName);
  const outputTileData =
    TileFormats.createDefaultB3dmTileDataFromGlb(inputBuffer);
  const outputBuffer = TileFormats.createTileDataBuffer(outputTileData);
  fs.writeFileSync(outputFileName, outputBuffer);
}
function glbToI3dm(inputFileName: string, outputFileName: string) {
  console.log("Converting " + inputFileName);
  console.log("to         " + outputFileName);
  const inputBuffer = fs.readFileSync(inputFileName);
  const outputTileData =
    TileFormats.createDefaultI3dmTileDataFromGlb(inputBuffer);
  const outputBuffer = TileFormats.createTileDataBuffer(outputTileData);
  fs.writeFileSync(outputFileName, outputBuffer);
}
async function b3dmOrI3dmToGlb(inputFileName: string, outputFileName: string) {
  console.log("Converting " + inputFileName);
  console.log("to         " + outputFileName);
  const inputBuffer = fs.readFileSync(inputFileName);
  const inputTileData = TileFormats.readTileData(inputBuffer);
  const outputBuffer = inputTileData.payload;

  // Note: This will have to be configurable somehow...
  console.log("Upgrading GLB by default");
  const upgradedOutputBuffer = await GltfUtilities.upgradeGlb(
    outputBuffer,
    undefined
  );

  fs.writeFileSync(outputFileName, upgradedOutputBuffer);
}

function testTileFormatsDemotConversions() {
  Paths.ensureDirectoryExists(SPECS_DATA_BASE_DIRECTORY + "/output");

  glbToB3dm(
    SPECS_DATA_BASE_DIRECTORY + "/CesiumTexturedBox/CesiumTexturedBox.glb",
    SPECS_DATA_BASE_DIRECTORY + "/output/CesiumTexturedBox.b3dm"
  );

  glbToI3dm(
    SPECS_DATA_BASE_DIRECTORY + "/CesiumTexturedBox/CesiumTexturedBox.glb",
    SPECS_DATA_BASE_DIRECTORY + "/output/CesiumTexturedBox.i3dm"
  );

  b3dmOrI3dmToGlb(
    SPECS_DATA_BASE_DIRECTORY + "/batchedWithBatchTableBinary.b3dm",
    SPECS_DATA_BASE_DIRECTORY + "/output/batchedWithBatchTableBinary.glb"
  );

  b3dmOrI3dmToGlb(
    SPECS_DATA_BASE_DIRECTORY + "/instancedWithBatchTableBinary.i3dm",
    SPECS_DATA_BASE_DIRECTORY + "/output/instancedWithBatchTableBinary.glb"
  );
}

testTileFormatsDemotConversions();

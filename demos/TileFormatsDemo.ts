import fs from "fs";

import { Paths } from "../src/base/Paths";

import { GltfUtilities } from "../src/contentProcessing/GtlfUtilities";
import { TileFormats } from "../src/tileFormats/TileFormats";

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
  Paths.ensureDirectoryExists("./specs/data/output");

  glbToB3dm(
    "./specs/data/CesiumTexturedBox/CesiumTexturedBox.glb",
    "./specs/data/output/CesiumTexturedBox.b3dm"
  );

  glbToI3dm(
    "./specs/data/CesiumTexturedBox/CesiumTexturedBox.glb",
    "./specs/data/output/CesiumTexturedBox.i3dm"
  );

  b3dmOrI3dmToGlb(
    "./specs/data/batchedWithBatchTableBinary.b3dm",
    "./specs/data/output/batchedWithBatchTableBinary.glb"
  );

  b3dmOrI3dmToGlb(
    "./specs/data/instancedWithBatchTableBinary.i3dm",
    "./specs/data/output/instancedWithBatchTableBinary.glb"
  );
}

testTileFormatsDemotConversions();

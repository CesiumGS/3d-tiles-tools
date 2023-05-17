import fs from "fs";
import path from "path";

import { KtxUtility } from "../src/ktx/KtxUtility";

async function convertImageFile() {
  const inputFileName = "./specs/data/images/CesiumLogo.png";
  const outputFileName = "./output/CesiumLogoFile.ktx2";
  const options = {};

  console.log("Converting " + inputFileName);

  await KtxUtility.convertImageFile(inputFileName, outputFileName, options);

  console.log("Wrote " + outputFileName);
}

async function convertImageData() {
  const inputFileName = "./specs/data/images/CesiumLogo.png";
  const outputFileName = "./output/CesiumLogoData.ktx2";
  const options = {};

  console.log("Converting data from " + inputFileName);

  const inputImageData = fs.readFileSync(inputFileName);
  const outputImageData = await KtxUtility.convertImageData(
    inputImageData,
    options
  );
  const outputDirectory = path.dirname(outputFileName);
  if (!fs.existsSync(outputDirectory)) {
    fs.mkdirSync(outputDirectory, { recursive: true });
  }
  fs.writeFileSync(outputFileName, outputImageData);

  console.log("Wrote " + outputFileName);
}

async function runDemo() {
  await convertImageFile();
  await convertImageData();
}

runDemo();

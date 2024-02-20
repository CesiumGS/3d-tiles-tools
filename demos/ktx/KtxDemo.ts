import fs from "fs";
import path from "path";

const SPECS_DATA_BASE_DIRECTORY = "./specs/data";

import { KtxUtility } from "3d-tiles-tools";
import { KtxOptions } from "3d-tiles-tools";

async function convertImageFileEtc1s() {
  const inputFileName = SPECS_DATA_BASE_DIRECTORY + "/images/CesiumLogo.png";
  const outputFileName =
    SPECS_DATA_BASE_DIRECTORY + "/output/CesiumLogoEtc1s.ktx2";

  const etc1sOptions: KtxOptions = {
    uastc: false,
    compressionLevel: 2,
    qualityLevel: 128,
    transferFunction: "SRGB",
  };

  console.log("Converting " + inputFileName);

  await KtxUtility.convertImageFile(
    inputFileName,
    outputFileName,
    etc1sOptions
  );
  console.log("Wrote " + outputFileName);
}

async function convertImageFileUastc() {
  const inputFileName = SPECS_DATA_BASE_DIRECTORY + "/images/CesiumLogo.png";
  const outputFileName =
    SPECS_DATA_BASE_DIRECTORY + "/output/CesiumLogoUastc.ktx2";

  const uastcOptions: KtxOptions = {
    uastc: true,
    level: 2,
    rdo_l: 1.75,
    rdo_d: 8192,
    zstd: 1,
    transferFunction: "SRGB",
  };

  console.log("Converting " + inputFileName);

  await KtxUtility.convertImageFile(
    inputFileName,
    outputFileName,
    uastcOptions
  );
  console.log("Wrote " + outputFileName);
}

async function convertImageData() {
  const inputFileName = SPECS_DATA_BASE_DIRECTORY + "/images/CesiumLogo.png";
  const outputFileName =
    SPECS_DATA_BASE_DIRECTORY + "/output/CesiumLogoData.ktx2";
  const options = undefined;

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
  await convertImageFileEtc1s();
  await convertImageFileUastc();
  await convertImageData();
}

runDemo();

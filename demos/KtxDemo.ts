import fs from "fs";
import path from "path";

import { KtxUtility } from "../src/ktx/KtxUtility";
import { KtxOptions } from "../src/ktx/KtxOptions";

async function convertImageFileEtc1s() {
  const inputFileName = "./specs/data/images/CesiumLogo.png";
  const outputFileName = "./output/CesiumLogoFileEtc1s.ktx2";

  const etc1sOptions: KtxOptions = {
    uastc: false,
    compressionLevel: 2,
    qualityLevel: 128,
    transferFunction: "SRGB",
    //debug: true,
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
  const inputFileName = "./specs/data/images/CesiumLogo.png";
  const outputFileName = "./output/CesiumLogoFileUastc.ktx2";

  const uastcOptions: KtxOptions = {
    uastc: true,
    level: 2,
    rdo_l: 1.75,
    rdo_d: 8192,
    zstd: 1,
    transferFunction: "SRGB",
    debug: true,
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
  const inputFileName = "./specs/data/images/CesiumLogo.png";
  const outputFileName = "./output/CesiumLogoData.ktx2";
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
  //await convertImageFileUastc();
  await convertImageData();
}

runDemo();

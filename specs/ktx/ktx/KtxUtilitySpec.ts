import fs from "fs";

import { KtxUtility } from "../../../src/ktx";
import { KtxOptions } from "../../../src/ktx";

import { SpecHelpers } from "../../SpecHelpers";

const SPECS_DATA_BASE_DIRECTORY = SpecHelpers.getSpecsDataBaseDirectory();

const sourceDir = SPECS_DATA_BASE_DIRECTORY + "/images";
const targetDir = SPECS_DATA_BASE_DIRECTORY + "/KtxUtility/output";
const goldenDir = SPECS_DATA_BASE_DIRECTORY + "/KtxUtility/golden";

describe("KtxUtility", function () {
  afterEach(function () {
    SpecHelpers.forceDeleteDirectory(targetDir);
  });

  it("creates a KTX2 image with ETC1S compression", async function () {
    const sourceFileName = sourceDir + "/CesiumLogo.png";
    const targetFileName = targetDir + "/CesiumLogoEtc1s.ktx2";
    const goldenFileName = goldenDir + "/CesiumLogoEtc1s.ktx2";

    const options: KtxOptions = {
      uastc: false,
      compressionLevel: 2,
      qualityLevel: 128,
      transferFunction: "SRGB",
    };

    //KtxUtility.setLogCallback((value: any) => console.log(value));

    await KtxUtility.convertImageFile(sourceFileName, targetFileName, options);

    const targetData = fs.readFileSync(targetFileName);
    const goldenData = fs.readFileSync(goldenFileName);
    const passed = targetData.equals(goldenData);
    expect(passed).toBe(true);
  });

  it("creates a KTX2 image with UASTC compression", async function () {
    const sourceFileName = sourceDir + "/CesiumLogo.png";
    const targetFileName = targetDir + "/CesiumLogoUastc.ktx2";
    const goldenFileName = goldenDir + "/CesiumLogoUastc.ktx2";

    const options: KtxOptions = {
      uastc: true,
      level: 2,
      rdo_l: 1.75,
      rdo_d: 8192,
      zstd: 1,
      transferFunction: "SRGB",
    };

    //KtxUtility.setLogCallback((value: any) => console.log(value));

    await KtxUtility.convertImageFile(sourceFileName, targetFileName, options);

    const targetData = fs.readFileSync(targetFileName);
    const goldenData = fs.readFileSync(goldenFileName);
    const passed = targetData.equals(goldenData);
    expect(passed).toBe(true);
  });
});

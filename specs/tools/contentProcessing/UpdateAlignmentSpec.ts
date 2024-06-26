import fs from "fs";

import { Paths } from "../../../src/base";

import { ContentOps } from "../../../src/tools";

import { SpecHelpers } from "../../SpecHelpers";

const SPECS_DATA_BASE_DIRECTORY = SpecHelpers.getSpecsDataBaseDirectory();

const sourceDir = SPECS_DATA_BASE_DIRECTORY + "/updateAlignment";
const targetDir = SPECS_DATA_BASE_DIRECTORY + "/updateAlignment/output";
const goldenDir = SPECS_DATA_BASE_DIRECTORY + "/updateAlignment/golden";

function updateAlignmentForSpec(fileName: string) {
  const sourceFileName = sourceDir + "/" + fileName;
  const targetFileName = targetDir + "/" + fileName;
  const goldenFileName = goldenDir + "/" + fileName;

  const sourceData = fs.readFileSync(sourceFileName);

  const targetData = ContentOps.updateAlignment(sourceData);
  Paths.ensureDirectoryExists(targetDir);
  fs.writeFileSync(targetFileName, targetData);

  const goldenData = fs.readFileSync(goldenFileName);
  const passed = targetData.equals(goldenData);
  return passed;
}

describe("ContentOps", function () {
  afterEach(function () {
    SpecHelpers.forceDeleteDirectory(targetDir);
  });

  it("updateAlignment updates the alignment of a B3DM file", async function () {
    const fileName = "batchedColors.b3dm";
    const passed = updateAlignmentForSpec(fileName);
    expect(passed).toBe(true);
  });

  it("updateAlignment updates the alignment of an I3DM file", async function () {
    const fileName = "instancedScale.i3dm";
    const passed = updateAlignmentForSpec(fileName);
    expect(passed).toBe(true);
  });

  it("updateAlignment updates the alignment of a PNTS file", async function () {
    const fileName = "pointCloudRGB.pnts";
    const passed = updateAlignmentForSpec(fileName);
    expect(passed).toBe(true);
  });

  it("updateAlignment updates the alignment of a CMPT file", async function () {
    const fileName = "testComposite.cmpt";
    const passed = updateAlignmentForSpec(fileName);
    expect(passed).toBe(true);
  });
});

import fs from "fs";

import { TileFormatsMigration } from "../../src/migration/TileFormatsMigration";

import { GltfUtilities } from "../../src/contentProcessing/GtlfUtilities";

import { SpecHelpers } from "../SpecHelpers";
import { Paths } from "../../src/base/Paths";

const inputDir = "./specs/data/migration/input/";
const outputDir = "./specs/data/migration/output/";
const goldenDir = "./specs/data/migration/golden/";

/**
 * Computes the JSON strings for the specified migration test case.
 *
 * @param subDir - The subdirectory in the `input` directory
 * @param name - The name of the test (i.e. the directory name)
 * @param fileNameWithoutExtension - The name of the file to migrate,
 * without extension
 * @param extensionWithoutDot - The file extension, without the dot
 * @param migrationFunction - The function for the migration
 * @returns A dictionary containing a string representation of
 * the JSON part of the GLB file that was created, and a string
 * representation of the "golden" file to compare this JSON with
 */
async function computeJsonStrings(
  subDir: string,
  name: string,
  fileNameWithoutExtension: string,
  extensionWithoutDot: string,
  migrationFunction: (input: Buffer) => Promise<Buffer>
): Promise<{ outputJsonString: string; goldenJsonString: string }> {
  //console.log('Migrating ' + inputFile);

  // Read the input file as a buffer
  const fullInputDir = inputDir + subDir + `${name}/`;
  const inputFile =
    fullInputDir + `${fileNameWithoutExtension}.${extensionWithoutDot}`;
  const inputBuffer = fs.readFileSync(inputFile);

  // Migrate the buffer, and extract the JSON string
  // of the resulting GLB
  const outputBuffer = await migrationFunction(inputBuffer);
  const outputJsonBuffer = GltfUtilities.extractJsonFromGlb(outputBuffer);
  let outputJsonString = SpecHelpers.createJsonString(outputJsonBuffer);
  if (!outputJsonString) {
    outputJsonString = "INVALID_OUTPUT";
  }

  // Write the JSON string into the output glTF file
  const fullOutputDir = outputDir + subDir + `${name}/`;
  Paths.ensureDirectoryExists(fullOutputDir);
  const outputFile = fullOutputDir + `${fileNameWithoutExtension}.gltf`;
  //console.log('Writing ' + outputFile);
  fs.writeFileSync(outputFile, Buffer.from(outputJsonString));

  // Read the "golden" output as a JSON string
  const fullGoldenDir = goldenDir + subDir + `${name}/`;
  const goldenFile = fullGoldenDir + `${fileNameWithoutExtension}.gltf`;
  const goldenBuffer = fs.readFileSync(goldenFile);
  let goldenJsonString = SpecHelpers.createJsonString(goldenBuffer);
  if (!goldenJsonString) {
    goldenJsonString = "INVALID_GOLDEN";
  }
  //console.log('Comparing to ' + goldenFile);
  return {
    outputJsonString: outputJsonString,
    goldenJsonString: goldenJsonString,
  };
}

describe("TileFormatsMigration", function () {
  afterEach(function () {
    //SpecHelpers.forceDeleteDirectory(outputDir);
  });

  //==========================================================================
  // PNTS

  it("converts PointCloudBatched to the expected output", async function () {
    const subDir = "PointCloud/";
    const name = "PointCloudBatched";
    const fileNameWithoutExtension = "pointCloudBatched";
    const extensionWithoutDot = "pnts";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension,
      extensionWithoutDot,
      TileFormatsMigration.convertPntsToGlb
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts PointCloudConstantColor to the expected output", async function () {
    const subDir = "PointCloud/";
    const name = "PointCloudConstantColor";
    const fileNameWithoutExtension = "pointCloudConstantColor";
    const extensionWithoutDot = "pnts";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension,
      extensionWithoutDot,
      TileFormatsMigration.convertPntsToGlb
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts PointCloudDraco to the expected output", async function () {
    const subDir = "PointCloud/";
    const name = "PointCloudDraco";
    const fileNameWithoutExtension = "pointCloudDraco";
    const extensionWithoutDot = "pnts";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension,
      extensionWithoutDot,
      TileFormatsMigration.convertPntsToGlb
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts PointCloudDracoBatched to the expected output", async function () {
    const subDir = "PointCloud/";
    const name = "PointCloudDracoBatched";
    const fileNameWithoutExtension = "pointCloudDracoBatched";
    const extensionWithoutDot = "pnts";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension,
      extensionWithoutDot,
      TileFormatsMigration.convertPntsToGlb
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts PointCloudDracoPartial to the expected output", async function () {
    const subDir = "PointCloud/";
    const name = "PointCloudDracoPartial";
    const fileNameWithoutExtension = "pointCloudDracoPartial";
    const extensionWithoutDot = "pnts";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension,
      extensionWithoutDot,
      TileFormatsMigration.convertPntsToGlb
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts PointCloudNoColor to the expected output", async function () {
    const subDir = "PointCloud/";
    const name = "PointCloudNoColor";
    const fileNameWithoutExtension = "pointCloudNoColor";
    const extensionWithoutDot = "pnts";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension,
      extensionWithoutDot,
      TileFormatsMigration.convertPntsToGlb
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts PointCloudNormals to the expected output", async function () {
    const subDir = "PointCloud/";
    const name = "PointCloudNormals";
    const fileNameWithoutExtension = "pointCloudNormals";
    const extensionWithoutDot = "pnts";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension,
      extensionWithoutDot,
      TileFormatsMigration.convertPntsToGlb
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts PointCloudNormalsOctEncoded to the expected output", async function () {
    const subDir = "PointCloud/";
    const name = "PointCloudNormalsOctEncoded";
    const fileNameWithoutExtension = "pointCloudNormalsOctEncoded";
    const extensionWithoutDot = "pnts";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension,
      extensionWithoutDot,
      TileFormatsMigration.convertPntsToGlb
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts PointCloudQuantized to the expected output", async function () {
    const subDir = "PointCloud/";
    const name = "PointCloudQuantized";
    const fileNameWithoutExtension = "pointCloudQuantized";
    const extensionWithoutDot = "pnts";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension,
      extensionWithoutDot,
      TileFormatsMigration.convertPntsToGlb
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts PointCloudQuantizedOctEncoded to the expected output", async function () {
    const subDir = "PointCloud/";
    const name = "PointCloudQuantizedOctEncoded";
    const fileNameWithoutExtension = "pointCloudQuantizedOctEncoded";
    const extensionWithoutDot = "pnts";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension,
      extensionWithoutDot,
      TileFormatsMigration.convertPntsToGlb
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts PointCloudRGB to the expected output", async function () {
    const subDir = "PointCloud/";
    const name = "PointCloudRGB";
    const fileNameWithoutExtension = "pointCloudRGB";
    const extensionWithoutDot = "pnts";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension,
      extensionWithoutDot,
      TileFormatsMigration.convertPntsToGlb
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts PointCloudRGB565 to the expected output", async function () {
    const subDir = "PointCloud/";
    const name = "PointCloudRGB565";
    const fileNameWithoutExtension = "pointCloudRGB565";
    const extensionWithoutDot = "pnts";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension,
      extensionWithoutDot,
      TileFormatsMigration.convertPntsToGlb
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts PointCloudRGBA to the expected output", async function () {
    const subDir = "PointCloud/";
    const name = "PointCloudRGBA";
    const fileNameWithoutExtension = "pointCloudRGBA";
    const extensionWithoutDot = "pnts";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension,
      extensionWithoutDot,
      TileFormatsMigration.convertPntsToGlb
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts PointCloudWGS84 to the expected output", async function () {
    const subDir = "PointCloud/";
    const name = "PointCloudWGS84";
    const fileNameWithoutExtension = "pointCloudWGS84";
    const extensionWithoutDot = "pnts";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension,
      extensionWithoutDot,
      TileFormatsMigration.convertPntsToGlb
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts PointCloudWithPerPointProperties to the expected output", async function () {
    const subDir = "PointCloud/";
    const name = "PointCloudWithPerPointProperties";
    const fileNameWithoutExtension = "pointCloudWithPerPointProperties";
    const extensionWithoutDot = "pnts";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension,
      extensionWithoutDot,
      TileFormatsMigration.convertPntsToGlb
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts PointCloudWithTransform to the expected output", async function () {
    const subDir = "PointCloud/";
    const name = "PointCloudWithTransform";
    const fileNameWithoutExtension = "pointCloudWithTransform";
    const extensionWithoutDot = "pnts";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension,
      extensionWithoutDot,
      TileFormatsMigration.convertPntsToGlb
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts PointCloudWithUnicodePropertyIds to the expected output", async function () {
    const subDir = "PointCloud/";
    const name = "PointCloudWithUnicodePropertyIds";
    const fileNameWithoutExtension = "pointCloudWithUnicodePropertyIds";
    const extensionWithoutDot = "pnts";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension,
      extensionWithoutDot,
      TileFormatsMigration.convertPntsToGlb
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  //==========================================================================
  // B3DM

  it("converts BatchedAnimated to the expected output", async function () {
    const subDir = "Batched/";
    const name = "BatchedAnimated";
    const fileNameWithoutExtension = "batchedAnimated";
    const extensionWithoutDot = "b3dm";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension,
      extensionWithoutDot,
      TileFormatsMigration.convertB3dmToGlb
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts BatchedColors to the expected output", async function () {
    const subDir = "Batched/";
    const name = "BatchedColors";
    const fileNameWithoutExtension = "batchedColors";
    const extensionWithoutDot = "b3dm";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension,
      extensionWithoutDot,
      TileFormatsMigration.convertB3dmToGlb
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts BatchedColorsMix to the expected output", async function () {
    const subDir = "Batched/";
    const name = "BatchedColorsMix";
    const fileNameWithoutExtension = "batchedColorsMix";
    const extensionWithoutDot = "b3dm";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension,
      extensionWithoutDot,
      TileFormatsMigration.convertB3dmToGlb
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts BatchedColorsTranslucent to the expected output", async function () {
    const subDir = "Batched/";
    const name = "BatchedColorsTranslucent";
    const fileNameWithoutExtension = "batchedColorsTranslucent";
    const extensionWithoutDot = "b3dm";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension,
      extensionWithoutDot,
      TileFormatsMigration.convertB3dmToGlb
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts BatchedDeprecated1 to the expected output", async function () {
    const subDir = "Batched/";
    const name = "BatchedDeprecated1";
    const fileNameWithoutExtension = "batchedDeprecated1";
    const extensionWithoutDot = "b3dm";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension,
      extensionWithoutDot,
      TileFormatsMigration.convertB3dmToGlb
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts BatchedDeprecated2 to the expected output", async function () {
    const subDir = "Batched/";
    const name = "BatchedDeprecated2";
    const fileNameWithoutExtension = "batchedDeprecated2";
    const extensionWithoutDot = "b3dm";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension,
      extensionWithoutDot,
      TileFormatsMigration.convertB3dmToGlb
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts BatchedExpiration to the expected output", async function () {
    const subDir = "Batched/";
    const name = "BatchedExpiration";
    const fileNameWithoutExtension = "batchedExpiration";
    const extensionWithoutDot = "b3dm";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension,
      extensionWithoutDot,
      TileFormatsMigration.convertB3dmToGlb
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts BatchedNoBatchIds to the expected output", async function () {
    const subDir = "Batched/";
    const name = "BatchedNoBatchIds";
    const fileNameWithoutExtension = "batchedNoBatchIds";
    const extensionWithoutDot = "b3dm";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension,
      extensionWithoutDot,
      TileFormatsMigration.convertB3dmToGlb
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts BatchedTextured to the expected output", async function () {
    const subDir = "Batched/";
    const name = "BatchedTextured";
    const fileNameWithoutExtension = "batchedTextured";
    const extensionWithoutDot = "b3dm";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension,
      extensionWithoutDot,
      TileFormatsMigration.convertB3dmToGlb
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts BatchedTranslucent to the expected output", async function () {
    const subDir = "Batched/";
    const name = "BatchedTranslucent";
    const fileNameWithoutExtension = "batchedTranslucent";
    const extensionWithoutDot = "b3dm";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension,
      extensionWithoutDot,
      TileFormatsMigration.convertB3dmToGlb
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts BatchedTranslucentOpaqueMix to the expected output", async function () {
    const subDir = "Batched/";
    const name = "BatchedTranslucentOpaqueMix";
    const fileNameWithoutExtension = "batchedTranslucentOpaqueMix";
    const extensionWithoutDot = "b3dm";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension,
      extensionWithoutDot,
      TileFormatsMigration.convertB3dmToGlb
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts BatchedWGS84 to the expected output", async function () {
    const subDir = "Batched/";
    const name = "BatchedWGS84";
    const fileNameWithoutExtension = "batchedWGS84";
    const extensionWithoutDot = "b3dm";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension,
      extensionWithoutDot,
      TileFormatsMigration.convertB3dmToGlb
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts BatchedWithBatchTable to the expected output", async function () {
    const subDir = "Batched/";
    const name = "BatchedWithBatchTable";
    const fileNameWithoutExtension = "batchedWithBatchTable";
    const extensionWithoutDot = "b3dm";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension,
      extensionWithoutDot,
      TileFormatsMigration.convertB3dmToGlb
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts BatchedWithBatchTableBinary to the expected output", async function () {
    const subDir = "Batched/";
    const name = "BatchedWithBatchTableBinary";
    const fileNameWithoutExtension = "batchedWithBatchTableBinary";
    const extensionWithoutDot = "b3dm";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension,
      extensionWithoutDot,
      TileFormatsMigration.convertB3dmToGlb
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts BatchedWithBoundingSphere to the expected output", async function () {
    const subDir = "Batched/";
    const name = "BatchedWithBoundingSphere";
    const fileNameWithoutExtension = "batchedWithBoundingSphere";
    const extensionWithoutDot = "b3dm";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension,
      extensionWithoutDot,
      TileFormatsMigration.convertB3dmToGlb
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts BatchedWithCopyright to the expected output", async function () {
    const subDir = "Batched/";
    const name = "BatchedWithCopyright";
    const fileNameWithoutExtension = "batchedWithCopyright";
    const extensionWithoutDot = "b3dm";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension,
      extensionWithoutDot,
      TileFormatsMigration.convertB3dmToGlb
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts BatchedWithoutBatchTable to the expected output", async function () {
    const subDir = "Batched/";
    const name = "BatchedWithoutBatchTable";
    const fileNameWithoutExtension = "batchedWithoutBatchTable";
    const extensionWithoutDot = "b3dm";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension,
      extensionWithoutDot,
      TileFormatsMigration.convertB3dmToGlb
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts BatchedWithRtcCenter to the expected output", async function () {
    const subDir = "Batched/";
    const name = "BatchedWithRtcCenter";
    const fileNameWithoutExtension = "batchedWithRtcCenter";
    const extensionWithoutDot = "b3dm";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension,
      extensionWithoutDot,
      TileFormatsMigration.convertB3dmToGlb
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts BatchedWithTransformBox to the expected output", async function () {
    const subDir = "Batched/";
    const name = "BatchedWithTransformBox";
    const fileNameWithoutExtension = "batchedWithTransformBox";
    const extensionWithoutDot = "b3dm";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension,
      extensionWithoutDot,
      TileFormatsMigration.convertB3dmToGlb
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts BatchedWithTransformRegion to the expected output", async function () {
    const subDir = "Batched/";
    const name = "BatchedWithTransformRegion";
    const fileNameWithoutExtension = "batchedWithTransformRegion";
    const extensionWithoutDot = "b3dm";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension,
      extensionWithoutDot,
      TileFormatsMigration.convertB3dmToGlb
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts BatchedWithTransformSphere to the expected output", async function () {
    const subDir = "Batched/";
    const name = "BatchedWithTransformSphere";
    const fileNameWithoutExtension = "batchedWithTransformSphere";
    const extensionWithoutDot = "b3dm";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension,
      extensionWithoutDot,
      TileFormatsMigration.convertB3dmToGlb
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts BatchedWithVertexColors to the expected output", async function () {
    const subDir = "Batched/";
    const name = "BatchedWithVertexColors";
    const fileNameWithoutExtension = "batchedWithVertexColors";
    const extensionWithoutDot = "b3dm";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension,
      extensionWithoutDot,
      TileFormatsMigration.convertB3dmToGlb
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });
});

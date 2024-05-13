import fs from "fs";

import { Paths } from "../../../src/base";

import { StructuralMetadataMerger } from "../../../src/tools";
import { TilesetOperations } from "../../../src/tools";
import { GltfUtilities } from "../../../src/tools";

import { SpecHelpers } from "../../SpecHelpers";

const SPECS_DATA_BASE_DIRECTORY = SpecHelpers.getSpecsDataBaseDirectory();

const sourceDir = SPECS_DATA_BASE_DIRECTORY + "/migration/input/";
const targetDir = SPECS_DATA_BASE_DIRECTORY + "/migration/output/";
const targetGltfDir = SPECS_DATA_BASE_DIRECTORY + "/migration/output_gltf/";
const goldenGltfDir = SPECS_DATA_BASE_DIRECTORY + "/migration/golden_gltf/";

/**
 * Computes the JSON strings to compare for the specified migration
 * test case.
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
  fileNameWithoutExtension: string
): Promise<{ outputJsonString: string; goldenJsonString: string }> {
  //console.log('Migrating ' + inputFile);

  // Perform the actual upgrade
  const sourceName = sourceDir + subDir + `${name}/`;
  const targetName = targetDir + subDir + `${name}/`;
  const overwrite = true;
  const targetVersion = "1.1";
  const gltfUpgradeOptions = undefined;
  await TilesetOperations.upgrade(
    sourceName,
    targetName,
    overwrite,
    targetVersion,
    gltfUpgradeOptions
  );

  // Read the output GLB file, and extract the
  // glTF JSON part from this file
  const fullOutputDir = targetDir + subDir + `${name}/`;
  const outputFile = fullOutputDir + `${fileNameWithoutExtension}.glb`;
  const outputGlbBuffer = fs.readFileSync(outputFile);
  const outputGltfJsonBuffer =
    GltfUtilities.extractJsonFromGlb(outputGlbBuffer);
  let outputGltfJsonString = SpecHelpers.createJsonString(outputGltfJsonBuffer);
  if (!outputGltfJsonString) {
    outputGltfJsonString = "INVALID_OUTPUT";
  }

  // Write the glTF JSON part of the output
  const fullOutputGltfDir = targetGltfDir + subDir + `${name}/`;
  const outputGltfFile = fullOutputGltfDir + `${fileNameWithoutExtension}.gltf`;
  Paths.ensureDirectoryExists(fullOutputGltfDir);
  fs.writeFileSync(outputGltfFile, Buffer.from(outputGltfJsonString));

  // Read the "golden" output as a JSON string
  const fullGoldenGltfDir = goldenGltfDir + subDir + `${name}/`;
  const goldenGltfFile = fullGoldenGltfDir + `${fileNameWithoutExtension}.gltf`;
  const goldenGltfBuffer = fs.readFileSync(goldenGltfFile);
  let goldenGltfJsonString = SpecHelpers.createJsonString(goldenGltfBuffer);
  if (!goldenGltfJsonString) {
    goldenGltfJsonString = "INVALID_GOLDEN";
  }
  //console.log('Comparing to ' + goldenFile);
  return {
    outputJsonString: outputGltfJsonString,
    goldenJsonString: goldenGltfJsonString,
  };
}

describe("TileFormatsMigration", function () {
  afterEach(function () {
    //SpecHelpers.forceDeleteDirectory(outputDir);
  });
  beforeEach(function () {
    StructuralMetadataMerger.setMergedSchemaIdSuffix("SPEC_SCHEMA_ID_SUFFIX");
  });

  //==========================================================================
  // PNTS

  it("converts PointCloudBatched to the expected output", async function () {
    const subDir = "PointCloud/";
    const name = "PointCloudBatched";
    const fileNameWithoutExtension = "pointCloudBatched";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts PointCloudConstantColor to the expected output", async function () {
    const subDir = "PointCloud/";
    const name = "PointCloudConstantColor";
    const fileNameWithoutExtension = "pointCloudConstantColor";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts PointCloudDraco to the expected output", async function () {
    const subDir = "PointCloud/";
    const name = "PointCloudDraco";
    const fileNameWithoutExtension = "pointCloudDraco";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts PointCloudDracoBatched to the expected output", async function () {
    const subDir = "PointCloud/";
    const name = "PointCloudDracoBatched";
    const fileNameWithoutExtension = "pointCloudDracoBatched";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts PointCloudDracoPartial to the expected output", async function () {
    const subDir = "PointCloud/";
    const name = "PointCloudDracoPartial";
    const fileNameWithoutExtension = "pointCloudDracoPartial";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts PointCloudNoColor to the expected output", async function () {
    const subDir = "PointCloud/";
    const name = "PointCloudNoColor";
    const fileNameWithoutExtension = "pointCloudNoColor";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts PointCloudNormals to the expected output", async function () {
    const subDir = "PointCloud/";
    const name = "PointCloudNormals";
    const fileNameWithoutExtension = "pointCloudNormals";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts PointCloudNormalsOctEncoded to the expected output", async function () {
    const subDir = "PointCloud/";
    const name = "PointCloudNormalsOctEncoded";
    const fileNameWithoutExtension = "pointCloudNormalsOctEncoded";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts PointCloudQuantized to the expected output", async function () {
    const subDir = "PointCloud/";
    const name = "PointCloudQuantized";
    const fileNameWithoutExtension = "pointCloudQuantized";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts PointCloudQuantizedOctEncoded to the expected output", async function () {
    const subDir = "PointCloud/";
    const name = "PointCloudQuantizedOctEncoded";
    const fileNameWithoutExtension = "pointCloudQuantizedOctEncoded";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts PointCloudRGB to the expected output", async function () {
    const subDir = "PointCloud/";
    const name = "PointCloudRGB";
    const fileNameWithoutExtension = "pointCloudRGB";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts PointCloudRGB565 to the expected output", async function () {
    const subDir = "PointCloud/";
    const name = "PointCloudRGB565";
    const fileNameWithoutExtension = "pointCloudRGB565";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts PointCloudRGBA to the expected output", async function () {
    const subDir = "PointCloud/";
    const name = "PointCloudRGBA";
    const fileNameWithoutExtension = "pointCloudRGBA";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts PointCloudWGS84 to the expected output", async function () {
    const subDir = "PointCloud/";
    const name = "PointCloudWGS84";
    const fileNameWithoutExtension = "pointCloudWGS84";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts PointCloudWithPerPointProperties to the expected output", async function () {
    const subDir = "PointCloud/";
    const name = "PointCloudWithPerPointProperties";
    const fileNameWithoutExtension = "pointCloudWithPerPointProperties";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts PointCloudWithTransform to the expected output", async function () {
    const subDir = "PointCloud/";
    const name = "PointCloudWithTransform";
    const fileNameWithoutExtension = "pointCloudWithTransform";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts PointCloudWithUnicodePropertyIds to the expected output", async function () {
    const subDir = "PointCloud/";
    const name = "PointCloudWithUnicodePropertyIds";
    const fileNameWithoutExtension = "pointCloudWithUnicodePropertyIds";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  //==========================================================================
  // B3DM

  it("converts BatchedAnimated to the expected output", async function () {
    const subDir = "Batched/";
    const name = "BatchedAnimated";
    const fileNameWithoutExtension = "batchedAnimated";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts BatchedColors to the expected output", async function () {
    const subDir = "Batched/";
    const name = "BatchedColors";
    const fileNameWithoutExtension = "batchedColors";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts BatchedColorsMix to the expected output", async function () {
    const subDir = "Batched/";
    const name = "BatchedColorsMix";
    const fileNameWithoutExtension = "batchedColorsMix";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts BatchedColorsTranslucent to the expected output", async function () {
    const subDir = "Batched/";
    const name = "BatchedColorsTranslucent";
    const fileNameWithoutExtension = "batchedColorsTranslucent";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts BatchedDeprecated1 to the expected output", async function () {
    const subDir = "Batched/";
    const name = "BatchedDeprecated1";
    const fileNameWithoutExtension = "batchedDeprecated1";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts BatchedDeprecated2 to the expected output", async function () {
    const subDir = "Batched/";
    const name = "BatchedDeprecated2";
    const fileNameWithoutExtension = "batchedDeprecated2";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts BatchedExpiration to the expected output", async function () {
    const subDir = "Batched/";
    const name = "BatchedExpiration";
    const fileNameWithoutExtension = "batchedExpiration";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts BatchedNoBatchIds to the expected output", async function () {
    const subDir = "Batched/";
    const name = "BatchedNoBatchIds";
    const fileNameWithoutExtension = "batchedNoBatchIds";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts BatchedTextured to the expected output", async function () {
    const subDir = "Batched/";
    const name = "BatchedTextured";
    const fileNameWithoutExtension = "batchedTextured";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts BatchedTranslucent to the expected output", async function () {
    const subDir = "Batched/";
    const name = "BatchedTranslucent";
    const fileNameWithoutExtension = "batchedTranslucent";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts BatchedTranslucentOpaqueMix to the expected output", async function () {
    const subDir = "Batched/";
    const name = "BatchedTranslucentOpaqueMix";
    const fileNameWithoutExtension = "batchedTranslucentOpaqueMix";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts BatchedWGS84 to the expected output", async function () {
    const subDir = "Batched/";
    const name = "BatchedWGS84";
    const fileNameWithoutExtension = "batchedWGS84";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts BatchedWithBatchTable to the expected output", async function () {
    const subDir = "Batched/";
    const name = "BatchedWithBatchTable";
    const fileNameWithoutExtension = "batchedWithBatchTable";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts BatchedWithBatchTableBinary to the expected output", async function () {
    const subDir = "Batched/";
    const name = "BatchedWithBatchTableBinary";
    const fileNameWithoutExtension = "batchedWithBatchTableBinary";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts BatchedWithBoundingSphere to the expected output", async function () {
    const subDir = "Batched/";
    const name = "BatchedWithBoundingSphere";
    const fileNameWithoutExtension = "batchedWithBoundingSphere";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts BatchedWithCopyright to the expected output", async function () {
    const subDir = "Batched/";
    const name = "BatchedWithCopyright";
    const fileNameWithoutExtension = "batchedWithCopyright";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts BatchedWithoutBatchTable to the expected output", async function () {
    const subDir = "Batched/";
    const name = "BatchedWithoutBatchTable";
    const fileNameWithoutExtension = "batchedWithoutBatchTable";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts BatchedWithRtcCenter to the expected output", async function () {
    const subDir = "Batched/";
    const name = "BatchedWithRtcCenter";
    const fileNameWithoutExtension = "batchedWithRtcCenter";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts BatchedWithTransformBox to the expected output", async function () {
    const subDir = "Batched/";
    const name = "BatchedWithTransformBox";
    const fileNameWithoutExtension = "batchedWithTransformBox";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts BatchedWithTransformRegion to the expected output", async function () {
    const subDir = "Batched/";
    const name = "BatchedWithTransformRegion";
    const fileNameWithoutExtension = "batchedWithTransformRegion";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts BatchedWithTransformSphere to the expected output", async function () {
    const subDir = "Batched/";
    const name = "BatchedWithTransformSphere";
    const fileNameWithoutExtension = "batchedWithTransformSphere";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts BatchedWithVertexColors to the expected output", async function () {
    const subDir = "Batched/";
    const name = "BatchedWithVertexColors";
    const fileNameWithoutExtension = "batchedWithVertexColors";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  //==========================================================================
  // I3DM

  it("converts InstancedAnimated to the expected output", async function () {
    const subDir = "Instanced/";
    const name = "InstancedAnimated";
    const fileNameWithoutExtension = "instancedAnimated";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts InstancedGltfExternal to the expected output", async function () {
    const subDir = "Instanced/";
    const name = "InstancedGltfExternal";
    const fileNameWithoutExtension = "instancedGltfExternal";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts InstancedOct32POrientation to the expected output", async function () {
    const subDir = "Instanced/";
    const name = "InstancedOct32POrientation";
    const fileNameWithoutExtension = "instancedOct32POrientation";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts InstancedOrientation to the expected output", async function () {
    const subDir = "Instanced/";
    const name = "InstancedOrientation";
    const fileNameWithoutExtension = "instancedOrientation";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts InstancedQuantized to the expected output", async function () {
    const subDir = "Instanced/";
    const name = "InstancedQuantized";
    const fileNameWithoutExtension = "instancedQuantized";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts InstancedQuantizedOct32POrientation to the expected output", async function () {
    const subDir = "Instanced/";
    const name = "InstancedQuantizedOct32POrientation";
    const fileNameWithoutExtension = "instancedQuantizedOct32POrientation";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts InstancedRedMaterial to the expected output", async function () {
    const subDir = "Instanced/";
    const name = "InstancedRedMaterial";
    const fileNameWithoutExtension = "instancedRedMaterial";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts InstancedRTC to the expected output", async function () {
    const subDir = "Instanced/";
    const name = "InstancedRTC";
    const fileNameWithoutExtension = "instancedRTC";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts InstancedScale to the expected output", async function () {
    const subDir = "Instanced/";
    const name = "InstancedScale";
    const fileNameWithoutExtension = "instancedScale";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts InstancedScaleNonUniform to the expected output", async function () {
    const subDir = "Instanced/";
    const name = "InstancedScaleNonUniform";
    const fileNameWithoutExtension = "instancedScaleNonUniform";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts InstancedTextured to the expected output", async function () {
    const subDir = "Instanced/";
    const name = "InstancedTextured";
    const fileNameWithoutExtension = "instancedTextured";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts InstancedWithBatchIds to the expected output", async function () {
    const subDir = "Instanced/";
    const name = "InstancedWithBatchIds";
    const fileNameWithoutExtension = "instancedWithBatchIds";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts InstancedWithBatchTable to the expected output", async function () {
    const subDir = "Instanced/";
    const name = "InstancedWithBatchTable";
    const fileNameWithoutExtension = "instancedWithBatchTable";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts InstancedWithBatchTableBinary to the expected output", async function () {
    const subDir = "Instanced/";
    const name = "InstancedWithBatchTableBinary";
    const fileNameWithoutExtension = "instancedWithBatchTableBinary";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts InstancedWithCopyright to the expected output", async function () {
    const subDir = "Instanced/";
    const name = "InstancedWithCopyright";
    const fileNameWithoutExtension = "instancedWithCopyright";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts InstancedWithoutBatchTable to the expected output", async function () {
    const subDir = "Instanced/";
    const name = "InstancedWithoutBatchTable";
    const fileNameWithoutExtension = "instancedWithoutBatchTable";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts InstancedWithoutNormals to the expected output", async function () {
    const subDir = "Instanced/";
    const name = "InstancedWithoutNormals";
    const fileNameWithoutExtension = "instancedWithoutNormals";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts InstancedWithTransform to the expected output", async function () {
    const subDir = "Instanced/";
    const name = "InstancedWithTransform";
    const fileNameWithoutExtension = "instancedWithTransform";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  //==========================================================================
  // I3DM (Axes)

  it("converts InstancedAxesSimple to the expected output", async function () {
    const subDir = "InstancedAxes/";
    const name = "InstancedAxesSimple";
    const fileNameWithoutExtension = "instancedAxesSimple";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts InstancedAxesRotated to the expected output", async function () {
    const subDir = "InstancedAxes/";
    const name = "InstancedAxesRotated";
    const fileNameWithoutExtension = "instancedAxesRotated";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts InstancedAxesScaled to the expected output", async function () {
    const subDir = "InstancedAxes/";
    const name = "InstancedAxesScaled";
    const fileNameWithoutExtension = "instancedAxesScaled";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  //==========================================================================
  // B3DM (Legacy)

  it("converts BatchedWithGltf1With2DNormals to the expected output", async function () {
    const subDir = "BatchedLegacy/";
    const name = "BatchedWithGltf1With2DNormals";
    const fileNameWithoutExtension = "batchedWithGltf1With2DNormals";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  //==========================================================================
  // CMPT

  it("converts Composite to the expected output", async function () {
    const subDir = "Composite/";
    const name = "Composite";
    const fileNameWithoutExtension = "composite";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts CompositeOfComposite to the expected output", async function () {
    const subDir = "Composite/";
    const name = "CompositeOfComposite";
    const fileNameWithoutExtension = "compositeOfComposite";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });

  it("converts CompositeOfInstanced to the expected output", async function () {
    const subDir = "Composite/";
    const name = "CompositeOfInstanced";
    const fileNameWithoutExtension = "compositeOfInstanced";
    const jsonStrings = await computeJsonStrings(
      subDir,
      name,
      fileNameWithoutExtension
    );
    expect(jsonStrings.outputJsonString).toEqual(jsonStrings.goldenJsonString);
  });
});

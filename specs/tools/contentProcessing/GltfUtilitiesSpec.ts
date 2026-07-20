import GltfPipeline from "gltf-pipeline";

import fs from "fs";

import { GltfJson, GltfUtilities } from "../../../src/tools";

import { SpecHelpers } from "../../SpecHelpers";

const SPECS_DATA_BASE_DIRECTORY = SpecHelpers.getSpecsDataBaseDirectory();

// A glTF that uses CESIUM_RTC.
// It defines two scenes
// - scene 0 with nodes 0 and 1
// - scene 1 with nodes 2 and 3
const inputGltfWithCesiumRtc: any = {
  asset: {
    version: "2.0",
  },
  extensionsUsed: ["CESIUM_RTC"],
  extensionsRequired: ["CESIUM_RTC"],
  extensions: {
    CESIUM_RTC: {
      center: [123.456, 234.567, 345.678],
    },
  },
  scene: 0,
  scenes: [
    {
      nodes: [0, 1],
    },
    {
      nodes: [2, 3],
    },
  ],
  nodes: [
    {
      name: "node0",
    },
    {
      name: "node1",
    },
    {
      name: "node2",
    },
    {
      name: "node3",
    },
    {
      name: "node4",
    },
    {
      name: "node5",
    },
  ],
};

describe("GltfUtilities", function () {
  it("replaceCesiumRtcExtension replaces the CESIUM_RTC extension", async function () {
    const inputGltf = inputGltfWithCesiumRtc;
    const rtcTranslation = inputGltf.extensions["CESIUM_RTC"].center;
    const options = {
      keepUnusedElements: true,
    };

    // The translation, taking y-up-vs-z-up into account:
    const translation = [
      rtcTranslation[0],
      rtcTranslation[2],
      -rtcTranslation[1],
    ];

    // Create a GLB from the input glTF
    const glbResults = await GltfPipeline.gltfToGlb(inputGltf, options);
    const inputGlb = glbResults.glb;

    // Remove the RTC extension
    const gltfUpAxis = "Y";
    const outputGlb = await GltfUtilities.replaceCesiumRtcExtension(
      inputGlb,
      gltfUpAxis
    );

    // Create a glTF from the resulting GLB
    const gltfResults = await GltfPipeline.glbToGltf(outputGlb, options);
    const outputGltf = gltfResults.gltf;

    // There are 10 nodes, namely the 6 existing ones, plus 4 new roots
    expect(outputGltf.nodes.length).toBe(10);

    // The former roots of scene 0 (nodes 0 and 1) have
    // been re-parented to nodes 6 and 7
    expect(outputGltf.scenes[0].nodes).toEqual([6, 7]);
    expect(outputGltf.nodes[6].children).toEqual([0]);
    expect(outputGltf.nodes[7].children).toEqual([1]);

    // The former roots of scene 0 (nodes 2 and 3) have
    // been re-parented to nodes 6 and 7
    expect(outputGltf.scenes[1].nodes).toEqual([8, 9]);
    expect(outputGltf.nodes[8].children).toEqual([2]);
    expect(outputGltf.nodes[9].children).toEqual([3]);

    // All new nodes have the RTC center as their translation
    expect(outputGltf.nodes[8].translation).toEqual(translation);
    expect(outputGltf.nodes[9].translation).toEqual(translation);
    expect(outputGltf.nodes[6].translation).toEqual(translation);
    expect(outputGltf.nodes[7].translation).toEqual(translation);

    // The extensions object and declarations have been removed
    expect(outputGltf.extensions).toBeUndefined();
    expect(outputGltf.extensionsUsed).toBeUndefined();
    expect(outputGltf.extensionsRequired).toBeUndefined();
  });

  it("can extract data from a glTF 1.0 GLB with 5 bytes binary data", function () {
    const glb = fs.readFileSync(
      SPECS_DATA_BASE_DIRECTORY + "/gltf/glTF1GlbWith5BytesBin.glb"
    );
    const data = GltfUtilities.extractDataFromGlb(glb);
    expect(data.jsonData.length).not.toBe(0);
    // glTF 1.0 did not require padding
    expect(data.binData).toEqual(Buffer.from([0, 1, 2, 3, 4]));
  });

  it("can extract data from a glTF 1.0 GLB without binary data", function () {
    const glb = fs.readFileSync(
      SPECS_DATA_BASE_DIRECTORY + "/gltf/glTF1GlbWithoutBin.glb"
    );
    const data = GltfUtilities.extractDataFromGlb(glb);
    expect(data.jsonData.length).not.toBe(0);
    expect(data.binData).toEqual(Buffer.from([]));
  });

  it("can extract data from a glTF 2.0 GLB with 5 bytes binary data", function () {
    const glb = fs.readFileSync(
      SPECS_DATA_BASE_DIRECTORY + "/gltf/glTF2GlbWith5BytesBin.glb"
    );
    const data = GltfUtilities.extractDataFromGlb(glb);
    expect(data.jsonData.length).not.toBe(0);
    // glTF 2.0 does require padding with '0'-bytes
    expect(data.binData).toEqual(Buffer.from([0, 1, 2, 3, 4, 0, 0, 0]));
  });

  it("can extract data from a glTF 2.0 GLB without binary data", function () {
    const glb = fs.readFileSync(
      SPECS_DATA_BASE_DIRECTORY + "/gltf/glTF2GlbWithoutBin.glb"
    );
    const data = GltfUtilities.extractDataFromGlb(glb);
    expect(data.jsonData.length).not.toBe(0);
    expect(data.binData).toEqual(Buffer.from([]));
  });

  it("replaceLegacyGaussianSplattingExtensionGltf properly upgrades the legacy 3DGS glTF JSON to the current 3DGS glTF spec", function () {
    // This is *not* a valid glTF file JSON, and isn't intended to be so.
    //   This is basically the bare minimum we need for a test of the 3DGS
    //   tileset upgrade process.
    const legacyGltfJson: GltfJson = {
      extensionsUsed: ["KHR_spz_gaussian_splats_compression"],
      extensionsRequired: ["KHR_spz_gaussian_splats_compression"],
      meshes: [
        {
          primitives: [
            {
              extensions: {
                KHR_spz_gaussian_splats_compression: {
                  bufferView: 0,
                },
              },
              attributes: {
                POSITION: 0,
                COLOR_0: 1,
                _ROTATION: 2,
                _SCALE: 3,
                _SH_DEGREE_1_COEF_0: 4,
                _SH_DEGREE_1_COEF_1: 5,
                _SH_DEGREE_1_COEF_2: 6,
                _SH_DEGREE_2_COEF_0: 7,
                _SH_DEGREE_2_COEF_1: 8,
                _SH_DEGREE_2_COEF_2: 9,
                _SH_DEGREE_2_COEF_3: 10,
                _SH_DEGREE_2_COEF_4: 11,
                _SH_DEGREE_3_COEF_0: 12,
                _SH_DEGREE_3_COEF_1: 13,
                _SH_DEGREE_3_COEF_2: 14,
                _SH_DEGREE_3_COEF_3: 15,
                _SH_DEGREE_3_COEF_4: 16,
                _SH_DEGREE_3_COEF_5: 17,
                _SH_DEGREE_3_COEF_6: 18,
              },
            },
          ],
        },
      ],
    };

    // Same as above, but contains what we expect the result to be.
    const currentGltfJson: GltfJson = {
      extensionsUsed: [
        "KHR_gaussian_splatting",
        "KHR_gaussian_splatting_compression_spz_2",
      ],
      extensionsRequired: [
        "KHR_gaussian_splatting",
        "KHR_gaussian_splatting_compression_spz_2",
      ],
      meshes: [
        {
          primitives: [
            {
              extensions: {
                KHR_gaussian_splatting: {
                  extensions: {
                    KHR_gaussian_splatting_compression_spz_2: {
                      bufferView: 0,
                    },
                  },
                },
              },
              attributes: {
                POSITION: 0,
                COLOR_0: 1,
                "KHR_gaussian_splatting:ROTATION": 2,
                "KHR_gaussian_splatting:SCALE": 3,
                "KHR_gaussian_splatting:SH_DEGREE_1_COEF_0": 4,
                "KHR_gaussian_splatting:SH_DEGREE_1_COEF_1": 5,
                "KHR_gaussian_splatting:SH_DEGREE_1_COEF_2": 6,
                "KHR_gaussian_splatting:SH_DEGREE_2_COEF_0": 7,
                "KHR_gaussian_splatting:SH_DEGREE_2_COEF_1": 8,
                "KHR_gaussian_splatting:SH_DEGREE_2_COEF_2": 9,
                "KHR_gaussian_splatting:SH_DEGREE_2_COEF_3": 10,
                "KHR_gaussian_splatting:SH_DEGREE_2_COEF_4": 11,
                "KHR_gaussian_splatting:SH_DEGREE_3_COEF_0": 12,
                "KHR_gaussian_splatting:SH_DEGREE_3_COEF_1": 13,
                "KHR_gaussian_splatting:SH_DEGREE_3_COEF_2": 14,
                "KHR_gaussian_splatting:SH_DEGREE_3_COEF_3": 15,
                "KHR_gaussian_splatting:SH_DEGREE_3_COEF_4": 16,
                "KHR_gaussian_splatting:SH_DEGREE_3_COEF_5": 17,
                "KHR_gaussian_splatting:SH_DEGREE_3_COEF_6": 18,
              },
            },
          ],
        },
      ],
    };

    const resultJson = structuredClone(legacyGltfJson);
    GltfUtilities.replaceLegacyGaussianSplattingExtensionGltf(resultJson);

    expect(resultJson).toEqual(currentGltfJson);
  });

  describe("replaceLegacyGaussianSplattingExtensionGlb", function () {
    let glbBuffer: Buffer, resultBuffer: Buffer, fnSpy: jasmine.Spy;

    beforeAll(function () {
      glbBuffer = fs.readFileSync(
        SPECS_DATA_BASE_DIRECTORY + "/gltf/splatting/UnitSH_legacy.glb"
      );

      // Spying on the replaceLegacyGaussianSplattingExtensionGltf function
      //  so this test is specific to replaceLegacyGaussianSplattingExtensionGlb
      fnSpy = spyOn(
        GltfUtilities,
        "replaceLegacyGaussianSplattingExtensionGltf"
      );

      resultBuffer =
        GltfUtilities.replaceLegacyGaussianSplattingExtensionGlb(glbBuffer);
    });

    it("calls replaceLegacyGaussianSplattingExtensionGltf with a valid glTF JSON object", function () {
      expect(fnSpy.calls.count()).toBe(1);
    });

    it("doesn't change the underlying bin data", function () {
      const expectedData = GltfUtilities.extractDataFromGlb(glbBuffer);
      const resultingData = GltfUtilities.extractDataFromGlb(resultBuffer);

      expect(resultingData.binData).toEqual(expectedData.binData);
    });
  });

  it("replaceLegacyGaussianSplattingExtensionGltf2Json calls replaceLegacyGaussianSplattingExtensionGltf with a valid glTF JSON object", function () {
    const gltfJsonBuffer = fs.readFileSync(
      SPECS_DATA_BASE_DIRECTORY + "/gltf/splatting/UnitSH_legacy.gltf"
    );

    // Spying on the replaceLegacyGaussianSplattingExtensionGltf function
    //  so this test is specific to replaceLegacyGaussianSplattingExtensionGltf2Json
    const fnSpy = spyOn(
      GltfUtilities,
      "replaceLegacyGaussianSplattingExtensionGltf"
    );

    // We don't have any data to verify here.
    GltfUtilities.replaceLegacyGaussianSplattingExtensionGltf2Json(
      gltfJsonBuffer
    );

    expect(fnSpy.calls.count()).toBe(1);
  });
});

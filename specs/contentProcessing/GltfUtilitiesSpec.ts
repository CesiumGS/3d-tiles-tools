import GltfPipeline from "gltf-pipeline";

import { GltfUtilities } from "../../src/contentProcessing/GtlfUtilities";

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
    const outputGlb = await GltfUtilities.replaceCesiumRtcExtension(inputGlb);

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
});

const viewer = new Cesium.Viewer("cesiumContainer", {
  globe: false
});

// Stores the tileset that is currently selected
let currentTileset;
let currentTilesetName = "tilesetWithB3dmWithGltf1";
let inputOrOutput = "input";
let doSetModelMatrix = false;

// Creates the tileset for the sample with the current name
async function recreateTileset() {
  if (Cesium.defined(currentTileset)) {
    viewer.scene.primitives.remove(currentTileset);
    currentTileset = undefined;
  }
  // Create the tileset, and move it to a certain position on the globe
  currentTileset = viewer.scene.primitives.add(
    await Cesium.Cesium3DTileset.fromUrl(
      `http://localhost:8003/${inputOrOutput}/${currentTilesetName}/tileset.json`,
      {
        debugShowBoundingVolume: true,
      }
    )
  );

  if (doSetModelMatrix) {
    currentTileset.modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(
      Cesium.Cartesian3.fromDegrees(-75.152325, 39.94704, 100)
    );
    const offset = new Cesium.HeadingPitchRange(
      Cesium.Math.toRadians(-22.5),
      Cesium.Math.toRadians(-22.5),
      10.0
    );
    viewer.zoomTo(currentTileset, offset);
  } else {
    const offset = new Cesium.HeadingPitchRange(
      Cesium.Math.toRadians(-22.5),
      Cesium.Math.toRadians(-22.5),
      500.0
    );
    viewer.zoomTo(currentTileset, offset);
  }
}

//============================================================================
// Sandcastle UI setup:

// Create one entry for the list of examples that can
// be selected in the dropdown menu.
function createSampleOption(name, mustSetModelMatrix) {
  return {
    text: name,
    onselect: async function () {
	  currentTilesetName = name;
      doSetModelMatrix = mustSetModelMatrix;
      await recreateTileset();
    },
  };
}

// Create the list of available samples, and add them
// to the sandcastle toolbar
const sampleOptions = [
  createSampleOption("tilesetWithB3dmWithGltf1", false),
  createSampleOption("tilesetWithB3dmWithGltf1WithWeb3dQuantizedAttributes", true),
  createSampleOption("tilesetWithB3dmWithGltf2WithCesiumRtc", true),
  createSampleOption("tilesetWithContentUrls", false),
  createSampleOption("tilesetWithExternalTilesetWithUrls", false),
  createSampleOption("tilesetWithGltf2GlbWithCesiumRtc", false),
  createSampleOption("tilesetWithGltf2WithCesiumRtc", false),
  createSampleOption("tilesetWithI3dmWithGltf1", true),
];
Sandcastle.addToolbarMenu(sampleOptions);

Sandcastle.addToolbarButton("Input", function () {
  inputOrOutput = "input";
  recreateTileset();
});
Sandcastle.addToolbarButton("Output", function () {
  inputOrOutput = "output";
  recreateTileset();
});

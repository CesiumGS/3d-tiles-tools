const viewer = new Cesium.Viewer("cesiumContainer", {
  globe: false
});

// Stores the tileset that is currently selected
let currentTileset;
let currentTilesetName = "glTF1-y-up";
let inputOrOutput = "input";
let doZoom = false;

// Creates the tileset for the sample with the current name
async function recreateTileset() {
  if (Cesium.defined(currentTileset)) {
    viewer.scene.primitives.remove(currentTileset);
    currentTileset = undefined;
    doZoom = true;
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
  currentTileset.modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(
    Cesium.Cartesian3.fromDegrees(-75.152325, 39.94704, 100)
  );
  const offset = new Cesium.HeadingPitchRange(
    Cesium.Math.toRadians(-22.5),
    Cesium.Math.toRadians(-22.5),
    12.0
  );
  viewer.zoomTo(currentTileset, offset);
}

//============================================================================
// Sandcastle UI setup:

// Create one entry for the list of examples that can
// be selected in the dropdown menu.
function createSampleOption(name) {
  return {
    text: name,
    onselect: async function () {
	  currentTilesetName = name;
      doZoom = true;
      await recreateTileset();
    },
  };
}

// Create the list of available samples, and add them
// to the sandcastle toolbar
const sampleOptions = [
  createSampleOption("glTF1-x-up"),
  createSampleOption("glTF1-x-up-with-gltfUpAxis-x"),
  createSampleOption("glTF1-y-up"),
  createSampleOption("glTF1-y-up-with-gltfUpAxis-y"),
  createSampleOption("glTF1-z-up"),
  createSampleOption("glTF1-z-up-with-gltfUpAxis-z"),
  createSampleOption("glTF1-z-up-instanced"),
  createSampleOption("glTF1-z-up-instanced-with-gltfUpAxis-z"),
  createSampleOption("glTF2"),
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

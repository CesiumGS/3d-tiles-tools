const viewer = new Cesium.Viewer("cesiumContainer");

// Stores the tileset that is currently selected
let currentTileset;

// Creates the tileset for the sample with the given name.
async function createTileset(exampleName) {
  if (Cesium.defined(currentTileset)) {
    viewer.scene.primitives.remove(currentTileset);
    currentTileset = undefined;
  }
  // Create the tileset, and move it to a certain position on the globe
  currentTileset = await Cesium.Cesium3DTileset.fromUrl(
    `http://localhost:8003/${exampleName}`,
    {
      debugShowBoundingVolume: true,
    }
  );
  viewer.scene.primitives.add(currentTileset);
  currentTileset.modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(
    Cesium.Cartesian3.fromDegrees(-75.152325, 39.94704, 0)
  );
  const offset = new Cesium.HeadingPitchRange(
    Cesium.Math.toRadians(-22.5),
    Cesium.Math.toRadians(-45.0),
    4.0
  );
  viewer.zoomTo(currentTileset, offset);
}

//============================================================================
// Sandcastle UI setup:

// Create one entry for the list of examples that can
// be selected in the dropdown menu. Selecting one of
// these will load the tileset for the sample with the
// given name
function createSampleOption(name) {
  return {
    text: name,
    onselect: async function () {
      await createTileset(name);
    },
  };
}

// Create the list of available samples, and add them
// to the sandcastle toolbar
const sampleOptions = [
  createSampleOption("3tz_basic/tileset.json"),
  createSampleOption("3tz_chained/tileset.json"),
  createSampleOption("3tz_chained_deep/tileset.json"),
  createSampleOption("3tz_chained_subdirs/tileset.json"),
  createSampleOption("3tz_chained_subdirs_direct/tileset.json"),
  createSampleOption("3tz_direct/tileset.json"),
  createSampleOption("3tz_inner_subdirs/tileset.json"),
];
Sandcastle.addToolbarMenu(sampleOptions);

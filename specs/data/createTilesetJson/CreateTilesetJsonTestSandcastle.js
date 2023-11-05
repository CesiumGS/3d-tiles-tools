const viewer = new Cesium.Viewer("cesiumContainer", {
  //globe: false
});

let currentTileset;
let currentTilesetName = "batchedColors.json";
let doZoom = true;

// Remove any old tileset, and add a new tileset based on the
// currentTilesetName and the inputOrOutput value
async function recreateTileset() {
  if (Cesium.defined(currentTileset)) {
    viewer.scene.primitives.remove(currentTileset);
    currentTileset = undefined;
  } else {
    doZoom = true;
  }

  currentTileset = viewer.scene.primitives.add(
    await Cesium.Cesium3DTileset.fromUrl(
      `http://localhost:8003/${currentTilesetName}`, {
      debugShowBoundingVolume: true,
    })
  );

  if (currentTilesetName.startsWith("plane")) {
    const transform = Cesium.Transforms.eastNorthUpToFixedFrame(
      Cesium.Cartesian3.fromDegrees(-75.15232,39.94705, 0)
    );
    const scale = 1.0;
    const modelMatrix = Cesium.Matrix4.multiplyByUniformScale(
      transform,
      scale,
      new Cesium.Matrix4()
    );
    currentTileset.modelMatrix = modelMatrix;
  }
  
  if (doZoom) {
    const offset = new Cesium.HeadingPitchRange(
      Cesium.Math.toRadians(-22.5),
      Cesium.Math.toRadians(-22.5),
      100
    );
    viewer.zoomTo(currentTileset, offset);
    doZoom = false;
  }
}



//============================================================================
// Sandcastle UI setup:

function createOption(name) {
  return {
    text: name,
    onselect: function () {
      currentTilesetName = name;
      doZoom = true;
      recreateTileset();
    },
  };
}

function createOptions() {
  const options = [

    createOption("batchedColors.json"),
    createOption("compositeOfComposite.json"),
    createOption("instancedOrientation.json"),
    createOption("pointCloudQuantized.json"),
    createOption("pointCloudRGB.json"),
    createOption("plane-ds-p-n-32x32.json"),
  ];
  return options;
}

Sandcastle.addToolbarMenu(createOptions());

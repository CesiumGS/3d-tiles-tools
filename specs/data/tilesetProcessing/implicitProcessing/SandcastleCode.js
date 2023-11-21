const viewer = new Cesium.Viewer("cesiumContainer");

// Create the tileset in the viewer
const tileset = viewer.scene.primitives.add(
  new Cesium.Cesium3DTileset({
    url: "http://localhost:8003/tileset.json",
    debugShowBoundingVolume: true,
    maximumScreenSpaceError: 512,
  })
);

// Move the tileset to a certain position on the globe,
// and scale it up
const transform = Cesium.Transforms.eastNorthUpToFixedFrame(
  Cesium.Cartesian3.fromDegrees(-75.152408, 39.946975, 1)
);
const scale = 15.0;
tileset.modelMatrix = Cesium.Matrix4.multiplyByUniformScale(
  transform,
  scale,
  new Cesium.Matrix4()
);

// Zoom to the tileset, with a small offset so that
// it is fully visible
const offset = new Cesium.HeadingPitchRange(
  0,
  Cesium.Math.toRadians(-90),
  40.0
);
viewer.zoomTo(tileset, offset);
/* eslint-disable no-undef */
const viewer = new Cesium.Viewer("cesiumContainer", {
  globe: false,
  skyBox: false,
});

const tileset = viewer.scene.primitives.add(
  await Cesium.Cesium3DTileset.fromUrl(`http://localhost:8003/tileset.json`, {
    debugShowBoundingVolume: true,
    maximumScreenSpaceError: 16,
  })
);

// Move the tileset to a certain position on the globe
const transform = Cesium.Transforms.eastNorthUpToFixedFrame(
  Cesium.Cartesian3.fromDegrees(-75.152408, 39.946975, 1)
);
const scale = 1.0;
const modelMatrix = Cesium.Matrix4.multiplyByUniformScale(
  transform,
  scale,
  new Cesium.Matrix4()
);
tileset.modelMatrix = modelMatrix;

// Zoom to the tileset (with a certain offset, to make it fully visible)
const offset = new Cesium.HeadingPitchRange(
  Cesium.Math.toRadians(0.0),
  Cesium.Math.toRadians(-60.0),
  1500.0
);
viewer.zoomTo(tileset, offset);

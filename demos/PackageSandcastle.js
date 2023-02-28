/* eslint-disable no-undef */
const viewer = new Cesium.Viewer("cesiumContainer", {
  globe: false,
  skybox: false,
});

const tileset = viewer.scene.primitives.add(
  new Cesium.Cesium3DTileset({
    url: `http://localhost:8003/tileset.json`,
    debugShowBoundingVolume: true,
    maximumScreenSpaceError: 0.3,
  })
);

class Timer {
  constructor(label) {
    this.label = label;
    this.startTime = undefined;
    this.endTime = undefined;
  }

  start() {
    this.startTime = performance.now();
  }

  stop() {
    this.endTime = performance.now();
  }

  print() {
    const difference_sec = (this.endTime - this.startTime) / 1000.0;
    console.log(`${this.label}: ${difference_sec} sec`);
  }
}

const tileTimer = new Timer("tiles");

tileset.readyPromise.then(() => {
  console.log("Tileset is ready");
  tileTimer.start();
});

const offset = new Cesium.HeadingPitchRange(
  Cesium.Math.toRadians(0.0),
  Cesium.Math.toRadians(-60.0),
  15000.0
);
viewer.zoomTo(tileset, offset);

tileset.initialTilesLoaded.addEventListener(() => {
  console.log("Initial tiles are loaded");
  tileTimer.stop();
  tileTimer.print();
});

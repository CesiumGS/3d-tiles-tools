
# Sparse implicit quadtree

An example tileset that uses the [Implicit Tiling](https://github.com/CesiumGS/3d-tiles/tree/main/specification/ImplicitTiling) to represent a small, sparse quadtree. 

The quadtree has 6 available levels, and each subtree has 3 levels. There are 32 tiles available in level 5. Each of these tiles has a content, which is a simple glTF asset as a GLB (glTF binary) file that just consists of a portion of the unit square that corresponds to the extent of the respective tile. No other tiles - except for the ones that have content, and their respective ancestors - are available. 

## Screenshot

![Screenshot](screenshot/SparseImplicitQuadtree.png)

## Sandcastle Code

```JavaScript
const viewer = new Cesium.Viewer("cesiumContainer");

// Create the tileset in the viewer
const tileset = viewer.scene.primitives.add(
  await Cesium.Cesium3DTileset.fromUrl(
    "http://localhost:8003/1.1/SparseImplicitQuadtree/tileset.json",
    {
      debugShowBoundingVolume: true,
    }
  )
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
  Cesium.Math.toRadians(-67.5),
  40.0
);
viewer.zoomTo(tileset, offset);
```

## Structure

The following image shows the 6 levels of the tileset. Tiles that are available contain a `1` and are shown in green. Tiles that are not available contain a `0` and are shown in red. Cells that contain content are marked with `1+` (only in level 5). 

![Availability](screenshot/SparseImplicitQuadtree-Availability.png)

The JSON parts of the `.subtree` files and the availability information that is stored in the binary buffers is summarized in [subtreeInfo.md](screenshot/subtreeInfo.md).

## License

[CC0](https://creativecommons.org/share-your-work/public-domain/cc0/)


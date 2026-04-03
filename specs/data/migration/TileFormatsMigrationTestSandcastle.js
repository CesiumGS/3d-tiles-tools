const viewer = new Cesium.Viewer("cesiumContainer", {
  globe: false
});

let currentTileset;
let currentTilesetName = "InstancedAxes/InstancedAxesSimple";
let inputOrOutput = "input";
let doZoom = false;

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
      `http://localhost:8003/${inputOrOutput}/${currentTilesetName}/tileset.json`, {
      debugShowBoundingVolume: true,
    })
  );
  currentTileset.style = new Cesium.Cesium3DTileStyle({
    pointSize: "10"
  });

  // Special handling for tilesets that are "at the origin":
  // Move them to a certain position on the globe
  let distance = 500;
  if (currentTilesetName.startsWith("InstancedAxes")) {
    const transform = Cesium.Transforms.eastNorthUpToFixedFrame(
      Cesium.Cartesian3.fromDegrees(-75.152408, 39.946975, 0)
    );
    const scale = 1.0;
    const modelMatrix = Cesium.Matrix4.multiplyByUniformScale(
      transform,
      scale,
      new Cesium.Matrix4()
    );
    currentTileset.modelMatrix = modelMatrix;
    distance = 10;
  }

  if (doZoom) {
    const offset = new Cesium.HeadingPitchRange(
      Cesium.Math.toRadians(-22.5),
      Cesium.Math.toRadians(-22.5),
      distance
    );
    viewer.zoomTo(currentTileset, offset);
    doZoom = false;
  }
}


//============================================================================
// Batch table and metadata handling

// Create an HTML element that will serve as the
// tooltip that displays the metadata information
function createTooltip() {
    const tooltip = document.createElement("div");
    viewer.container.appendChild(tooltip);
    tooltip.style.backgroundColor = "black";
    tooltip.style.position = "absolute";
    tooltip.style.left = "0";
    tooltip.style.top = "0";
    tooltip.style.padding = "14px";
    tooltip.style["pointer-events"] = "none";
    tooltip.style["block-size"] = "fit-content";
    return tooltip;
  }
  const tooltip = createTooltip();

  // Show the given HTML content in the tooltip
  // at the given screen position
  function showTooltip(screenX, screenY, htmlContent) {
    tooltip.style.display = "block";
    tooltip.style.left = `${screenX}px`;
    tooltip.style.top = `${screenY}px`;
    tooltip.innerHTML = htmlContent;
  }

  // Create an HTML string that contains information
  // about the given metadata, under the given title
  function createMetadataHtml(title, metadata) {
    if (!Cesium.defined(metadata)) {
      return `(No ${title})<br>`;
    }
    const propertyKeys = metadata.getPropertyIds();
    if (!Cesium.defined(propertyKeys)) {
      return `(No properties for ${title})<br>`;
    }
    let html = `<b>${title}:</b><br>`;
    for (let i = 0; i < propertyKeys.length; i++) {
      const propertyKey = propertyKeys[i];
      const propertyValue = metadata.getProperty(propertyKey);
      html += `&nbsp;&nbsp;${propertyKey} : ${propertyValue}<br>`;
    }
    return html;
  }

  // Install the handler that will check the element that is
  // under the mouse cursor when the mouse is moved, and
  // add any metadata that it contains to the label.
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction(function (movement) {
    let tooltipText = "";
    const picked = viewer.scene.pick(movement.endPosition);

    if (picked) {
        if (picked instanceof Cesium.Cesium3DTileFeature) {
            tooltipText += createMetadataHtml("Batch table", picked);
        }
    }

    const tilesetMetadata = picked?.content?.tileset?.metadata;
    tooltipText += createMetadataHtml("Tileset metadata", tilesetMetadata);

    const tileMetadata = picked?.content?.tile?.metadata;
    tooltipText += createMetadataHtml("Tile metadata", tileMetadata);

    const groupMetadata = picked?.content?.group?.metadata;
    tooltipText += createMetadataHtml("Group metadata", groupMetadata);

    const contentMetadata = picked?.content?.metadata;
    tooltipText += createMetadataHtml("Content metadata", contentMetadata);

    const screenX = movement.endPosition.x;
    const screenY = movement.endPosition.y;
    showTooltip(screenX, screenY, tooltipText);
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);



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

    createOption("InstancedAxes/InstancedAxesSimple"),
    createOption("InstancedAxes/InstancedAxesRotated"),
    createOption("InstancedAxes/InstancedAxesScaled"),

    createOption("Instanced/InstancedAnimated"),
    createOption("Instanced/InstancedGltfExternal"),
    createOption("Instanced/InstancedOct32POrientation"),
    createOption("Instanced/InstancedOrientation"),
    createOption("Instanced/InstancedQuantized"),
    createOption("Instanced/InstancedQuantizedOct32POrientation"),
    createOption("Instanced/InstancedRedMaterial"),
    createOption("Instanced/InstancedRTC"),
    createOption("Instanced/InstancedScale"),
    createOption("Instanced/InstancedScaleNonUniform"),
    createOption("Instanced/InstancedTextured"),
    createOption("Instanced/InstancedWithBatchIds"),
    createOption("Instanced/InstancedWithBatchTable"),
    createOption("Instanced/InstancedWithBatchTableBinary"),
    createOption("Instanced/InstancedWithCopyright"),
    createOption("Instanced/InstancedWithoutBatchTable"),
    createOption("Instanced/InstancedWithoutNormals"),
    createOption("Instanced/InstancedWithTransform"),


    createOption("PointCloud/PointCloudBatched"),
    createOption("PointCloud/PointCloudConstantColor"),
    createOption("PointCloud/PointCloudDraco"),
    createOption("PointCloud/PointCloudDracoBatched"),
    createOption("PointCloud/PointCloudDracoPartial"),
    createOption("PointCloud/PointCloudNoColor"),
    createOption("PointCloud/PointCloudNormals"),
    createOption("PointCloud/PointCloudNormalsOctEncoded"),
    createOption("PointCloud/PointCloudQuantized"),
    createOption("PointCloud/PointCloudQuantizedOctEncoded"),
    createOption("PointCloud/PointCloudRGB"),
    createOption("PointCloud/PointCloudRGB565"),
    createOption("PointCloud/PointCloudRGBA"),
    createOption("PointCloud/PointCloudWGS84"),
    createOption("PointCloud/PointCloudWithPerPointProperties"),
    createOption("PointCloud/PointCloudWithTransform"),
    createOption("PointCloud/PointCloudWithUnicodePropertyIds"),

    createOption("Batched/BatchedAnimated"),
    createOption("Batched/BatchedColors"),
    createOption("Batched/BatchedColorsMix"),
    createOption("Batched/BatchedColorsTranslucent"),
    createOption("Batched/BatchedDeprecated1"),
    createOption("Batched/BatchedDeprecated2"),
    createOption("Batched/BatchedExpiration"),
    createOption("Batched/BatchedNoBatchIds"),
    createOption("Batched/BatchedTextured"),
    createOption("Batched/BatchedTranslucent"),
    createOption("Batched/BatchedTranslucentOpaqueMix"),
    createOption("Batched/BatchedWGS84"),
    createOption("Batched/BatchedWithBatchTable"),
    createOption("Batched/BatchedWithBatchTableBinary"),
    createOption("Batched/BatchedWithBoundingSphere"),
    createOption("Batched/BatchedWithCopyright"),
    createOption("Batched/BatchedWithoutBatchTable"),
    createOption("Batched/BatchedWithRtcCenter"),
    createOption("Batched/BatchedWithTransformBox"),
    createOption("Batched/BatchedWithTransformRegion"),
    createOption("Batched/BatchedWithTransformSphere"),
    createOption("Batched/BatchedWithVertexColors"),

    createOption("Composite/Composite"),
    createOption("Composite/CompositeOfComposite"),
    createOption("Composite/CompositeOfInstanced")

  ];
  return options;
}

Sandcastle.addToolbarMenu(createOptions());
Sandcastle.addDefaultToolbarButton("Input", function () {
  inputOrOutput = "input";
  recreateTileset();
});
Sandcastle.addDefaultToolbarButton("Output", function () {
  inputOrOutput = "output";
  recreateTileset();
});

import { Accessor } from "@gltf-transform/core";
import { Document } from "@gltf-transform/core";
import { NodeIO } from "@gltf-transform/core";

import { savePixels } from "ndarray-pixels";
import NdArray from "ndarray";

import { EXTMeshFeatures } from "3d-tiles-tools";

import { MeshFeaturesUtils } from "3d-tiles-tools";

async function createExampleDocument(): Promise<Document> {
  const document = new Document();

  // Create an Extension attached to the Document.
  const extMeshFeatures = document.createExtension(EXTMeshFeatures);

  // Define an array of IDs
  const ids = [12, 23, 34, 45, 56, 78, 78, 89, 90];

  // Put the IDs into an `Accessor`
  const buffer = document.createBuffer();
  const accessor = document.createAccessor();
  accessor.setBuffer(buffer);
  accessor.setType(Accessor.Type.SCALAR);
  accessor.setArray(new Int16Array(ids));

  // Create a mesh `Primitive`
  const primitive = document.createPrimitive();

  // Set the IDs as one attribute of the `Primitive`
  const attributeNumber = 2;
  primitive.setAttribute(`_FEATURE_ID_${attributeNumber}`, accessor);

  // Create a `FeatureId` object. This object indicates that the IDs
  // are stored in the attribute `_FEATURE_ID_${attributeNumber}`
  const featureIdFromAttribute = extMeshFeatures.createFeatureId();
  featureIdFromAttribute.setFeatureCount(new Set(ids).size);
  featureIdFromAttribute.setAttribute(attributeNumber);

  // Create an image with integer values that serve as feature IDs
  const sizeX = 3;
  const sizeY = 3;
  const pixels = NdArray(new Uint8Array(sizeX * sizeY * 3), [sizeX, sizeY, 3]);
  for (let x = 0; x < pixels.shape[0]; x++) {
    for (let y = 0; y < pixels.shape[1]; y++) {
      pixels.set(x, y, 0, x * sizeY + y);
    }
  }
  const image = await savePixels(pixels, "image/png");

  // Create a texture and assign the feature ID image to it
  const texture = document.createTexture();
  texture.setImage(image);
  texture.setURI("featureIds.png");

  // Create a `FeatureId´ object that represents
  // the feature ID texture
  const featureIdFromTexture = extMeshFeatures.createFeatureId();
  featureIdFromTexture.setFeatureCount(sizeX * sizeY);

  // Create the actual feature ID texture
  const featureIdTexture = extMeshFeatures.createFeatureIdTexture();
  featureIdTexture.setChannels([0]);
  featureIdTexture.setTexture(texture);
  featureIdFromTexture.setTexture(featureIdTexture);

  // Create a `MeshFeatures` object that contains the
  // created `FeatureID` objects, and store it as an
  // extension object in the `Primitive`
  const meshFeatures = extMeshFeatures.createMeshFeatures();
  meshFeatures.addFeatureId(featureIdFromAttribute);
  meshFeatures.addFeatureId(featureIdFromTexture);
  primitive.setExtension("EXT_mesh_features", meshFeatures);

  // Assign the `Primitive` to a `Mesh`
  const mesh = document.createMesh();
  mesh.addPrimitive(primitive);

  return document;
}

async function runCreationExample() {
  const document = await createExampleDocument();

  // Create an IO object and register the extension
  const io = new NodeIO();
  io.registerExtensions([EXTMeshFeatures]);

  // Write the document and print its JSON to the console
  const written = await io.writeJSON(document);
  console.log(JSON.stringify(written.json, null, 2));
}

async function runReadingExample() {
  // Create the example document, write it into
  // a GLB buffer, and read a new document from it
  const inputDocument = await createExampleDocument();
  const io = new NodeIO();
  io.registerExtensions([EXTMeshFeatures]);
  const glb = await io.writeBinary(inputDocument);
  const document = await io.readBinary(glb);

  // Print information about the feature IDs in the document:
  const s = MeshFeaturesUtils.createMeshFeaturesInfoString(document);
  console.log("Feature IDs:");
  console.log(s);
}

runCreationExample();
runReadingExample();

import fs from "fs";

import { Accessor } from "@gltf-transform/core";
import { Document } from "@gltf-transform/core";
import { Primitive } from "@gltf-transform/core";
import { NodeIO } from "@gltf-transform/core";

import { savePixels } from "ndarray-pixels";
import NdArray from "ndarray";

import { EXTMeshFeatures } from "3d-tiles-tools";
import { MeshFeaturesFeatureId as FeatureId } from "3d-tiles-tools";

import { MeshFeaturesUtils } from "3d-tiles-tools";

/**
 * Create a primitive that represents a unit square
 *
 * @param document - The glTF-Transform document
 * @returns The primitive
 */
function createUnitSquarePrimitive(document: Document): Primitive {
  const root = document.getRoot();
  const buffer = root.listBuffers()[0];

  const primitive = document.createPrimitive();

  const indicesAccessor = document.createAccessor("");
  indicesAccessor.setType("SCALAR");
  indicesAccessor.setBuffer(buffer);
  indicesAccessor.setArray(new Uint16Array([0, 1, 2, 1, 3, 2]));
  primitive.setIndices(indicesAccessor);

  const positionsAccessor = document.createAccessor("");
  positionsAccessor.setType("VEC3");
  positionsAccessor.setBuffer(buffer);
  positionsAccessor.setArray(
    new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0])
  );
  primitive.setAttribute("POSITION", positionsAccessor);

  const normalsAccessor = document.createAccessor("");
  normalsAccessor.setType("VEC3");
  normalsAccessor.setBuffer(buffer);
  normalsAccessor.setArray(
    new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1])
  );
  primitive.setAttribute("NORMAL", normalsAccessor);

  const texCoordsAccessor = document.createAccessor("");
  texCoordsAccessor.setType("VEC2");
  texCoordsAccessor.setBuffer(buffer);
  texCoordsAccessor.setArray(new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]));
  primitive.setAttribute("TEXCOORD_0", texCoordsAccessor);

  return primitive;
}

/**
 * Create a FeatureID from a texture.
 *
 * This will create a "dummy" texture with ID values
 *
 * @param document - The glTF-Transform document
 * @param extMeshFeatures - The EXTMeshFeatures extension object
 * @returns The FeatureID
 */
async function createFeatureIdFromTexture(
  document: Document,
  extMeshFeatures: EXTMeshFeatures
): Promise<FeatureId> {
  // Create an image with integer values that serve as feature IDs.
  // The IDs are in the range (0...255) here, and therefore written
  // into the channel with index `3`, i.e. the alpha channel of the
  // RGBA pixels.
  const sizeX = 3;
  const sizeY = 3;
  const pixels = NdArray(new Uint8Array(sizeX * sizeY), [sizeX, sizeY, 4]);
  for (let x = 0; x < pixels.shape[0]; x++) {
    for (let y = 0; y < pixels.shape[1]; y++) {
      pixels.set(x, y, 3, x * sizeY + y);
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

  return featureIdFromTexture;
}

/**
 * Creates a FeatureID from an attribute.
 *
 * This will assign the given `id` to all vertices of the given primitive,
 * as a feature ID attribute.
 *
 * @param document - The glTF-Transform document
 * @param extMeshFeatures - The EXTMeshFeatures extension object
 * @param primitive - The primitive that the attribute will be assigned to
 * @param numVertices - The number of vertices in the primitive
 * @param id - The ID to assign to all vertices
 * @returns The FeatureID
 */
function createFeatureIdFromAttribute(
  document: Document,
  extMeshFeatures: EXTMeshFeatures,
  primitive: Primitive,
  numVertices: number,
  id: number
): FeatureId {
  const root = document.getRoot();
  const buffer = root.listBuffers()[0];

  // Define an array of IDs
  const ids = Array(numVertices).fill(id);

  // Put the IDs into an `Accessor`
  const accessor = document.createAccessor();
  accessor.setBuffer(buffer);
  accessor.setType(Accessor.Type.SCALAR);
  accessor.setArray(new Int16Array(ids));

  // Set the IDs as one attribute of the `Primitive`
  const attributeNumber = 0;
  primitive.setAttribute(`_FEATURE_ID_${attributeNumber}`, accessor);

  // Create a `FeatureId` object. This object indicates that the IDs
  // are stored in the attribute `_FEATURE_ID_${attributeNumber}`
  const featureIdFromAttribute = extMeshFeatures.createFeatureId();
  featureIdFromAttribute.setFeatureCount(new Set(ids).size);
  featureIdFromAttribute.setAttribute(attributeNumber);

  return featureIdFromAttribute;
}

/**
 * Assigns an `EXT_mesh_features` extension object with some example
 * feature IDs to the given primitive.
 *
 * @param document - The glTF-Transform document
 * @param extMeshFeatures - The EXTMeshFeatures extension object
 * @param primitive - The primitive that the attribute will be assigned to
 * @param numVertices - The number of vertices in the primitive
 * @param id - The ID to assign to all vertices
 */
async function assignExampleMeshFeatures(
  document: Document,
  extMeshFeatures: EXTMeshFeatures,
  primitive: Primitive,
  numVertices: number,
  id: number
) {
  // Create the example feature IDs
  const featureIdFromAttribute = createFeatureIdFromAttribute(
    document,
    extMeshFeatures,
    primitive,
    numVertices,
    id
  );
  const featureIdFromTexture = await createFeatureIdFromTexture(
    document,
    extMeshFeatures
  );

  // Create a `MeshFeatures` object that contains the
  // created `FeatureID` objects, and store it as an
  // extension object in the `Primitive`
  const meshFeatures = extMeshFeatures.createMeshFeatures();
  meshFeatures.addFeatureId(featureIdFromAttribute);
  meshFeatures.addFeatureId(featureIdFromTexture);
  primitive.setExtension("EXT_mesh_features", meshFeatures);
}

async function createExampleDocument(): Promise<Document> {
  // Create the document, containing a single buffer and the
  // main extension object
  const document = new Document();
  document.createBuffer();
  const extMeshFeatures = document.createExtension(EXTMeshFeatures);

  const numVertices = 4;

  // Create primitives, and assign example mesh features
  const primitiveA = createUnitSquarePrimitive(document);
  await assignExampleMeshFeatures(
    document,
    extMeshFeatures,
    primitiveA,
    numVertices,
    11
  );

  const primitiveB = createUnitSquarePrimitive(document);
  await assignExampleMeshFeatures(
    document,
    extMeshFeatures,
    primitiveB,
    numVertices,
    22
  );

  // Assign the primitives to meshes, the meshes to nodes,
  // and the nodes to the scene
  const scene = document.createScene();

  // Primitive A
  const meshA = document.createMesh();
  meshA.addPrimitive(primitiveA);

  const nodeA = document.createNode();
  nodeA.setTranslation([-0.75, 0, 0]);
  nodeA.setMesh(meshA);

  scene.addChild(nodeA);

  // Primitive B
  const meshB = document.createMesh();
  meshB.addPrimitive(primitiveB);

  const nodeB = document.createNode();
  nodeB.setTranslation([0.75, 0, 0]);
  nodeB.setMesh(meshB);

  scene.addChild(nodeB);

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

  // Write the full document as a binary glTF
  const glbBuffer = await io.writeBinary(document);
  fs.writeFileSync("./meshFeatures.glb", glbBuffer);
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

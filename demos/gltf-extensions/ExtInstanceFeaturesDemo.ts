import { Accessor } from "@gltf-transform/core";
import { Document } from "@gltf-transform/core";
import { NodeIO } from "@gltf-transform/core";

import { EXTMeshGPUInstancing } from "@gltf-transform/extensions";

import { EXTInstanceFeatures } from "3d-tiles-tools";
import { InstanceFeaturesUtils } from "3d-tiles-tools";

function createMesh(document: Document) {
  const root = document.getRoot();
  const buffer = root.listBuffers()[0];

  // prettier-ignore
  const positions = [
    0.0, 0.0, 0.0, 
    1.0, 0.0, 0.0, 
    0.0, 1.0, 0.0, 
    1.0, 1.0, 0.0, 
  ];

  const positionsAccessor = document.createAccessor();
  positionsAccessor.setArray(new Float32Array(positions));
  positionsAccessor.setType(Accessor.Type.VEC3);
  positionsAccessor.setBuffer(buffer);

  const indices = [0, 1, 2, 1, 3, 2];
  const indicesAccessor = document.createAccessor();
  indicesAccessor.setArray(new Uint16Array(indices));
  indicesAccessor.setType(Accessor.Type.SCALAR);
  indicesAccessor.setBuffer(buffer);

  const primitive = document.createPrimitive();
  primitive.setIndices(indicesAccessor);
  primitive.setAttribute("POSITION", positionsAccessor);

  const mesh = document.createMesh();
  mesh.addPrimitive(primitive);

  return mesh;
}

async function createExampleDocument(): Promise<Document> {
  // Prepare the document with a single buffer and a single
  // node with a single mesh in a single scene
  const document = new Document();
  const buffer = document.createBuffer();
  const node = document.createNode();
  const scene = document.createScene();
  scene.addChild(node);
  const mesh = createMesh(document);
  node.setMesh(mesh);

  // Create the EXT_mesh_gpu_instancing and the
  // EXT_instance_features extension, and assign
  // them to the document
  const extMeshGPUInstancing = document.createExtension(EXTMeshGPUInstancing);
  extMeshGPUInstancing.setRequired(true);
  const extInstanceFeatures = document.createExtension(EXTInstanceFeatures);

  // Create an accessor containing one ID for each instance
  const ids = [12, 23, 34, 45];
  const accessor = document.createAccessor();
  accessor.setBuffer(buffer);
  accessor.setType(Accessor.Type.SCALAR);
  accessor.setArray(new Uint16Array(ids));

  // Create an accessor containing the translations of the instances
  // prettier-ignore
  const translations = [
    0.0, 0.0, 0.0, 
    2.0, 0.0, 0.0, 
    0.0, 2.0, 0.0, 
    2.0, 2.0, 0.0, 
  ];
  const translationsAccessor = document.createAccessor();
  translationsAccessor.setArray(new Float32Array(translations));
  translationsAccessor.setType(Accessor.Type.VEC3);
  translationsAccessor.setBuffer(buffer);

  // Create the EXT_mesh_gpu_instancing extension, set
  // the translations and IDs of the instances, and
  // assign the extension object to the node

  const meshGpuInstancing = extMeshGPUInstancing.createInstancedMesh();
  meshGpuInstancing.setAttribute("TRANSLATION", translationsAccessor);

  const attributeNumber = 0;
  meshGpuInstancing.setAttribute(`_FEATURE_ID_${attributeNumber}`, accessor);

  node.setExtension("EXT_mesh_gpu_instancing", meshGpuInstancing);

  // Create a `FeatureId` object. This object indicates that the IDs
  // are stored in the attribute `_FEATURE_ID_${attributeNumber}`
  const featureIdFromAttribute = extInstanceFeatures.createFeatureId();
  featureIdFromAttribute.setFeatureCount(new Set(ids).size);
  featureIdFromAttribute.setAttribute(attributeNumber);

  // Create a `InstanceFeatures` object that contains the
  // created `FeatureID` objects, and store it as an
  // extension object in the `Node`
  const instanceFeatures = extInstanceFeatures.createInstanceFeatures();
  instanceFeatures.addFeatureId(featureIdFromAttribute);
  node.setExtension("EXT_instance_features", instanceFeatures);

  return document;
}

async function runCreationExample() {
  const document = await createExampleDocument();

  // Create an IO object and register the extensions
  const io = new NodeIO();
  io.registerExtensions([EXTMeshGPUInstancing]);
  io.registerExtensions([EXTInstanceFeatures]);

  // Write the document and print its JSON to the console
  const written = await io.writeJSON(document);
  console.log(JSON.stringify(written.json, null, 2));
}

async function runReadingExample() {
  // Create the example document, write it into
  // a GLB buffer, and read a new document from it
  const inputDocument = await createExampleDocument();
  const io = new NodeIO();
  io.registerExtensions([EXTMeshGPUInstancing]);
  io.registerExtensions([EXTInstanceFeatures]);
  const glb = await io.writeBinary(inputDocument);
  const document = await io.readBinary(glb);

  // Print information about the feature IDs in the document:
  const s = InstanceFeaturesUtils.createInstanceFeaturesInfoString(document);
  console.log("Feature IDs:");
  console.log(s);
}

runCreationExample();
runReadingExample();

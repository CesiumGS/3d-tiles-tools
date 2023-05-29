import { Document } from "@gltf-transform/core";
import { NodeIO } from "@gltf-transform/core";
import { Accessor } from "@gltf-transform/core";
import { Primitive } from "@gltf-transform/core";
import { Buffer as GltfBuffer } from "@gltf-transform/core";

import { EXTMeshFeatures } from "../gltftransform/EXTMeshFeatures";

import { Iterables } from "../../base/Iterables";

import { ReadablePointCloud } from "./ReadablePointCloud";

import { TileFormatError } from "../../tileFormats/TileFormatError";

export class GltfPointClouds {
  static async build(
    readablePointCloud: ReadablePointCloud,
    globalPosition: [number, number, number] | undefined
  ) {
    const document = new Document();

    const buffer = document.createBuffer();
    buffer.setURI("buffer.bin");

    const primitive = document.createPrimitive();
    primitive.setMode(Primitive.Mode.POINTS);

    const positions = readablePointCloud.getAttributeValues("POSITION");
    if (!positions) {
      throw new TileFormatError("No POSITION attribute found");
    }
    const positionAccessor = document.createAccessor();
    positionAccessor.setBuffer(buffer);
    positionAccessor.setType(Accessor.Type.VEC3);
    positionAccessor.setArray(new Float32Array([...positions]));
    primitive.setAttribute("POSITION", positionAccessor);

    const normals = readablePointCloud.getAttributeValues("NORMAL");
    if (normals) {
      const normalAccessor = document.createAccessor();
      normalAccessor.setBuffer(buffer);
      normalAccessor.setType(Accessor.Type.VEC3);
      normalAccessor.setArray(new Float32Array([...normals]));
      primitive.setAttribute("NORMAL", normalAccessor);
    }

    const colors = readablePointCloud.getAttributeValues("COLOR_0");
    if (colors) {
      const colorAccessor = document.createAccessor();
      colorAccessor.setBuffer(buffer);
      colorAccessor.setType(Accessor.Type.VEC4);

      colorAccessor.setNormalized(true);
      const colorsBytes = Iterables.map(colors, (c: number) => 255.0 * c);

      colorAccessor.setArray(new Uint8Array([...colorsBytes]));
      primitive.setAttribute("COLOR_0", colorAccessor);
    }

    const globalColor = readablePointCloud.getNormalizedLinearGlobalColor();
    if (globalColor) {
      const material = document.createMaterial();
      material.setBaseColorFactor(globalColor);
      material.setMetallicFactor(0.0);
      material.setRoughnessFactor(1.0);
      primitive.setMaterial(material);
    }

    GltfPointClouds.assignFeatureIdAttributes(
      readablePointCloud,
      document,
      buffer,
      primitive
    );

    const mesh = document.createMesh();
    mesh.addPrimitive(primitive);

    const node = document.createNode();
    node.setMesh(mesh);

    if (globalPosition) {
      node.setTranslation(globalPosition);
    }

    const scene = document.createScene();
    scene.addChild(node);

    const io = new NodeIO();
    io.registerExtensions([EXTMeshFeatures]);
    const glb = await io.writeBinary(document);
    return Buffer.from(glb);
  }

  private static assignFeatureIdAttributes(
    readablePointCloud: ReadablePointCloud,
    document: Document,
    buffer: GltfBuffer,
    primitive: Primitive
  ) {
    let extMeshFeatures;
    let meshFeatures;

    const attributes = readablePointCloud.getAttributes();
    for (const attributeName of attributes) {
      const featureIdRegex = /_FEATURE_ID_([0-9]+)/;
      const match = attributeName.match(featureIdRegex);
      if (!match) {
        continue;
      }
      if (!extMeshFeatures) {
        extMeshFeatures = document.createExtension(EXTMeshFeatures);
      }

      const attributeNumber = Number(match[1]);
      const featureIdValues =
        readablePointCloud.getAttributeValues(attributeName);
      const componentType =
        readablePointCloud.getAttributeComponentType(attributeName);

      if (featureIdValues && componentType) {
        const featureIdAccessor = document.createAccessor();
        featureIdAccessor.setBuffer(buffer);
        featureIdAccessor.setType(Accessor.Type.SCALAR);
        featureIdAccessor.setArray(
          GltfPointClouds.createFeatureIdVertexAttribute(
            featureIdValues,
            componentType
          )
        );
        primitive.setAttribute(attributeName, featureIdAccessor);

        const featureCount = new Set([...featureIdValues]).size;

        const featureId = extMeshFeatures.createFeatureId();
        featureId.setAttribute(attributeNumber);
        featureId.setFeatureCount(featureCount);

        if (!meshFeatures) {
          meshFeatures = extMeshFeatures.createMeshFeatures();
        }
        meshFeatures.addFeatureId(featureId);
      }
    }

    if (meshFeatures) {
      primitive.setExtension("EXT_mesh_features", meshFeatures);
    }
  }

  private static createFeatureIdVertexAttribute(
    numbers: Iterable<number>,
    componentType: string
  ) {
    const numbersArray = [...numbers];
    switch (componentType) {
      case "UINT8":
        return new Uint8Array(numbersArray);
      case "INT8":
        return new Int8Array(numbersArray);

      case "UINT16":
        return new Uint16Array(numbersArray);
      case "INT16":
        return new Int16Array(numbersArray);

      case "UINT32":
      case "INT32":
      case "UINT64":
      case "INT64":
      case "FLOAT64":
        console.warn(
          `Feature ID attribute has type ${componentType}, converting to 32 bit float`
        );
        return new Float32Array(numbersArray);
      case "FLOAT32":
        return new Float32Array(numbersArray);
    }
    throw new TileFormatError(`Unknown component type: ${componentType}`);
  }
}

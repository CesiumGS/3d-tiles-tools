import { Document } from "@gltf-transform/core";
import { Accessor } from "@gltf-transform/core";
import { Primitive } from "@gltf-transform/core";
import { Buffer as GltfBuffer } from "@gltf-transform/core";

import { EXTMeshFeatures } from "../../gltfMetadata/EXTMeshFeatures";

import { Iterables } from "../../base/Iterables";

import { ReadablePointCloud } from "./ReadablePointCloud";

import { TileFormatError } from "../../tileFormats/TileFormatError";

import { AccessorCreation } from "../../migration/AccessorCreation";

/**
 * An internal interface representing a point cloud with
 * glTF-Transform structures.
 */
export interface GtlfTransformPointCloud {
  /**
   * The actual document that represents the point cloud
   */
  document: Document;

  /**
   * The one and only primitive that contains the point data
   */
  primitive: Primitive;
}

/**
 * Methods to create glTF representations of point clouds
 */
export class GltfTransformPointClouds {
  /**
   * Creates a point cloud representation, based on glTF-Transform,
   * from the given `ReadablePointCloud` input.
   *
   * Many details about the result are intentionally not
   * specified. It is supposed to be "just a point cloud".
   *
   * @param readablePointCloud - The `ReadablePointCloud`
   * @param globalPosition - The optional global position, to
   * be set as the `translation` component of the root node.
   * @returns The GtlfTransformPointCloud
   * @throws TileFormatError If the input data does not
   * at least contain a `POSITION` attribute.
   */
  static build(
    readablePointCloud: ReadablePointCloud,
    globalPosition: [number, number, number] | undefined
  ): GtlfTransformPointCloud {
    // Prepare the glTF-Transform document and primitive
    const document = new Document();
    document.getRoot().getAsset().generator = "glTF-Transform";

    const buffer = document.createBuffer();
    buffer.setURI("buffer.bin");

    const primitive = document.createPrimitive();
    primitive.setMode(Primitive.Mode.POINTS);

    // Assign the POSITION attribute
    const positions = readablePointCloud.getAttributeValues("POSITION");
    if (!positions) {
      throw new TileFormatError("No POSITION attribute found");
    }
    const positionAccessor = document.createAccessor();
    positionAccessor.setBuffer(buffer);
    positionAccessor.setType(Accessor.Type.VEC3);
    positionAccessor.setArray(new Float32Array([...positions]));
    primitive.setAttribute("POSITION", positionAccessor);

    // Assign the NORMAL, if present
    const normals = readablePointCloud.getAttributeValues("NORMAL");
    if (normals) {
      const normalAccessor = document.createAccessor();
      normalAccessor.setBuffer(buffer);
      normalAccessor.setType(Accessor.Type.VEC3);
      normalAccessor.setArray(new Float32Array([...normals]));
      primitive.setAttribute("NORMAL", normalAccessor);
    }

    // Assign the COLOR_0, if present
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

    // Assign the global color, if present
    const globalColor = readablePointCloud.getNormalizedLinearGlobalColor();
    if (globalColor) {
      const material = document.createMaterial();
      material.setBaseColorFactor(globalColor);
      material.setMetallicFactor(0.0);
      material.setRoughnessFactor(1.0);
      primitive.setMaterial(material);
    }

    // If there are `_FEATURE_ID_n` attributes, assign them to
    // the primitive as `EXT_mesh_features`
    GltfTransformPointClouds.assignFeatureIdAttributes(
      readablePointCloud,
      document,
      buffer,
      primitive
    );

    // Assemble the actual glTF scene
    const mesh = document.createMesh();
    mesh.addPrimitive(primitive);

    const node = document.createNode();
    node.setMesh(mesh);

    if (globalPosition) {
      node.setTranslation(globalPosition);
    }

    const scene = document.createScene();
    scene.addChild(node);

    const result: GtlfTransformPointCloud = {
      document: document,
      primitive: primitive,
    };
    return result;
  }

  /**
   * If the given point cloud contains attributes that match
   * the pattern `"_FEATURE_ID_<x>"` with `<x>` being a
   * number, then these attributes will be stored in the
   * mesh primitive using the `EXT_mesh_features` extension.
   *
   * @param readablePointCloud - The `ReadablePointCloud`
   * @param document - The glTF-Transform document
   * @param buffer - The glTF-Transform buffer
   * @param primitive - The glTF-Transform primitive
   * @param propertyTable - An optional property table
   * to assign to the feature IDs
   */
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
          AccessorCreation.createAccessorArray(componentType, featureIdValues)
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
}

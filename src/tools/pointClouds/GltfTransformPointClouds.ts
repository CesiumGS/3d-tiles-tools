import { Document } from "@gltf-transform/core";
import { Logger } from "@gltf-transform/core";
import { Accessor } from "@gltf-transform/core";
import { Primitive } from "@gltf-transform/core";
import { Buffer as GltfBuffer } from "@gltf-transform/core";

import { quantize } from "@gltf-transform/functions";
import { QuantizeOptions } from "@gltf-transform/functions";

import { KHRMeshQuantization } from "@gltf-transform/extensions";

import { EXTMeshFeatures } from "../../gltf-extensions";

import { Iterables } from "../../base";

import { TileFormatError } from "../../tilesets";

import { AccessorCreation } from "../migration/AccessorCreation";

import { ReadablePointCloud } from "./ReadablePointCloud";

/**
 * An internal interface representing a point cloud with
 * glTF-Transform structures.
 *
 * @internal
 */
export interface GltfTransformPointCloud {
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
 *
 * @internal
 */
export class GltfTransformPointClouds {
  /**
   * Creates a point cloud representation, based on glTF-Transform,
   * from the given `ReadablePointCloud` input.
   *
   * Many details about the result are intentionally not
   * specified. It is supposed to be "just a point cloud".
   *
   * However, some details depend on the given parameters:
   *
   * When `mayRequireAlpha` is `false`, then a point cloud with RGB colors
   * and an OPAQUE alpha mode material will be created.
   * Otherwise, the implementation will still check thea actual colors: If
   * any of them has a non-1.0 alpha component, then it will create a
   * point cloud with a BLEND alpha mode material and RGBA colors.
   *
   * @param readablePointCloud - The `ReadablePointCloud`
   * @param mayRequireAlpha - Whether the point cloud may
   * require an alpha component for its colors.
   * @returns The GltfTransformPointCloud
   * @throws TileFormatError If the input data does not
   * at least contain a `POSITION` attribute.
   */
  static build(
    readablePointCloud: ReadablePointCloud,
    mayRequireAlpha: boolean
  ): GltfTransformPointCloud {
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

    // Assign a material to the primitive
    const material = document.createMaterial();
    material.setMetallicFactor(0.0);
    material.setRoughnessFactor(1.0);
    primitive.setMaterial(material);

    // Assign the COLOR_0, if present
    const colors = readablePointCloud.getAttributeValues("COLOR_0");
    if (colors) {
      const colorAccessor = document.createAccessor();
      colorAccessor.setBuffer(buffer);
      colorAccessor.setNormalized(true);

      // If there may be an alpha component, then check if the colors
      // do actually require an alpha component
      let useAlpha = false;
      if (mayRequireAlpha) {
        useAlpha = GltfTransformPointClouds.doesRequireAlpha(colors);
      }
      // When the alpha component is used, then and assign BLEND
      // alpha mode and RGBA colors. Otherwise, use OPAQUE alpha
      // mode and RGB colors.
      if (useAlpha) {
        material.setAlphaMode("BLEND");
        colorAccessor.setType(Accessor.Type.VEC4);
        const colorsBytesRGBA = Iterables.map(colors, (c: number) => 255.0 * c);
        colorAccessor.setArray(new Uint8Array([...colorsBytesRGBA]));
      } else {
        colorAccessor.setType(Accessor.Type.VEC3);

        // Filter out the 'A' components from the RGBA values
        const colorsRGB = Iterables.filterWithIndex(
          colors,
          (e: number, i: number) => i % 4 !== 3
        );
        const colorsBytesRGB = Iterables.map(
          colorsRGB,
          (c: number) => 255.0 * c
        );
        colorAccessor.setArray(new Uint8Array([...colorsBytesRGB]));
      }
      primitive.setAttribute("COLOR_0", colorAccessor);
    }

    // Assign the global color, if present
    const globalColor = readablePointCloud.getNormalizedLinearGlobalColor();
    if (globalColor) {
      material.setAlphaMode("BLEND");
      material.setBaseColorFactor(globalColor);
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

    // Create the node, with the the z-up-to-y-up transform
    // and the "global position" of the point cloud
    const node = document.createNode();
    node.setMatrix([1, 0, 0, 0, 0, 0, -1, 0, 0, 1, 0, 0, 0, 0, 0, 1]);
    const globalPosition = readablePointCloud.getGlobalPosition();
    if (globalPosition) {
      // The translation has to take the z-up-to-y-up
      // conversion into account
      node.setTranslation([
        globalPosition[0],
        globalPosition[2],
        -globalPosition[1],
      ]);
    }
    node.setMesh(mesh);

    const scene = document.createScene();
    scene.addChild(node);

    const result: GltfTransformPointCloud = {
      document: document,
      primitive: primitive,
    };
    return result;
  }

  /**
   * Returns whether the given colors require an alpha component.
   *
   * This takes normalized linear colors with RGBA components
   * (given as a flat array), and returns whether the alpha
   * component of any of these colors is not 1.0.
   *
   * @param normalizedColorsRGBA - The colors
   * @returns Whether the colors require an alpha component
   */
  private static doesRequireAlpha(
    normalizedColorsRGBA: Iterable<number>
  ): boolean {
    let index = 0;
    for (const c of normalizedColorsRGBA) {
      if (index % 4 === 3) {
        if (c !== 1.0) {
          return true;
        }
      }
      index++;
    }
    return false;
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

  /**
   * Applies the glTF-Transform `quantize` operation to the given
   * document (if either argument is `true`).
   *
   * This will perform a quantization of the positions and normals,
   * depending on the arguments, with an unspecified number of bits,
   * and add the `KHR_mesh_quantization` extension as a required
   * extension to the document.
   *
   * @param document - The document
   * @param quantizePositions - Whether positions are quantized
   * @param quantizeNormals - Whether normals are quantized
   * @returns A promise that resolves when the operation is finished
   */
  static async applyQuantization(
    document: Document,
    quantizePositions: boolean,
    quantizeNormals: boolean
  ) {
    if (!quantizePositions && !quantizeNormals) {
      return;
    }
    const options: QuantizeOptions = {};
    if (quantizePositions) {
      options.quantizePosition = 16;
    }
    if (quantizeNormals) {
      options.quantizeNormal = 16;
    }
    const khrMeshQuantization = document.createExtension(KHRMeshQuantization);
    khrMeshQuantization.setRequired(true);
    // The 'quantize' transform internally calls 'prune' and 'dedup',
    // with the 'INFO' log level. Set the log level to 'WARN' here
    // to prevent this output.
    document.setLogger(new Logger(Logger.Verbosity.WARN));
    await document.transform(quantize(options));
  }
}

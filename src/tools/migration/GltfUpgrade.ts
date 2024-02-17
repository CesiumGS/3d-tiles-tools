import { Accessor, Document, Logger } from "@gltf-transform/core";

import { GltfUtilities } from "../contentProcessing/GltfUtilities";
import { GltfTransform } from "../contentProcessing/GltfTransform";

import { Loggers } from "../../base";
import { prune } from "@gltf-transform/functions";
const logger = Loggers.get("migration");

/**
 * Methods for obtaining a valid glTF-Transform document from
 * inputs that may contain legacy data.
 *
 * This is intended for cases where the data has to be upgraded
 * by preprocessing the input (for example, to convert a glTF 1.0
 * GLB to glTF 2.0), or by post-processing the document (for example,
 * to convert legacy representations of data (like 2D oct-encoded
 * normals) into the expected representation).
 *
 * @internal
 */
export class GltfUpgrade {
  static async obtainDocument(glb: Buffer) {
    // Upgrade the GLB buffer to glTF 2.0 if necessary,
    // and convert the CESIUM_RTC extension into a root
    // node translation if necessary
    const gltfVersion = GltfUtilities.getGltfVersion(glb);
    if (gltfVersion < 2.0) {
      logger.info("Found glTF 1.0 - upgrading to glTF 2.0 with gltf-pipeline");
      glb = await GltfUtilities.upgradeGlb(glb, undefined);
      glb = await GltfUtilities.replaceCesiumRtcExtension(glb);
    }

    // Read the GLB data from the payload of the tile
    const io = await GltfTransform.getIO();
    const document = await io.readBinary(glb);
    const root = document.getRoot();
    const asset = root.getAsset();
    asset.generator = "glTF-Transform";

    // When the input contained glTF 1.0 data, decode any
    // oct-encoded (2D) normals into 3D
    if (gltfVersion < 2.0) {
      await document.transform(GltfUpgrade.octDecode2DNormals);
      document.setLogger(new Logger(Logger.Verbosity.WARN));
      await document.transform(prune());
    }
    return document;
  }

  /**
   * Check each mesh primitive in the given document, to see if it
   * contains a VEC2/BYTE or VEC2/SHORT accessor for the NORMAL.
   * If it does, then this accessor will be replaced by one that
   * contains the decoded 3D normals.
   *
   * (Note that the old accessors might become unused by that.
   * The document should afterwards be cleaned up with
   * glTF-Transform 'prune()')
   *
   * @param document - The glTF-Transform document
   */
  private static octDecode2DNormals(document: Document) {
    const root = document.getRoot();
    const meshes = root.listMeshes();
    let decodedAccessorsCounter = 0;
    for (const mesh of meshes) {
      const primitives = mesh.listPrimitives();
      for (const primitive of primitives) {
        const normalAccessor = primitive.getAttribute("NORMAL");
        if (normalAccessor) {
          const type = normalAccessor.getType();
          const componentType = normalAccessor.getComponentType();
          const GL_BYTE = 5120;
          const GL_SHORT = 5122;
          if (type === "VEC2" && componentType === GL_BYTE) {
            logger.debug("Decoding oct-encoded (VEC2/BYTE) normals...");
            const decodedNormalsAccessor = GltfUpgrade.octDecodeAccessor(
              document,
              normalAccessor,
              255.0
            );
            primitive.setAttribute("NORMAL", decodedNormalsAccessor);
            decodedAccessorsCounter++;
          } else if (type === "VEC2" && componentType === GL_SHORT) {
            logger.debug("Decoding oct-encoded (VEC2/SHORT) normals...");
            const decodedNormalsAccessor = GltfUpgrade.octDecodeAccessor(
              document,
              normalAccessor,
              65535.0
            );
            primitive.setAttribute("NORMAL", decodedNormalsAccessor);
            decodedAccessorsCounter++;
          }
        }
      }
    }
    if (decodedAccessorsCounter > 0) {
      logger.info(
        `Decoded ${decodedAccessorsCounter} oct-encoded normals accessors to 3D`
      );
    }
  }

  /**
   * Decode the oct-encoded (2D) normals from the given accessor, and
   * return the result as a new accessor.
   *
   * @param document - The glTF-Transform document
   * @param encodedAccessor - The (VEC2) accessor containing the
   * oct-encoded 2D normal data
   * @param range - The decoding range: 255 for BYTE, 65535 for SHORT
   * @returns The decoded (VEC3/FLOAT) accessor.
   */
  private static octDecodeAccessor(
    document: Document,
    encodedAccessor: Accessor,
    range: number
  ) {
    const decodedData: number[] = [];

    const count = encodedAccessor.getCount();
    for (let i = 0; i < count; i++) {
      const encoded = [0, 0];
      encodedAccessor.getElement(i, encoded);
      const decoded = GltfUpgrade.octDecode(encoded, range);
      decodedData.push(...decoded);
    }

    const decodedAccessor = document.createAccessor();
    decodedAccessor.setType("VEC3");
    decodedAccessor.setArray(new Float32Array(decodedData));
    return decodedAccessor;
  }

  /**
   * Oct-decode the given 2D normal from the given value range into
   * a 3D normal.
   *
   * @param encoded - The encoded normal as a 2-element array
   * @param range - The decoding range: 255 for BYTE, 65535 for SHORT
   * @returns The decoded normal as a 3-element array
   */
  private static octDecode(encoded: number[], range: number): number[] {
    // NOTE: This is "ported" from CesiumJS octDecode.glsl.
    // The result is not pretty (and a similar functionality
    // is contained in the 'AttributeCompression' class in a
    // different package), but should be OK for the upgrade step.
    let x = encoded[0];
    let y = encoded[1];
    if (x === 0.0 && y === 0.0) {
      return [0.0, 0.0, 1.0]; // Unit-length
    }

    x = (x / range) * 2.0 - 1.0;
    y = (y / range) * 2.0 - 1.0;
    const v = [x, y, 1.0 - Math.abs(x) - Math.abs(y)];
    if (v[2] < 0.0) {
      v[0] = (1.0 - Math.abs(v[0])) * (v[0] >= 0.0 ? 1.0 : -1.0);
      v[1] = (1.0 - Math.abs(v[1])) * (v[1] >= 0.0 ? 1.0 : -1.0);
    }
    const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    const invLen = 1.0 / len;
    v[0] *= invLen;
    v[1] *= invLen;
    v[2] *= invLen;
    return v;
  }
}

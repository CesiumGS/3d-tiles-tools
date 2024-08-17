import { Document } from "@gltf-transform/core";
import { Accessor } from "@gltf-transform/core";
import { Logger } from "@gltf-transform/core";

import { prune } from "@gltf-transform/functions";

import { GltfUtilities } from "../contentProcessing/GltfUtilities";
import { GltfTransform } from "../contentProcessing/GltfTransform";

import { Loggers } from "../../base";
const logger = Loggers.get("migration");

/**
 * Methods for obtaining a valid glTF-Transform document from
 * inputs that may contain legacy data.
 *
 * @internal
 */
export class GltfUpgrade {
  /**
   * Obtain a glTF-Transform document from the given GLB buffer.
   *
   * This is intended for cases where the input may contain various
   * forms of "legacy" data, and where it may be necessary to
   * preprocess the input or postprocess the document, in order
   * to obtain a valid glTF 2.0 document.
   *
   * The preprocessing steps that may be applied to the buffer are:
   *
   * - glTF 1.0 data will be upgraded to glTF 2.0 with gltf-pipeline
   * - The CESIUM_RTC extension from glTF 1.0 will be converted into
   *   a translation of a (newly inserted) root node of the document
   *
   * The postprocessing steps that may be applied to the document are:
   * - Decode oct-encoded normals into the standard representation
   *   (for details, see `octDecode2DNormals`)
   * - Decode compressed 3D texture coordinates into 2D
   *   (for details, see `decode3DTexCoords`)
   *
   * @param glb The GLB buffer
   * @returns A promise to the glTF-Transform `Document`
   */
  static async obtainDocument(glb: Buffer): Promise<Document> {
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
    // oct-encoded (2D) normals into 3D, and compressed
    // (3D) texture coordinates into 2D
    if (gltfVersion < 2.0) {
      await document.transform(GltfUpgrade.octDecode2DNormals);
      await document.transform(GltfUpgrade.decode3DTexCoords);
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

  /**
   * Check each mesh primitive in the given document, to see if it
   * contains a VEC3/BYTE or VEC3/SHORT accessor for the TEXCOORD_X.
   * If it does, then this accessor will be replaced by one that
   * contains the decoded 2D texture coordinates.
   *
   * (Note that the old accessors might become unused by that.
   * The document should afterwards be cleaned up with
   * glTF-Transform 'prune()')
   *
   * @param document - The glTF-Transform document
   */
  private static decode3DTexCoords(document: Document) {
    const root = document.getRoot();
    const meshes = root.listMeshes();
    let decodedAccessorsCounter = 0;
    for (const mesh of meshes) {
      const primitives = mesh.listPrimitives();
      for (const primitive of primitives) {
        const semantics = primitive.listSemantics();
        for (const semantic of semantics) {
          if (semantic.startsWith("TEXCOORD_")) {
            const texcoordAccessor = primitive.getAttribute(semantic);
            if (texcoordAccessor) {
              const type = texcoordAccessor.getType();
              const componentType = texcoordAccessor.getComponentType();
              const GL_BYTE = 5120;
              const GL_SHORT = 5122;
              if (type === "VEC3" && componentType === GL_BYTE) {
                logger.debug("Decoding (VEC3/BYTE) texture coordinates...");
                const decodedTexCoordsAccessor =
                  GltfUpgrade.decodeTexCoordAccessor(
                    document,
                    texcoordAccessor,
                    127.0
                  );
                primitive.setAttribute(semantic, decodedTexCoordsAccessor);
                decodedAccessorsCounter++;
              } else if (type === "VEC3" && componentType === GL_SHORT) {
                logger.debug("Decoding (VEC3/SHORT) texture coordinates...");
                const decodedTexCoordsAccessor =
                  GltfUpgrade.decodeTexCoordAccessor(
                    document,
                    texcoordAccessor,
                    32767.0
                  );
                primitive.setAttribute(semantic, decodedTexCoordsAccessor);
                decodedAccessorsCounter++;
              }
            }
          }
        }
      }
    }
    if (decodedAccessorsCounter > 0) {
      logger.info(
        `Decoded ${decodedAccessorsCounter} texture coordinate accessors to 2D`
      );
    }
  }

  /**
   * Decode the encoded (3D) texture coordinates from the given accessor, and
   * return the result as a new accessor.
   *
   * @param document - The glTF-Transform document
   * @param encodedAccessor - The (VEC3) accessor containing the
   * encoded 3D texture coordinate data
   * @param range - The decoding range: 127 for BYTE, 32767 for SHORT
   * @returns The decoded (VEC2/FLOAT) accessor.
   */
  private static decodeTexCoordAccessor(
    document: Document,
    encodedAccessor: Accessor,
    range: number
  ) {
    const decodedData: number[] = [];

    const count = encodedAccessor.getCount();
    for (let i = 0; i < count; i++) {
      const encoded = [0, 0, 0];
      encodedAccessor.getElement(i, encoded);
      const decoded = GltfUpgrade.decodeTexCoord(encoded, range);
      decodedData.push(...decoded);
    }

    const decodedAccessor = document.createAccessor();
    decodedAccessor.setType("VEC2");
    decodedAccessor.setArray(new Float32Array(decodedData));
    return decodedAccessor;
  }

  /**
   * Decode the given 3D texture coordinates from the given value
   * range into 2D texture coordinates
   *
   * @param encoded - The encoded coordinates as a 3-element array
   * @param range - The decoding range: 127 for BYTE, 32767 for SHORT
   * @returns The decoded texture coordinates as a 2-element array
   */
  private static decodeTexCoord(encoded: number[], range: number): number[] {
    // Note: The deconding of 3D texture coordinates into 2D that
    // took place in some shaders in glTF 1.0 was implemented
    // like this:
    //   const float uvMultiplier = 0.0000305185; // 1/32767
    //   v_texcoord0 = a_texcoord0.xy * uvMultiplier * (a_texcoord0.z+32767.0);
    // This is an attempt to emulate this, involving some guesses:

    const uvMultiplier = 1.0 / range;
    const zFactor = encoded[2] + range;
    const x = encoded[0] * uvMultiplier * zFactor;
    const y = encoded[1] * uvMultiplier * zFactor;
    const result = [x, y];
    return result;
  }
}

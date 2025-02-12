import GltfPipeline from "gltf-pipeline";

import { Buffers } from "../../base";

import { TileFormatError } from "../../tilesets";
import { Extensions } from "../../tilesets";

import { GltfPipelineLegacy } from "./GltfPipelineLegacy";
import { GltfWeb3dQuantizedAttributes } from "./GltfWeb3dQuantizedAttributes";

import { Loggers } from "../../base";
const logger = Loggers.get("contentProcessing");

/**
 * Internal utility methods related to glTF/GLB data.
 *
 * @internal
 */
export class GltfUtilities {
  /**
   * Upgrades the binary glTF (GLB) data in the given buffer.
   *
   * The exact pre- and postconditions of this is are intentionally
   * not specified. But it is mainly used for updating a limited
   * subset of glTF 1.0 binary data to glTF 2.0.
   *
   * @param glbBuffer - The buffer containing the GLB
   * @param options - Options for the upgrade that are passed to
   * `gltf-pipeline`
   * @returns A promise that resolves with the upgraded GLB.
   */
  static async upgradeGlb(glbBuffer: Buffer, options: any): Promise<Buffer> {
    const result = await GltfPipeline.processGlb(glbBuffer, options);
    return result.glb;
  }

  /**
   * Obtains the `version` field value from the header in the given GLB buffer.
   *
   * @param glbBuffer - The GLB buffer
   * @returns The glTF version
   * @throws TileFormatError If the buffer does not contain enough bytes
   * for a glTF header
   */
  static getGltfVersion(glbBuffer: Buffer) {
    if (glbBuffer.length < 12) {
      throw new TileFormatError(
        `Expected at least 12 bytes, but only got ${glbBuffer.length}`
      );
    }
    const version = glbBuffer.readUInt32LE(4);
    return version;
  }

  /**
   * Extract the JSON- and binary part from the given GLB buffer.
   *
   * The given buffer may contain glTF 2.0 binary data, or glTF 1.0
   * binary data.
   *
   * Note that this does NOT convert the input data. It only extracts
   * the data, as-it-is.
   *
   * @param glbBuffer - The buffer containing the GLB
   * @returns The JSON- and binary data buffers
   * @throws TileFormatError If the input does not contain valid GLB data.
   */
  static extractDataFromGlb(glbBuffer: Buffer): {
    jsonData: Buffer;
    binData: Buffer;
  } {
    const magic = Buffers.getMagicString(glbBuffer);
    if (magic !== "glTF") {
      throw new TileFormatError(
        `Expected magic header to be 'glTF', but found ${magic}`
      );
    }
    if (glbBuffer.length < 12) {
      throw new TileFormatError(
        `Expected at least 12 bytes, but only got ${glbBuffer.length}`
      );
    }
    const length = glbBuffer.readUInt32LE(8);
    if (length > glbBuffer.length) {
      throw new TileFormatError(
        `Header indicates ${length} bytes, but input has ${glbBuffer.length} bytes`
      );
    }
    const version = glbBuffer.readUInt32LE(4);
    if (version === 1) {
      return GltfUtilities.extractDataFromGlb1(glbBuffer);
    }
    if (version === 2) {
      return GltfUtilities.extractDataFromGlb2(glbBuffer);
    }
    throw new TileFormatError(`Expected version 1 or 2, but got ${version}`);
  }

  /**
   * Internal method for `extractDataFromGlb`, covering glTF 1.0.
   *
   * @param glbBuffer - The buffer containing the GLB
   * @returns The JSON- and binary data buffers
   * @throws TileFormatError If the input does not contain valid GLB data.
   */
  private static extractDataFromGlb1(glbBuffer: Buffer): {
    jsonData: Buffer;
    binData: Buffer;
  } {
    const headerLength = 20;
    if (glbBuffer.length < headerLength) {
      throw new TileFormatError(
        `Expected at least 20 bytes, but only got ${glbBuffer.length}`
      );
    }
    const length = glbBuffer.readUInt32LE(8);
    const contentLength = glbBuffer.readUint32LE(12);
    const contentFormat = glbBuffer.readUint32LE(16);
    if (contentFormat !== 0) {
      throw new TileFormatError(
        `Expected content format to be 0, but found ${contentFormat}`
      );
    }
    const contentStart = headerLength;
    const contentEnd = contentStart + contentLength;
    if (glbBuffer.length < contentEnd) {
      throw new TileFormatError(
        `Expected at least ${contentEnd} bytes, but only got ${glbBuffer.length}`
      );
    }
    const contentData = glbBuffer.subarray(contentStart, contentEnd);

    const bodyStart = contentEnd;
    const bodyEnd = length;
    const bodyData = glbBuffer.subarray(bodyStart, bodyEnd);
    return {
      jsonData: contentData,
      binData: bodyData,
    };
  }

  /**
   * Internal method for `extractDataFromGlb`, covering glTF 2.0.
   *
   * @param glbBuffer - The buffer containing the GLB
   * @returns The JSON- and binary data buffers
   * @throws TileFormatError If the input does not contain valid GLB data.
   */
  private static extractDataFromGlb2(glbBuffer: Buffer) {
    if (glbBuffer.length < 20) {
      throw new TileFormatError(
        `Expected at least 20 bytes, but only got ${glbBuffer.length}`
      );
    }
    const length = glbBuffer.readUInt32LE(8);

    // Extract the JSON chunk data
    const jsonChunkHeaderStart = 12;
    const jsonChunkLength = glbBuffer.readUint32LE(jsonChunkHeaderStart);
    const jsonChunkType = glbBuffer.readUint32LE(jsonChunkHeaderStart + 4);
    const expectedJsonChunkType = 0x4e4f534a; // ASCII string for "JSON"
    if (jsonChunkType !== expectedJsonChunkType) {
      throw new TileFormatError(
        `Expected chunk type to be ${expectedJsonChunkType}, but found ${jsonChunkType}`
      );
    }
    const jsonChunkStart = 20;
    const jsonChunkEnd = jsonChunkStart + jsonChunkLength;
    if (glbBuffer.length < jsonChunkEnd) {
      throw new TileFormatError(
        `Expected at least ${jsonChunkEnd} bytes, but only got ${glbBuffer.length}`
      );
    }
    const jsonChunkData = glbBuffer.subarray(jsonChunkStart, jsonChunkEnd);

    // Extract the BIN chunk data
    let binChunkData: Buffer;
    const binChunkHeaderStart = jsonChunkEnd;
    const chunkHeaderLength = 12;

    // If there are not enough bytes for the BIN chunk header
    // after the end of the JSON chunk, then the BIN data
    // will be an empty buffer
    if (binChunkHeaderStart + chunkHeaderLength > length) {
      binChunkData = Buffer.alloc(0);
    } else {
      const binChunkLength = glbBuffer.readUint32LE(binChunkHeaderStart);
      const binChunkType = glbBuffer.readUint32LE(binChunkHeaderStart + 4);
      const expectedBinChunkType = 0x004e4942; // ASCII string for "BIN"
      if (binChunkType !== expectedBinChunkType) {
        throw new TileFormatError(
          `Expected chunk type to be ${expectedBinChunkType}, but found ${binChunkType}`
        );
      }
      const binChunkStart = binChunkHeaderStart + 8;
      const binChunkEnd = binChunkStart + binChunkLength;
      if (glbBuffer.length < binChunkEnd) {
        throw new TileFormatError(
          `Expected at least ${binChunkEnd} bytes, but only got ${glbBuffer.length}`
        );
      }
      binChunkData = glbBuffer.subarray(binChunkStart, binChunkEnd);
    }

    return {
      jsonData: jsonChunkData,
      binData: binChunkData,
    };
  }

  /**
   * Extract the JSON part from the given GLB buffer and return it
   * as a buffer.
   *
   * The given buffer may contain glTF 2.0 binary data, or glTF 1.0
   * binary data.
   *
   * Note that this does NOT convert the input data. It only extracts
   * the data, as-it-is.
   *
   * @param glbBuffer - The buffer containing the GLB
   * @returns The JSON buffer
   * @throws TileFormatError If the input does not contain valid GLB data.
   */
  static extractJsonFromGlb(glbBuffer: Buffer): Buffer {
    const data = GltfUtilities.extractDataFromGlb(glbBuffer);
    return data.jsonData;
  }

  /**
   * Creates a glTF 2.0 binary (GLB) buffer from the given JSON and
   * binary chunk data.
   *
   * This is the reverse of `extractDataFromGlb2`.
   *
   * This is a low-level function for turning JSON- and binary chunk
   * data into a GLB buffer. The caller is responsible for making sure
   * that the given JSON matches the given BIN data (for example, that
   * the given JSON does not involve a buffer byte offset that does
   * not fit the given buffer data)
   *
   * @param jsonData - The JSON data
   * @param binData - The binary chunk data
   * @returns The GLB data
   */
  static createGlb2FromData(jsonData: Buffer, binData: Buffer) {
    // Ensure 4-byte-alignment for the jsonData
    let jsonDataPadded = jsonData;
    if (jsonData.length % 4 != 0) {
      const paddingLength = 4 - (jsonData.length % 4);
      const padding = Buffer.from(Array(paddingLength).fill(32));
      jsonDataPadded = Buffer.concat([jsonDataPadded, padding]);
    }

    // Ensure 4-byte-alignment for the binData
    let binDataPadded = binData;
    if (binData.length % 4 != 0) {
      const paddingLength = 4 - (binData.length % 4);
      const padding = Buffer.from(Array(paddingLength));
      binDataPadded = Buffer.concat([binDataPadded, padding]);
    }

    // Create the JSON chunk
    const CHUNK_TYPE_JSON = 0x4e4f534a; // ASCII string "JSON"
    const jsonChunkHeader = Buffer.alloc(8);
    jsonChunkHeader.writeInt32LE(jsonDataPadded.length, 0);
    jsonChunkHeader.writeInt32LE(CHUNK_TYPE_JSON, 4);
    const jsonChunkData = Buffer.concat([jsonChunkHeader, jsonDataPadded]);

    // Create the BIN chunk
    const CHUNK_TYPE_BIN = 0x004e4942; // ASCII string "BIN"
    const binChunkHeader = Buffer.alloc(8);
    binChunkHeader.writeInt32LE(binDataPadded.length, 0);
    binChunkHeader.writeInt32LE(CHUNK_TYPE_BIN, 4);
    const binChunkData = Buffer.concat([binChunkHeader, binDataPadded]);

    // Assemble the GLB data
    const MAGIC_BINARY_GLTF_HEADER = 0x46546c67; // ASCII string "glTF"
    const BINARY_GLTF_VERSION = 2;
    // 12 bytes for header
    // length of JSON + 8 bytes for JSON chunk header
    // length of BIN  + 9 bytes for BIN  chunk header
    const length = 12 + jsonDataPadded.length + 8 + binDataPadded.length + 8;
    const header = Buffer.alloc(12);
    header.writeInt32LE(MAGIC_BINARY_GLTF_HEADER, 0);
    header.writeInt32LE(BINARY_GLTF_VERSION, 4);
    header.writeInt32LE(length, 8);

    const glbData = Buffer.concat([header, jsonChunkData, binChunkData]);
    return glbData;
  }

  /**
   * Given an input buffer containing a binary glTF asset, optimize it
   * using gltf-pipeline with the provided options.
   *
   * This method also performs a few updates of certain legacy
   * features that are specific for the GLB data that is part
   * of I3DM and B3DM. Details are not specified here.
   *
   * @param glbBuffer - The buffer containing the binary glTF.
   * @param options - Options specifying custom gltf-pipeline behavior.
   * @returns A promise that resolves to the optimized binary glTF.
   */
  static async optimizeGlb(glbBuffer: Buffer, options: any): Promise<Buffer> {
    options = options ?? {};
    if (!options.customStages) {
      options.customStages = [];
    }
    const customStage = async (gltf: any) => {
      await GltfPipelineLegacy.process(gltf);
      return gltf;
    };
    options.customStages.push(customStage);
    const result = await GltfPipeline.processGlb(glbBuffer, options);
    return result.glb;
  }

  /**
   * Given an input buffer containing a binary glTF asset, remove
   * its use of the `CESIUM_RTC` extension by inserting new nodes
   * (above the former root nodes) that contain the RTC center as
   * their translation.
   *
   * @param glbBuffer - The buffer containing the binary glTF.
   * @param gltfUpAxis - The glTF up-axis, defaulting to "Y"
   * @returns A promise that resolves to the resulting binary glTF.
   *
   * @deprecated This uses `gltf-pipeline` to replace the CESIUM_RTC
   * extension, is only applicable to GLB data, and may affect the
   * structure of the GLB in a way that is hard to predict. Use
   * the `replaceCesiumRtcExtensionInGltf2Glb` function or the
   * `replaceCesiumRtcExtensionInGltf` to perform this operation
   * only when necessary, and without other side effects
   */
  static async replaceCesiumRtcExtension(
    glbBuffer: Buffer,
    gltfUpAxis: "X" | "Y" | "Z" | undefined
  ): Promise<Buffer> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const customStage = (gltf: any, options: any) => {
      GltfUtilities.replaceCesiumRtcExtensionInGltf(gltf, gltfUpAxis);
      return gltf;
    };
    const options = {
      customStages: [customStage],
      keepUnusedElements: true,
    };
    const result = await GltfPipeline.processGlb(glbBuffer, options);
    return result.glb;
  }

  /**
   * Replaces the `CESIUM_RTC` extension in the given glTF 2.0 GLB data.
   *
   * If the given glTF does NOT use the `CESIUM_RTC` extension, then
   * the given buffer will be returned unmodified.
   *
   * Otherwise, this will insert a new parent node above each root node
   * of a scene. These new parent nodes will have a `translation`
   * that is derived taken from the `CESIUM_RTC` `center`,
   * possibly adjusted to take the up-axis of the glTF into account.
   *
   * The `CESIUM_RTC` extension object and its used/required
   * usage declarations will be removed.
   *
   * @param gltf - The glTF object
   * @param gltfUpAxis - The glTF up-axis, defaulting to "Y"
   */
  static replaceCesiumRtcExtensionInGltf2Glb(
    glb: Buffer,
    gltfUpAxis?: "X" | "Y" | "Z" | undefined
  ): Buffer {
    // Examine the glTF JSON to see whether it contains the CESIUM_RTC
    // extension. This extension is converted into a root node
    // translation if necessary. Note that this is also done for cases
    // where this (glTF 1.0) extension is contained in a glTF 2.0 asset.
    const gltfData = GltfUtilities.extractDataFromGlb(glb);
    const gltfJson = JSON.parse(gltfData.jsonData.toString("utf8"));
    const extensionsUsed = gltfJson.extensionsUsed || [];
    if (extensionsUsed.includes("CESIUM_RTC")) {
      logger.info("Found CESIUM_RTC - replacing with root node translation");
      GltfUtilities.replaceCesiumRtcExtensionInGltf(gltfJson, gltfUpAxis);
      const gltfJsonBuffer = Buffer.from(JSON.stringify(gltfJson, null, 2));
      return GltfUtilities.createGlb2FromData(gltfJsonBuffer, gltfData.binData);
    }
    return glb;
  }

  /**
   * Replaces the `CESIUM_RTC` extension in the given glTF object.
   *
   * If the given glTF does NOT use the `CESIUM_RTC` extension, then
   * nothing will be done.
   *
   * Otherwise, this will insert a new parent node above each root node
   * of a scene. These new parent nodes will have a `translation`
   * that is derived taken from the `CESIUM_RTC` `center`,
   * possibly adjusted to take the up-axis of the glTF into account.
   *
   * The `CESIUM_RTC` extension object and its used/required
   * usage declarations will be removed.
   *
   * @param gltf - The glTF object
   * @param gltfUpAxis - The glTF up-axis, defaulting to "Y"
   */
  static replaceCesiumRtcExtensionInGltf(
    gltf: any,
    gltfUpAxis: "X" | "Y" | "Z" | undefined
  ) {
    if (!gltf.extensions) {
      return;
    }
    const rtcExtension = gltf.extensions["CESIUM_RTC"];
    if (!rtcExtension) {
      return;
    }
    // Compute the translation, taking the up-axis transform into account
    let rtcTranslation: number[];
    if (gltfUpAxis === "X") {
      rtcTranslation = [
        rtcExtension.center[1],
        -rtcExtension.center[2],
        -rtcExtension.center[0],
      ];
    } else if (gltfUpAxis === "Y" || gltfUpAxis === undefined) {
      rtcTranslation = [
        rtcExtension.center[0],
        rtcExtension.center[2],
        -rtcExtension.center[1],
      ];
    } else {
      rtcTranslation = [
        rtcExtension.center[0],
        rtcExtension.center[1],
        rtcExtension.center[2],
      ];
    }
    const scenes = gltf.scenes;
    if (!scenes) {
      return;
    }
    for (const scene of scenes) {
      const sceneNodes = scene.nodes;
      if (sceneNodes) {
        for (let i = 0; i < sceneNodes.length; i++) {
          const nodeIndex = sceneNodes[i];
          const newParent = {
            translation: rtcTranslation,
            children: [nodeIndex],
          };
          const newParentIndex = gltf.nodes.length;
          gltf.nodes.push(newParent);
          sceneNodes[i] = newParentIndex;
        }
      }
    }
    Extensions.removeExtensionUsed(gltf, "CESIUM_RTC");
    Extensions.removeExtension(gltf, "CESIUM_RTC");
  }

  /**
   * Given an input buffer containing a binary glTF 2.0 asset, remove
   * its use of the `WEB3D_quantized_attributes` extension.
   *
   * See `GltfWeb3dQuantizedAttributes` for further notes about
   * the context where this is used.
   *
   * @param glbBuffer - The buffer containing the binary glTF.
   * @returns A promise that resolves to the resulting binary glTF.
   */
  static async replaceWeb3dQuantizedAttributesExtension(
    glbBuffer: Buffer
  ): Promise<Buffer> {
    // Process the GLB data with a custom gltf-pipeline stage that removes
    // the WEB3D_quantized_attributes from the extensionsUsed/Required
    // arrays, and collects the 'decodeMatrix' arrays from the extension
    // objects in the accessors.
    const extensionName = "WEB3D_quantized_attributes";
    let usedExtension = false;
    const decodeMatrices: (number[] | undefined)[] = [];

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const customStage = (gltf: any, options: any) => {
      usedExtension = Extensions.usesExtension(gltf, extensionName);
      if (usedExtension) {
        Extensions.removeExtensionUsed(gltf, extensionName);

        // Collect the 'decodeMatrix' arrays, one for each accessor
        // (or 'undefined' if the accessor did not use the extension)
        const accessors = gltf.accessors || [];
        for (let i = 0; i < accessors.length; i++) {
          const accessor = accessors[i];
          const extensions = accessor.extensions || {};
          const extension = extensions[extensionName] || {};
          const decodeMatrix = extension.decodeMatrix;
          decodeMatrices.push(decodeMatrix);
        }
      }
      return gltf;
    };
    const options = {
      customStages: [customStage],
      keepUnusedElements: true,
    };
    const result = await GltfPipeline.processGlb(glbBuffer, options);
    const preprocessedGlb = result.glb;

    // If the glTF did not use the extension, then just return the result
    if (!usedExtension) {
      return preprocessedGlb;
    }

    // Otherwise, post-process the glTF to dequantize the accessors
    // using the decode matrices that have been found for them.
    return GltfWeb3dQuantizedAttributes.replaceWeb3dQuantizedAttributesExtension(
      preprocessedGlb,
      decodeMatrices
    );
  }
}

import GltfPipeline from "gltf-pipeline";

import { Buffers } from "../../base";

import { TileFormatError } from "../../tilesets";
import { Extensions } from "../../tilesets";

import { GltfPipelineLegacy } from "./GltfPipelineLegacy";

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
   * @returns A promise that resolves to the resulting binary glTF.
   */
  static async replaceCesiumRtcExtension(glbBuffer: Buffer): Promise<Buffer> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const customStage = (gltf: any, options: any) => {
      GltfUtilities.replaceCesiumRtcExtensionInternal(gltf);
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
   * Replaces the `CESIUM_RTC` extension in the given glTF object.
   *
   * This will insert a new parent node above each root node of
   * a scene. These new parent nodes will have a `translation`
   * that is directly taken from the `CESIUM_RTC` `center`.
   *
   * The `CESIUM_RTC` extension object and its used/required
   * usage declarations will be removed.
   *
   * @param gltf - The glTF object
   */
  private static replaceCesiumRtcExtensionInternal(gltf: any) {
    if (!gltf.extensions) {
      return;
    }
    const rtcExtension = gltf.extensions["CESIUM_RTC"];
    if (!rtcExtension) {
      return;
    }
    // Compute the translation, taking the y-up-vs-z-up transform into account
    const rtcTranslation = [
      rtcExtension.center[0],
      rtcExtension.center[2],
      -rtcExtension.center[1],
    ];
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
}

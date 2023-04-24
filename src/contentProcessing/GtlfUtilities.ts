import GltfPipeline from "gltf-pipeline";

import { Buffers } from "../base/Buffers";

import { TileFormatError } from "../tileFormats/TileFormatError";

import { Extensions } from "../tilesets/Extensions";

import { GltfPipelineLegacy } from "./GltfPipelineLegacy";

/**
 * Internal utility methods related to glTF/GLB data.
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
    const magic = Buffers.getMagicString(glbBuffer);
    if (magic !== "glTF") {
      throw new TileFormatError(
        `Expected magic header to be 'gltf', but found ${magic}`
      );
    }
    if (glbBuffer.length < 12) {
      throw new TileFormatError(
        `Expected at least 12 bytes, but only got ${glbBuffer.length}`
      );
    }
    const version = glbBuffer.readUInt32LE(4);
    const length = glbBuffer.readUInt32LE(8);
    if (length > glbBuffer.length) {
      throw new TileFormatError(
        `Header indicates ${length} bytes, but input has ${glbBuffer.length} bytes`
      );
    }
    if (version === 1) {
      if (glbBuffer.length < 20) {
        throw new TileFormatError(
          `Expected at least 20 bytes, but only got ${glbBuffer.length}`
        );
      }
      const contentLength = glbBuffer.readUint32LE(12);
      const contentFormat = glbBuffer.readUint32LE(16);
      if (contentFormat !== 0) {
        throw new TileFormatError(
          `Expected content format to be 0, but found ${contentFormat}`
        );
      }
      const contentStart = 20;
      const contentEnd = contentStart + contentLength;
      if (glbBuffer.length < contentEnd) {
        throw new TileFormatError(
          `Expected at least ${contentEnd} bytes, but only got ${glbBuffer.length}`
        );
      }
      const contentData = glbBuffer.subarray(contentStart, contentEnd);
      return contentData;
    } else if (version === 2) {
      if (glbBuffer.length < 20) {
        throw new TileFormatError(
          `Expected at least 20 bytes, but only got ${glbBuffer.length}`
        );
      }
      const chunkLength = glbBuffer.readUint32LE(12);
      const chunkType = glbBuffer.readUint32LE(16);
      const jsonChunkType = 0x4e4f534a; // ASCII string for "JSON"
      if (chunkType !== jsonChunkType) {
        throw new TileFormatError(
          `Expected chunk type to be ${jsonChunkType}, but found ${chunkType}`
        );
      }
      const chunkStart = 20;
      const chunkEnd = chunkStart + chunkLength;
      if (glbBuffer.length < chunkEnd) {
        throw new TileFormatError(
          `Expected at least ${chunkEnd} bytes, but only got ${glbBuffer.length}`
        );
      }
      const chunkData = glbBuffer.subarray(chunkStart, chunkEnd);
      return chunkData;
    } else {
      throw new TileFormatError(`Expected version 1 or 2, but got ${version}`);
    }
  }

  /**
   * Given an input buffer containing a binary glTF asset, optimize it
   * using gltf-pipeline with the provided options.
   *
   * This method also performs a few updates of certain legacy
   * features that are specific for the GLB data that is part
   * of I3DM and B3DM. Details are not specified here.
   *
   * @param glbBuffer The buffer containing the binary glTF.
   * @param options Options specifying custom gltf-pipeline behavior.
   * @returns A promise that resolves to the optimized binary glTF.
   */
  static async optimizeGlb(glbBuffer: Buffer, options: any): Promise<Buffer> {
    options = options ?? {};
    if (!options.customStages) {
      options.customStages = [];
    }
    const customStage = (gltf: any) => {
      GltfPipelineLegacy.process(gltf);
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
   * @param glbBuffer The buffer containing the binary glTF.
   * @returns A promise that resolves to the resulting binary glTF.
   */
  static async replaceCesiumRtcExtension(glbBuffer: Buffer) {
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
    const rtcExtension = gltf.extensions["CESIUM_RTC"];
    if (!rtcExtension) {
      return;
    }
    const rtcTranslation = rtcExtension.center;
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

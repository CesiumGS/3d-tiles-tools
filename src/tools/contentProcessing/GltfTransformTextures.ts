import path from "path";

import { Document, Transform } from "@gltf-transform/core";
import { Texture } from "@gltf-transform/core";

import { listTextureSlots } from "@gltf-transform/functions";

import { KHRTextureBasisu } from "@gltf-transform/extensions";

import { KtxUtility } from "../../ktx";
import { KtxEtc1sOptions } from "../../ktx";
import { KtxUastcOptions } from "../../ktx";
import { KtxOptions } from "../../ktx";

import { Loggers } from "../../base";
const logger = Loggers.get("contentProcessing");

/**
 * Methods to process textures in glTF assets (specifically,
 * glTF assets that are given as a glTF-Transform `Document`)
 *
 * @internal
 */
export class GltfTransformTextures {
  /**
   * Creates a glTF-Transform `Transform` that encodes all textures
   * in a given glTF asset to KTX.
   *
   * Some details about the behavior are intentionally not specified here.
   *
   * @param etc1sOptions - The options for ETC1S compression
   * @param uastcOptions - The options for UASTC compression
   * @returns The transform
   */
  static createTransformTexturesToKtx(
    etc1sOptions: KtxEtc1sOptions,
    uastcOptions: KtxUastcOptions
  ): Transform {
    return async (document: Document) => {
      await GltfTransformTextures.encodeTexturesToKtx(
        document,
        etc1sOptions,
        uastcOptions
      );
    };
  }

  /**
   * Encodes all textures in the given document to KTX.
   *
   * Some details about the behavior are intentionally not specified here.
   *
   * @param document - The document
   * @param etc1sOptions - The options for ETC1S compression
   * @param uastcOptions - The options for UASTC compression
   */
  private static async encodeTexturesToKtx(
    document: Document,
    etc1sOptions: KtxEtc1sOptions,
    uastcOptions: KtxUastcOptions
  ) {
    const root = document.getRoot();
    const textures = root.listTextures();
    let addExtension = false;
    for (const texture of textures) {
      const didEncode = await GltfTransformTextures.encodeTextureToKtx(
        texture,
        etc1sOptions,
        uastcOptions
      );
      if (didEncode) {
        addExtension = true;
      }
    }
    if (addExtension) {
      const khrTextureBasisuExtension =
        document.createExtension(KHRTextureBasisu);
      khrTextureBasisuExtension.setRequired(true);
    }
  }

  /**
   * Encodes the given texture to KTX.
   *
   * If the input texture already has the `image/ktx2` MIME type,
   * or does not contain valid PNG or JPG image data, then `false`
   * is returned.
   *
   * Otherwise, this will encode the texture to KTX and return `true`.
   *
   * (This includes updating the MIME type and the file extension of
   * the URI)
   *
   * By default, normal/occlusion/metallicRoughness textures will be
   * encoded to UASTC, and all other textures to ETC1S.
   *
   * @param texture - The texture
   * @param etc1sOptions - The options for ETC1S compression
   * @param uastcOptions - The options for UASTC compression
   * @returns Whether the texture was encoded
   */
  private static async encodeTextureToKtx(
    texture: Texture,
    etc1sOptions: KtxEtc1sOptions,
    uastcOptions: KtxUastcOptions
  ): Promise<boolean> {
    const mimeType = texture.getMimeType();
    if (mimeType === "image/ktx2") {
      logger.debug("Texture already is in KTX format");
      return false;
    }
    if (mimeType !== "image/png" && mimeType !== "image/jpeg") {
      logger.warn(`Texture MIME type is not supported: ${mimeType}`);
      return false;
    }
    const image = texture.getImage();
    if (!image) {
      logger.warn(`Could not obtain texture image`);
      return false;
    }
    const useUastc = GltfTransformTextures.useUastc(texture);

    let options: KtxOptions;
    if (useUastc) {
      options = {
        ...uastcOptions,
        uastc: true,
      };
    } else {
      options = {
        ...etc1sOptions,
        uastc: false,
      };
    }
    if (logger.isLevelEnabled("debug")) {
      logger.debug(`Encoding texture to KTX`);
      logger.debug(`Options: ${JSON.stringify(options)}`);
    }

    const inputImageData = Buffer.from(image);

    const startMs = performance.now();
    const outputImageData = await KtxUtility.convertImageData(
      inputImageData,
      options
    );
    const endMs = performance.now();

    if (logger.isLevelEnabled("debug")) {
      logger.debug(`Encoding texture to KTX DONE`);
    }
    if (logger.isLevelEnabled("trace")) {
      const oldSize = inputImageData.length;
      const newSize = outputImageData.length;
      const percent = newSize / (oldSize / 100.0);
      logger.trace(`  old size  : ${oldSize} bytes`);
      logger.trace(`  new size  : ${newSize} bytes (${percent.toFixed(3)}%)`);
      logger.trace(`  difference: ${oldSize - newSize} bytes`);
      logger.trace(`  duration  : ${(endMs - startMs).toFixed(3)} ms`);
    }

    texture.setImage(outputImageData);
    texture.setMimeType("image/ktx2");
    const oldUri = texture.getURI();
    if (oldUri) {
      const extension = path.extname(oldUri);
      const baseName = oldUri.substring(0, oldUri.length - extension.length);
      const newUri = baseName + ".ktx2";
      texture.setURI(newUri);
    }

    return true;
  }

  /**
   * Returns whether UASTC compression should be used for the
   * given texture.
   *
   * The `KHR_texture_basisu` specification carries an implementation note:
   *
   * "As a general rule, textures with color data should use ETC1S while
   * textures with non-color data (such as roughness-metallic or
   * normal maps) should use UASTC.""
   *
   * Based on this, this method returns `true` iff one of the "slots"
   * that the texture is associated with is `normalTexture`,
   * `occlusionTexture`, or `metallicRoughnessTexture`.
   *
   * @param texture - The texture
   * @returns Whether UASTC should be used for the texture
   */
  private static useUastc(texture: Texture): boolean {
    const slots = listTextureSlots(texture);
    const uastcSlots = [
      "normalTexture",
      "occlusionTexture",
      "metallicRoughnessTexture",
    ];
    return GltfTransformTextures.includesAny(slots, uastcSlots);
  }

  /**
   * Returns whether any of the given elements is included in
   * the given array.
   *
   * @param included - The iterable over the elements to check
   * @param including - The array that may include one of the elements
   * @returns Whether the array includes one of the elements
   */
  private static includesAny<T>(
    included: Iterable<T>,
    including: T[]
  ): boolean {
    for (const i of included) {
      if (including.includes(i)) {
        return true;
      }
    }
    return false;
  }
}

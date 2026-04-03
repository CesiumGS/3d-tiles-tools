import sharp from "sharp";
import fs from "fs";
import path from "path";

import { BasisEncoder } from "./BasisEncoder";
import { KtxOptions } from "./KtxOptions";
import { KtxEtc1sOptions } from "./KtxEtc1sOptions";
import { KtxUastcOptions } from "./KtxUastcOptions";
import { KtxError } from "./KtxError";

/**
 * Utility class for converting images into KTX2 format.
 *
 * @internal
 */
export class KtxUtility {
  /**
   * An optional callback that will receive log messages
   */
  private static logCallback: ((value: any) => void) | undefined;

  /**
   * Set the optional callback that will receive log messages containing
   * information about the encoded image and encoding options.
   *
   * @param logCallback - The log callback
   */
  static setLogCallback(logCallback: ((value: any) => void) | undefined) {
    KtxUtility.logCallback = logCallback;
  }

  /**
   * Apply KTX compression to the specified input file, and write
   * the result to the specified output file.
   *
   * The exact set of input formats that are supported is not
   * specified, but they include JPG and PNG.
   *
   * @param inputFileName - The input file name
   * @param outputFileName - The output file name
   * @param options - The options for the KTX compression
   * @throws KtxError If the input data could not be read or
   * encoded to KTX
   */
  static async convertImageFile(
    inputFileName: string,
    outputFileName: string,
    options: KtxOptions | undefined
  ): Promise<void> {
    const inputImageData = fs.readFileSync(inputFileName);
    const outputImageData = await KtxUtility.convertImageData(
      inputImageData,
      options
    );
    const outputDirectory = path.dirname(outputFileName);
    if (!fs.existsSync(outputDirectory)) {
      fs.mkdirSync(outputDirectory, { recursive: true });
    }
    fs.writeFileSync(outputFileName, outputImageData);
  }

  /**
   * Apply KTX compression to the given input image data, and return
   * the result as a buffer.
   *
   * The exact set of input formats that are supported is not
   * specified, but they include JPG and PNG.
   *
   * @param inputImageData - The input file name
   * @param options - The options for the KTX compression
   * @returns The KTX compressed data
   * @throws KtxError If the input data could not be read or
   * encoded to KTX
   */
  static async convertImageData(
    inputImageData: Buffer,
    options: KtxOptions | undefined
  ): Promise<Buffer> {
    const image = sharp(inputImageData);
    const metadata = await image.metadata();
    const imageWidth = metadata.width;
    const imageHeight = metadata.height;
    const rgbaPixels = await image
      .toColorspace("srgb")
      .ensureAlpha()
      .raw()
      .toBuffer();
    if (!imageWidth || !imageHeight) {
      throw new KtxError("Could not determine size of image data");
    }
    const result = await KtxUtility.encodeImageData(
      imageWidth,
      imageHeight,
      rgbaPixels,
      options
    );
    return result;
  }

  /**
   * Encode the given RGBA pixels with KTX, and reuturn the
   * result as a buffer.
   *
   * @param imageWidth - The image width
   * @param imageHeight - The image height
   * @param rgbaPixels - The pixels
   * @param options - The options for the KTX compression
   * @returns The KTX data
   * @throws KtxError If the input data could not be
   * encoded to KTX
   */
  private static async encodeImageData(
    imageWidth: number,
    imageHeight: number,
    rgbaPixels: Buffer,
    options: KtxOptions | undefined
  ): Promise<Buffer> {
    const basisEncoder = await BasisEncoder.create();

    if (options) {
      KtxUtility.applyOptions(basisEncoder, options);
    } else {
      const defaultOptions: KtxOptions = {
        uastc: false,
        transferFunction: "SRGB",
        //debug: true,
      };
      KtxUtility.applyOptions(basisEncoder, defaultOptions);
    }

    basisEncoder.setSliceSourceImage(
      0,
      rgbaPixels,
      imageWidth,
      imageHeight,
      false
    );

    // Allocate a buffer that should be large enough to hold the
    // encoded data.
    // NOTE: The example code for the basis encoder pragmatically says that
    // > "If this buffer isn't large enough compression will fail"
    // There doesn't seem to be a way to determine (or even just estimate)
    // the required size. A base size of `w*h*4` (for RGBA pixels) sounds
    // reasonable, with a factor of `* 2` to be safe...
    const basisData = new Uint8Array(imageWidth * imageHeight * 4 * 2);

    const logCallback = KtxUtility.logCallback;
    if (logCallback !== undefined) {
      logCallback(`Encoding ${imageWidth}x${imageHeight} pixels to KTX`);
      logCallback(`Encoding options: ${JSON.stringify(options)}`);
    }

    const resultSize = basisEncoder.encode(basisData);
    basisEncoder.delete();
    if (resultSize === 0) {
      throw new KtxError("Could not encode image data to KTX");
    }

    const result = Buffer.from(basisData.subarray(0, resultSize));

    if (logCallback !== undefined) {
      logCallback(`Encoding ${imageWidth}x${imageHeight} pixels to KTX DONE`);
    }

    return result;
  }

  /**
   * Apply the given options to the given encoder.
   *
   * Depending on whether `options.uastc` is true, this will
   * delegate to `applyUastcOptions` or `applyEtc1sOptions`
   *
   * @param basisEncoder - The `BasisEncoder`
   * @param options - The options
   */
  private static applyOptions(basisEncoder: BasisEncoder, options: KtxOptions) {
    basisEncoder.setCreateKTX2File(true);
    basisEncoder.setKTX2UASTCSupercompression(true);
    basisEncoder.setMipGen(false);

    // These should be the default, but have to be set explicitly
    basisEncoder.setMaxSelectorClusters(512);
    basisEncoder.setMaxEndpointClusters(512);

    if (options.computeStats !== undefined) {
      basisEncoder.setComputeStats(options.computeStats);
    }
    if (options.debug !== undefined) {
      basisEncoder.setDebug(options.debug);
    }

    if (options.uastc) {
      basisEncoder.setUASTC(true);
      KtxUtility.applyUastcOptions(basisEncoder, options);
    } else {
      basisEncoder.setUASTC(false);
      KtxUtility.applyEtc1sOptions(basisEncoder, options);
    }
  }

  /**
   * Apply the given UASTC compression options to the given encoder.
   *
   * @param basisEncoder - The `BasisEncoder`
   * @param options - The options
   */
  private static applyUastcOptions(
    basisEncoder: BasisEncoder,
    options: KtxUastcOptions
  ) {
    if (options.level !== undefined) {
      basisEncoder.setPackUASTCFlags(options.level);
    }
    if (options.rdo_l !== undefined) {
      basisEncoder.setRDOUASTCQualityScalar(options.rdo_l);
    }
    if (options.rdo_d !== undefined) {
      basisEncoder.setRDOUASTCDictSize(options.rdo_d);
    }
    if (options.transferFunction !== undefined) {
      if (options.transferFunction === "SRGB") {
        basisEncoder.setPerceptual(true);
        basisEncoder.setMipSRGB(true);
        basisEncoder.setKTX2SRGBTransferFunc(true);
      } else {
        basisEncoder.setPerceptual(false);
        basisEncoder.setMipSRGB(false);
        basisEncoder.setKTX2SRGBTransferFunc(false);
      }
    }
    if (options.zstd !== undefined) {
      // This is only a flag in the JS wrapper:
      basisEncoder.setKTX2UASTCSupercompression(true);
    }
  }

  /**
   * Apply the given ETC1S compression options to the given encoder.
   *
   * @param basisEncoder - The `BasisEncoder`
   * @param options - The options
   */
  private static applyEtc1sOptions(
    basisEncoder: BasisEncoder,
    options: KtxEtc1sOptions
  ) {
    if (options.compressionLevel !== undefined) {
      basisEncoder.setCompressionLevel(options.compressionLevel);
    }
    if (options.qualityLevel !== undefined) {
      basisEncoder.setQualityLevel(options.qualityLevel);
    }
    if (options.transferFunction !== undefined) {
      if (options.transferFunction === "SRGB") {
        basisEncoder.setPerceptual(true);
        basisEncoder.setMipSRGB(true);
        basisEncoder.setKTX2SRGBTransferFunc(true);
      } else {
        basisEncoder.setPerceptual(false);
        basisEncoder.setMipSRGB(false);
        basisEncoder.setKTX2SRGBTransferFunc(false);
      }
    }
  }
}

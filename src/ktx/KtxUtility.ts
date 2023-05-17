import sharp from "sharp";
import fs from "fs";
import path from "path";

import { DataError } from "../base/DataError";
import { BasisEncoder } from "./BasisEncoder";

export class KtxUtility {
  private static basisEncoder: BasisEncoder;

  static async convertImageFile(
    inputFileName: string,
    outputFileName: string,
    options: any
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

  static async convertImageData(
    inputImageData: Buffer,
    options: any
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
      throw new DataError("Could not determine size of image data");
    }
    const result = await KtxUtility.encodeImageDataUnchecked(
      imageWidth,
      imageHeight,
      rgbaPixels,
      options
    );
    return result;
  }

  private static async encodeImageDataUnchecked(
    imageWidth: number,
    imageHeight: number,
    rgbaPixels: Buffer,
    options: any
  ): Promise<Buffer> {
    if (!KtxUtility.basisEncoder) {
      KtxUtility.basisEncoder = await BasisEncoder.create();
    }
    const basisEncoder = KtxUtility.basisEncoder;

    const perceptual = options.perceptual ?? false;
    const qualityLevel = options.qualityLevel ?? 10;

    basisEncoder.setSliceSourceImage(
      0,
      rgbaPixels,
      imageWidth,
      imageHeight,
      false
    );

    basisEncoder.setCreateKTX2File(true);
    basisEncoder.setKTX2UASTCSupercompression(true);
    basisEncoder.setKTX2SRGBTransferFunc(true);
    basisEncoder.setUASTC(false);
    basisEncoder.setMipGen(false);

    basisEncoder.setPerceptual(perceptual);
    basisEncoder.setMipSRGB(perceptual);
    basisEncoder.setQualityLevel(qualityLevel);

    const basisData = new Uint8Array(imageWidth * imageHeight * 4);
    const resultSize = basisEncoder.encode(basisData);
    const result = Buffer.from(basisData.subarray(0, resultSize));
    return result;
  }
}

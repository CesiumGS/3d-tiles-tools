import { Iterables } from "../base/Iterables";
import { PntsFeatureTable } from "../structure/TileFormats/PntsFeatureTable";
import { TileFormatError } from "../tileFormats/TileFormatError";
import { AttributeCompression } from "./AttributeCompression";
import { TileTableData } from "./TileTableData";

export class PntsData {
  static createPositions(
    featureTable: PntsFeatureTable,
    binary: Buffer
  ): IterableIterator<number[]> {
    const numPoints = featureTable.POINTS_LENGTH;
    if (featureTable.POSITION) {
      const byteOffset = featureTable.POSITION.byteOffset;
      return PntsData.createPositionsInternal(binary, byteOffset, numPoints);
    }

    if (featureTable.POSITION_QUANTIZED) {
      if (!featureTable.QUANTIZED_VOLUME_OFFSET) {
        throw new TileFormatError(
          "The feature table contains POSITION_QUANTIZED, but no QUANTIZED_VOLUME_OFFSET"
        );
      }
      if (!featureTable.QUANTIZED_VOLUME_SCALE) {
        throw new TileFormatError(
          "The feature table contains POSITION_QUANTIZED, but no QUANTIZED_VOLUME_SCALE"
        );
      }
      const volumeOffset = TileTableData.obtainNumberArray(
        binary,
        featureTable.QUANTIZED_VOLUME_OFFSET,
        3,
        "FLOAT32"
      );
      console.log("volumeOffset is " + volumeOffset);
      const volumeScale = TileTableData.obtainNumberArray(
        binary,
        featureTable.QUANTIZED_VOLUME_SCALE,
        3,
        "FLOAT32"
      );
      console.log("volumeScale is " + volumeScale);

      const byteOffset = featureTable.POSITION_QUANTIZED.byteOffset;
      const quantizedPositions = PntsData.createQuantizedPositionsInternal(
        binary,
        byteOffset,
        numPoints
      );
      const dequantization = PntsData.createDequantization(
        volumeOffset,
        volumeScale
      );
      return Iterables.map(quantizedPositions, dequantization);
    }

    throw new TileFormatError(
      "The feature table contains neither POSITION nor POSITION_QUANTIZED"
    );
  }

  static createNormals(
    featureTable: PntsFeatureTable,
    binary: Buffer
  ): IterableIterator<number[]> | undefined {
    const numPoints = featureTable.POINTS_LENGTH;
    if (featureTable.NORMAL) {
      const byteOffset = featureTable.NORMAL.byteOffset;
      return PntsData.createNormalsInternal(binary, byteOffset, numPoints);
    }

    if (featureTable.NORMAL_OCT16P) {
      const byteOffset = featureTable.NORMAL_OCT16P.byteOffset;
      const octEncodedNormals = PntsData.createOctEncodedNormalsInternal(
        binary,
        byteOffset,
        numPoints
      );
      const normals = Iterables.map(
        octEncodedNormals,
        AttributeCompression.octDecode
      );
      return normals;
    }
    return undefined;
  }

  static createColors(
    featureTable: PntsFeatureTable,
    binary: Buffer
  ): IterableIterator<number[]> | undefined {
    const numPoints = featureTable.POINTS_LENGTH;
    if (featureTable.RGB) {
      const byteOffset = featureTable.RGB.byteOffset;
      const colorsRGB = PntsData.createColorsRgbInternal(
        binary,
        byteOffset,
        numPoints
      );
      const colorsRGBA = Iterables.map(colorsRGB, PntsData.rgbToRgba);
      const colors = Iterables.map(colorsRGBA, PntsData.bytesToFloats);
      return colors;
    }
    if (featureTable.RGBA) {
      const byteOffset = featureTable.RGBA.byteOffset;
      const colorsRGBA = PntsData.createColorsRgbaInternal(
        binary,
        byteOffset,
        numPoints
      );
      const colors = Iterables.map(colorsRGBA, PntsData.bytesToFloats);
      return colors;
    }
    if (featureTable.RGB565) {
      const byteOffset = featureTable.RGB565.byteOffset;
      const colorsRGB565 = PntsData.createColorsRgb656Internal(
        binary,
        byteOffset,
        numPoints
      );
      const colors = Iterables.map(
        colorsRGB565,
        AttributeCompression.decodeRGB565ToRGBA
      );
      return colors;
    }
    return undefined;
  }

  private static createArrayIterableInternal(
    binary: Buffer,
    byteOffset: number,
    numPoints: number,
    legacyType: string,
    legacyComponentType: string
  ): IterableIterator<number[]> {
    const propertyModel = TileTableData.createPropertyModel(
      legacyType,
      legacyComponentType,
      byteOffset,
      binary
    );
    return TileTableData.createArrayIterable(propertyModel, numPoints);
  }

  private static createScalarIterableInternal(
    binary: Buffer,
    byteOffset: number,
    numPoints: number,
    legacyType: string,
    legacyComponentType: string
  ): IterableIterator<number> {
    const propertyModel = TileTableData.createPropertyModel(
      legacyType,
      legacyComponentType,
      byteOffset,
      binary
    );
    return TileTableData.createScalarIterable(propertyModel, numPoints);
  }

  private static createPositionsInternal(
    binary: Buffer,
    byteOffset: number,
    numPoints: number
  ): IterableIterator<number[]> {
    const legacyType = "VEC3";
    const legacyComponentType = "FLOAT";
    return PntsData.createArrayIterableInternal(
      binary,
      byteOffset,
      numPoints,
      legacyType,
      legacyComponentType
    );
  }
  private static createNormalsInternal(
    binary: Buffer,
    byteOffset: number,
    numPoints: number
  ): IterableIterator<number[]> {
    const legacyType = "VEC3";
    const legacyComponentType = "FLOAT";
    return PntsData.createArrayIterableInternal(
      binary,
      byteOffset,
      numPoints,
      legacyType,
      legacyComponentType
    );
  }

  private static createQuantizedPositionsInternal(
    binary: Buffer,
    byteOffset: number,
    numPoints: number
  ): IterableIterator<number[]> {
    const legacyType = "VEC3";
    const legacyComponentType = "UNSIGNED_SHORT";
    return PntsData.createArrayIterableInternal(
      binary,
      byteOffset,
      numPoints,
      legacyType,
      legacyComponentType
    );
  }

  private static createOctEncodedNormalsInternal(
    binary: Buffer,
    byteOffset: number,
    numPoints: number
  ): IterableIterator<number[]> {
    const legacyType = "VEC2";
    const legacyComponentType = "UNSIGNED_SHORT";
    return PntsData.createArrayIterableInternal(
      binary,
      byteOffset,
      numPoints,
      legacyType,
      legacyComponentType
    );
  }

  private static createColorsRgbInternal(
    binary: Buffer,
    byteOffset: number,
    numPoints: number
  ): IterableIterator<number[]> {
    const legacyType = "VEC3";
    const legacyComponentType = "UNSIGNED_BYTE";
    return PntsData.createArrayIterableInternal(
      binary,
      byteOffset,
      numPoints,
      legacyType,
      legacyComponentType
    );
  }

  private static createColorsRgbaInternal(
    binary: Buffer,
    byteOffset: number,
    numPoints: number
  ): IterableIterator<number[]> {
    const legacyType = "VEC3";
    const legacyComponentType = "UNSIGNED_BYTE";
    return PntsData.createArrayIterableInternal(
      binary,
      byteOffset,
      numPoints,
      legacyType,
      legacyComponentType
    );
  }

  private static createColorsRgb656Internal(
    binary: Buffer,
    byteOffset: number,
    numPoints: number
  ): IterableIterator<number> {
    const legacyType = "SCALAR";
    const legacyComponentType = "UNSIGNED_SHORT";
    return PntsData.createScalarIterableInternal(
      binary,
      byteOffset,
      numPoints,
      legacyType,
      legacyComponentType
    );
  }

  private static createDequantization(
    volumeOffset: number[],
    volumeScale: number[]
  ) {
    // POSITION = POSITION_QUANTIZED * QUANTIZED_VOLUME_SCALE / 65535.0 + QUANTIZED_VOLUME_OFFSET
    const scaleX = volumeScale[0] / 65535.0;
    const scaleY = volumeScale[1] / 65535.0;
    const scaleZ = volumeScale[2] / 65535.0;
    const offsetX = volumeOffset[0];
    const offsetY = volumeOffset[1];
    const offsetZ = volumeOffset[2];
    return (input: number[]) => {
      const output = [
        input[0] * scaleX + offsetX,
        input[1] * scaleY + offsetY,
        input[2] * scaleZ + offsetZ,
      ];
      return output;
    };
  }

  static bytesToFloats(input: number[]): number[] {
    return input.map((b) => b / 255.0);
  }

  private static rgbToRgba(input: number[]): number[] {
    const result = input.slice();
    result.push(255);
    return result;
  }
}

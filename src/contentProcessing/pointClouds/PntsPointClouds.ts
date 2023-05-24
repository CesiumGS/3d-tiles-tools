import { Iterables } from "../../base/Iterables";
import { PntsFeatureTable } from "../../structure/TileFormats/PntsFeatureTable";
import { TileFormatError } from "../../tileFormats/TileFormatError";
import { AttributeCompression } from "./AttributeCompression";
import { DefaultPointCloud } from "./DefaultPointCloud";
import { PointCloudReader } from "./PointCloudReader";
import { TileTableData } from "../TileTableData";

export class PntsPointClouds {
  static create(
    featureTable: PntsFeatureTable,
    binary: Buffer
  ): PointCloudReader {
    const positions = PntsPointClouds.createPositions(featureTable, binary);
    const normals = PntsPointClouds.createNormals(featureTable, binary);
    const colors = PntsPointClouds.createColors(featureTable, binary);
    const globalColor = PntsPointClouds.createGlobalColor(featureTable, binary);

    const pointCloud = new DefaultPointCloud();
    pointCloud.addPositions(positions);
    if (normals) {
      pointCloud.addNormals(normals);
    }
    if (colors) {
      pointCloud.addColors(colors);
    }
    if (globalColor) {
      pointCloud.setGlobalColor(
        globalColor[0],
        globalColor[1],
        globalColor[2],
        globalColor[3]
      );
    }
    return pointCloud;
  }

  private static createPositions(
    featureTable: PntsFeatureTable,
    binary: Buffer
  ): Iterable<number[]> {
    const numPoints = featureTable.POINTS_LENGTH;
    if (featureTable.POSITION) {
      const byteOffset = featureTable.POSITION.byteOffset;
      return PntsPointClouds.createPositionsInternal(
        binary,
        byteOffset,
        numPoints
      );
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
      const volumeScale = TileTableData.obtainNumberArray(
        binary,
        featureTable.QUANTIZED_VOLUME_SCALE,
        3,
        "FLOAT32"
      );

      const byteOffset = featureTable.POSITION_QUANTIZED.byteOffset;
      const quantizedPositions =
        PntsPointClouds.createQuantizedPositionsInternal(
          binary,
          byteOffset,
          numPoints
        );
      const dequantization = PntsPointClouds.createDequantization(
        volumeOffset,
        volumeScale
      );
      return Iterables.map(quantizedPositions, dequantization);
    }

    throw new TileFormatError(
      "The feature table contains neither POSITION nor POSITION_QUANTIZED"
    );
  }

  private static createNormals(
    featureTable: PntsFeatureTable,
    binary: Buffer
  ): Iterable<number[]> | undefined {
    const numPoints = featureTable.POINTS_LENGTH;
    if (featureTable.NORMAL) {
      const byteOffset = featureTable.NORMAL.byteOffset;
      return PntsPointClouds.createNormalsInternal(
        binary,
        byteOffset,
        numPoints
      );
    }

    if (featureTable.NORMAL_OCT16P) {
      const byteOffset = featureTable.NORMAL_OCT16P.byteOffset;
      const octEncodedNormals = PntsPointClouds.createOctEncodedNormalsInternal(
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

  private static createColors(
    featureTable: PntsFeatureTable,
    binary: Buffer
  ): Iterable<number[]> | undefined {
    const numPoints = featureTable.POINTS_LENGTH;
    if (featureTable.RGB) {
      const byteOffset = featureTable.RGB.byteOffset;
      const colorsRGB = PntsPointClouds.createColorsRgbInternal(
        binary,
        byteOffset,
        numPoints
      );
      const colorsRGBA = Iterables.map(colorsRGB, PntsPointClouds.rgbToRgba);
      const colors = Iterables.map(colorsRGBA, PntsPointClouds.bytesToFloats);
      return colors;
    }
    if (featureTable.RGBA) {
      const byteOffset = featureTable.RGBA.byteOffset;
      const colorsRGBA = PntsPointClouds.createColorsRgbaInternal(
        binary,
        byteOffset,
        numPoints
      );
      const colors = Iterables.map(colorsRGBA, PntsPointClouds.bytesToFloats);
      return colors;
    }
    if (featureTable.RGB565) {
      const byteOffset = featureTable.RGB565.byteOffset;
      const colorsRGB565 = PntsPointClouds.createColorsRgb656Internal(
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

  private static createGlobalColor(
    featureTable: PntsFeatureTable,
    binary: Buffer
  ): [number, number, number, number] | undefined {
    if (!featureTable.CONSTANT_RGBA) {
      return undefined;
    }
    const constantRgba = TileTableData.obtainNumberArray(
      binary,
      featureTable.CONSTANT_RGBA,
      4,
      "UNSIGNED_BYTE"
    );
    const rgba = PntsPointClouds.bytesToFloats(constantRgba);
    return [rgba[0], rgba[1], rgba[2], rgba[3]];
  }

  private static createArrayIterableInternal(
    binary: Buffer,
    byteOffset: number,
    numPoints: number,
    legacyType: string,
    legacyComponentType: string
  ): Iterable<number[]> {
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
  ): Iterable<number> {
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
  ): Iterable<number[]> {
    const legacyType = "VEC3";
    const legacyComponentType = "FLOAT";
    return PntsPointClouds.createArrayIterableInternal(
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
  ): Iterable<number[]> {
    const legacyType = "VEC3";
    const legacyComponentType = "FLOAT";
    return PntsPointClouds.createArrayIterableInternal(
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
  ): Iterable<number[]> {
    const legacyType = "VEC3";
    const legacyComponentType = "UNSIGNED_SHORT";
    return PntsPointClouds.createArrayIterableInternal(
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
  ): Iterable<number[]> {
    const legacyType = "VEC2";
    const legacyComponentType = "UNSIGNED_SHORT";
    return PntsPointClouds.createArrayIterableInternal(
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
  ): Iterable<number[]> {
    const legacyType = "VEC3";
    const legacyComponentType = "UNSIGNED_BYTE";
    return PntsPointClouds.createArrayIterableInternal(
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
  ): Iterable<number[]> {
    const legacyType = "VEC4";
    const legacyComponentType = "UNSIGNED_BYTE";
    return PntsPointClouds.createArrayIterableInternal(
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
  ): Iterable<number> {
    const legacyType = "SCALAR";
    const legacyComponentType = "UNSIGNED_SHORT";
    return PntsPointClouds.createScalarIterableInternal(
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

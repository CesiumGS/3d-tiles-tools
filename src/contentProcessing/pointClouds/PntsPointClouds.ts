import { Iterables } from "../../base/Iterables";

import { PntsFeatureTable } from "../../structure/TileFormats/PntsFeatureTable";

import { TileFormatError } from "../../tileFormats/TileFormatError";

import { AttributeCompression } from "./AttributeCompression";
import { DefaultPointCloud } from "./DefaultPointCloud";
import { ReadablePointCloud } from "./ReadablePointCloud";
import { TileTableData } from "../TileTableData";
import { Colors } from "./Colors";

export class PntsPointClouds {
  static create(
    featureTable: PntsFeatureTable,
    binary: Buffer
  ): ReadablePointCloud {
    const positions = PntsPointClouds.createPositions(featureTable, binary);
    const normals = PntsPointClouds.createNormals(featureTable, binary);
    const colors = PntsPointClouds.createNormalizedLinearColors(
      featureTable,
      binary
    );
    const globalColor = PntsPointClouds.createGlobalNormalizedLinearColor(
      featureTable,
      binary
    );

    const pointCloud = new DefaultPointCloud();
    pointCloud.setPositions(positions);
    if (normals) {
      pointCloud.setNormals(normals);
    }
    if (colors) {
      pointCloud.setNormalizedLinearColors(colors);
    }
    if (globalColor) {
      pointCloud.setNormalizedLinearGlobalColor(
        globalColor[0],
        globalColor[1],
        globalColor[2],
        globalColor[3]
      );
    }

    PntsPointClouds.assignBatchIdsAsAttribute(featureTable, binary, pointCloud);

    return pointCloud;
  }

  private static assignBatchIdsAsAttribute(
    featureTable: PntsFeatureTable,
    binary: Buffer,
    pointCloud: DefaultPointCloud
  ) {
    const batchId = featureTable.BATCH_ID;
    if (!batchId) {
      return;
    }
    const batchLength = featureTable.BATCH_LENGTH;
    if (batchLength === undefined) {
      throw new TileFormatError("Found BATCH_ID but no BATCH_LENGTH");
    }
    const legacyComponentType = batchId.componentType ?? "UNSIGNED_SHORT";
    const componentType =
      TileTableData.convertLegacyComponentTypeToComponentType(
        legacyComponentType
      );
    const batchIds = TileTableData.createScalarIterable(
      binary,
      batchId.byteOffset,
      featureTable.POINTS_LENGTH,
      "SCALAR",
      legacyComponentType
    );
    pointCloud.addAttribute("_FEATURE_ID_0", "SCALAR", componentType, batchIds);
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

  private static createNormalizedLinearColors(
    featureTable: PntsFeatureTable,
    binary: Buffer
  ): Iterable<number[]> | undefined {
    const numPoints = featureTable.POINTS_LENGTH;
    if (featureTable.RGB) {
      const byteOffset = featureTable.RGB.byteOffset;
      const colorsStandardRGB = PntsPointClouds.createColorsStandardRGBInternal(
        binary,
        byteOffset,
        numPoints
      );
      const colorsNormalizedLinearRGBA = Iterables.map(
        colorsStandardRGB,
        Colors.standardRGBToNormalizedLinearRGBA
      );
      return colorsNormalizedLinearRGBA;
    }
    if (featureTable.RGBA) {
      const byteOffset = featureTable.RGBA.byteOffset;
      const colorsStandardRGBA =
        PntsPointClouds.createColorsStandardRGBAInternal(
          binary,
          byteOffset,
          numPoints
        );
      const colorsNormalizedLinearRGBA = Iterables.map(
        colorsStandardRGBA,
        Colors.standardRGBAToNormalizedLinearRGBA
      );
      return colorsNormalizedLinearRGBA;
    }
    if (featureTable.RGB565) {
      const byteOffset = featureTable.RGB565.byteOffset;
      const colorsStandardRGB565 =
        PntsPointClouds.createColorsStandardRGB656Internal(
          binary,
          byteOffset,
          numPoints
        );
      const colorsNormalizedLinearRGBA = Iterables.map(
        colorsStandardRGB565,
        Colors.standardRGB565ToNormalizedLinearRGBA
      );
      return colorsNormalizedLinearRGBA;
    }
    return undefined;
  }

  private static createGlobalNormalizedLinearColor(
    featureTable: PntsFeatureTable,
    binary: Buffer
  ): [number, number, number, number] | undefined {
    if (!featureTable.CONSTANT_RGBA) {
      return undefined;
    }
    const constantRGBA = TileTableData.obtainNumberArray(
      binary,
      featureTable.CONSTANT_RGBA,
      4,
      "UNSIGNED_BYTE"
    );
    const normalizedLinearRGBA =
      Colors.standardRGBAToNormalizedLinearRGBA(constantRGBA);
    return [
      normalizedLinearRGBA[0],
      normalizedLinearRGBA[1],
      normalizedLinearRGBA[2],
      normalizedLinearRGBA[3],
    ];
  }

  private static createPositionsInternal(
    binary: Buffer,
    byteOffset: number,
    numPoints: number
  ): Iterable<number[]> {
    const legacyType = "VEC3";
    const legacyComponentType = "FLOAT";
    return TileTableData.createArrayIterable(
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
    return TileTableData.createArrayIterable(
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
    return TileTableData.createArrayIterable(
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
    return TileTableData.createArrayIterable(
      binary,
      byteOffset,
      numPoints,
      legacyType,
      legacyComponentType
    );
  }

  private static createColorsStandardRGBInternal(
    binary: Buffer,
    byteOffset: number,
    numPoints: number
  ): Iterable<number[]> {
    const legacyType = "VEC3";
    const legacyComponentType = "UNSIGNED_BYTE";
    return TileTableData.createArrayIterable(
      binary,
      byteOffset,
      numPoints,
      legacyType,
      legacyComponentType
    );
  }

  private static createColorsStandardRGBAInternal(
    binary: Buffer,
    byteOffset: number,
    numPoints: number
  ): Iterable<number[]> {
    const legacyType = "VEC4";
    const legacyComponentType = "UNSIGNED_BYTE";
    return TileTableData.createArrayIterable(
      binary,
      byteOffset,
      numPoints,
      legacyType,
      legacyComponentType
    );
  }

  private static createColorsStandardRGB656Internal(
    binary: Buffer,
    byteOffset: number,
    numPoints: number
  ): Iterable<number> {
    const legacyType = "SCALAR";
    const legacyComponentType = "UNSIGNED_SHORT";
    return TileTableData.createScalarIterable(
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
  ): (input: number[]) => number[] {
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
}

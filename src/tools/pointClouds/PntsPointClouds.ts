import { Iterables } from "../../base";

import { PntsFeatureTable } from "../../structure";
import { BatchTable } from "../../structure";

import { TileTableData } from "../../tilesets";
import { BatchTables } from "../../tilesets";
import { Colors } from "../../tilesets";
import { TileTableDataPnts } from "../../tilesets";

import { DefaultPointCloud } from "./DefaultPointCloud";
import { ReadablePointCloud } from "./ReadablePointCloud";

import { DracoDecoder } from "../draco/DracoDecoder";
import { DracoDecoderResult } from "../draco/DracoDecoderResult";

/**
 * Methods to create `ReadablePointCloud` instances from PNTS data
 *
 * @internal
 */
export class PntsPointClouds {
  /**
   * Create a `ReadablePointCloud` from the given PNTS data.
   *
   * This will internally take care of the specific representations
   * of data that PNTS can contain, and always return the data in
   * the form that is described in the `ReadablePointCloud` interface.
   *
   * For example, it will decode quantized positions, oct-encoded
   * normals, and the different color representations, and possible
   * Draco compression, and return the plain, uncompressed data.
   *
   * @param featureTable - The PNTS feature table
   * @param featureTableBinary - The PNTS feature table binary
   * @param batchTable - The PNTS batch table
   * @returns A promise to the `ReadablePointCloud`
   */
  static async create(
    featureTable: PntsFeatureTable,
    featureTableBinary: Buffer,
    batchTable: BatchTable
  ): Promise<ReadablePointCloud> {
    const pointCloud = new DefaultPointCloud();
    const numPoints = featureTable.POINTS_LENGTH;

    // If the feature table contains the 3DTILES_draco_point_compression
    // extension, then uncompress the draco data and assign it as the
    // attributes to the point cloud
    const dracoDecoderResult =
      await PntsPointClouds.obtainDracoDecodedAttributes(
        featureTable,
        featureTableBinary,
        batchTable
      );
    if (dracoDecoderResult) {
      PntsPointClouds.assignDracoDecodedAttributes(
        pointCloud,
        numPoints,
        dracoDecoderResult,
        batchTable
      );
    }

    // Note: The attribute information for things like "POSITION" is
    // basically "invalid" when the 3DTILES_draco_point_compression
    // extension is present. So only assign these when they have NOT
    // yet been assigned from the draco-decoded data.

    // Assign the positions
    if (!pointCloud.getAttributeValues("POSITION")) {
      const positions = TileTableData.createPositions(
        featureTable,
        featureTableBinary,
        numPoints
      );
      pointCloud.setPositions(positions);
    }

    // Assign the normals
    if (!pointCloud.getAttributeValues("NORMAL")) {
      const normals = TileTableDataPnts.createNormals(
        featureTable,
        featureTableBinary,
        numPoints
      );
      if (normals) {
        pointCloud.setNormals(normals);
      }
    }

    // Assign the colors
    if (!pointCloud.getAttributeValues("COLOR_0")) {
      const colors = TileTableDataPnts.createNormalizedLinearColors(
        featureTable,
        featureTableBinary,
        numPoints
      );
      if (colors) {
        pointCloud.setNormalizedLinearColors(colors);
      }
    }

    // Assign the batch IDs as the "_FEATURE_ID_0" attribute
    if (!pointCloud.getAttributeValues("_FEATURE_ID_0")) {
      const batchIds = TileTableDataPnts.createBatchIds(
        featureTable,
        featureTableBinary
      );
      if (batchIds) {
        const componentType =
          TileTableData.obtainBatchIdComponentType(featureTable);
        if (componentType) {
          pointCloud.addAttribute(
            "_FEATURE_ID_0",
            "SCALAR",
            componentType,
            batchIds
          );
        }
      }
    }

    // According to the specification, the global color is only considered
    // when no other color information is present
    if (!pointCloud.getAttributeValues("COLOR_0")) {
      // Assign the global color (from CONSTANT_RGBA)
      const globalColor = TileTableDataPnts.createGlobalNormalizedLinearColor(
        featureTable,
        featureTableBinary
      );
      pointCloud.setNormalizedLinearGlobalColor(globalColor);
    }

    // Compute the "global position", including the RTC_CENTER
    // and the quantization offset, if present
    const globalPosition = TileTableData.obtainGlobalPosition(
      featureTable,
      featureTableBinary
    );
    pointCloud.setGlobalPosition(globalPosition);

    return pointCloud;
  }

  /**
   * Returns whether the color information of the point cloud with the
   * given PNTS feature table MAY require an alpha component.
   *
   * This is true for RGBA or CONSTANT_RGBA point clouds, and
   * false otherwise.
   *
   * @param featureTable - The PNTS feature table
   * @returns Whether the point cloud may require an alpha component
   */
  static mayRequireAlpha(featureTable: PntsFeatureTable) {
    // Check the color information presence in the order of prececenc:
    // RGBA, RGB, RGB565, then CONSTANT_RGBA
    if (featureTable.RGBA) {
      return true;
    }
    if (featureTable.RGB) {
      return false;
    }
    if (featureTable.RGB565) {
      return false;
    }
    if (featureTable.CONSTANT_RGBA) {
      return true;
    }
    return false;
  }

  /**
   * Returns whether the point cloud has quantzized positions
   *
   * @param featureTable - The PNTS feature table
   * @returns Whether the point cloud has quantized positions
   */
  static hasQuantizedPositions(featureTable: PntsFeatureTable): boolean {
    if (featureTable.POSITION_QUANTIZED) {
      return true;
    }
    return false;
  }

  /**
   * Returns whether the point cloud has oct-encoded normals
   *
   * @param featureTable - The PNTS feature table
   * @returns Whether the point cloud normals are oct-encoded
   */
  static hasOctEncodedNormals(featureTable: PntsFeatureTable): boolean {
    if (featureTable.NORMAL_OCT16P) {
      return true;
    }
    return false;
  }

  /**
   * If the given feature table defines the 3DTILES_draco_point_compression
   * extension, then decode that data and return it as a `DracoDecoderResult`.
   *
   * The decoded result will include possible draco-encoded properties from
   * the batch table.
   *
   * @param featureTable - The PNTS feature table
   * @param featureTableBinary - The feature table binary
   * @param batchTable - The batch table
   * @returns The `DracoDecoderResult`, or `undefined`
   */
  private static async obtainDracoDecodedAttributes(
    featureTable: PntsFeatureTable,
    featureTableBinary: Buffer,
    batchTable: BatchTable
  ): Promise<DracoDecoderResult | undefined> {
    if (!featureTable.extensions) {
      return undefined;
    }
    const featureTableExtension =
      featureTable.extensions["3DTILES_draco_point_compression"];
    if (!featureTableExtension) {
      return undefined;
    }

    // Collect information about all Draco-encoded properties:
    // These are the properties that are listed in the
    // 3DTILES_draco_point_compression extension of the
    // feature table AND those listed in the extension
    // in the batch table
    const allProperties: { [key: string]: number } = {};
    Object.assign(allProperties, featureTableExtension.properties);
    Object.assign(allProperties, BatchTables.obtainDracoProperties(batchTable));

    const dracoDecoder = await DracoDecoder.create();
    const arrayStart = featureTableExtension.byteOffset;
    const arrayEnd = arrayStart + featureTableExtension.byteLength;
    const buffer = featureTableBinary.subarray(arrayStart, arrayEnd);
    const decoded = dracoDecoder.decodePointCloud(allProperties, buffer);
    return decoded;
  }

  /**
   * Go through all attributes in the given `DracoDecoderResult`,
   * and assign them as attributes to the given point cloud.
   *
   * @param pointCloud - The (default) point cloud to assign the attributes to
   * @param numPoints - The number of points
   * @param dracoDecoderResult - The `DracoDecoderResult` that contains the
   * decoded attributes
   * @param batchTable - The batch table
   */
  private static assignDracoDecodedAttributes(
    pointCloud: DefaultPointCloud,
    numPoints: number,
    dracoDecoderResult: DracoDecoderResult,
    batchTable: BatchTable
  ) {
    // Assign the positions, if present
    const dracoPositions = dracoDecoderResult["POSITION"];
    if (dracoPositions) {
      const positions = TileTableData.createPositionsFromBinary(
        dracoPositions.attributeData,
        dracoPositions.attributeInfo.byteOffset,
        numPoints
      );
      pointCloud.setPositions(positions);
    }

    // Assign the normals, if present
    const dracoNormals = dracoDecoderResult["NORMAL"];
    if (dracoNormals) {
      const normals = TileTableDataPnts.createNormalsFromBinary(
        dracoNormals.attributeData,
        dracoNormals.attributeInfo.byteOffset,
        numPoints
      );
      pointCloud.setNormals(normals);
    }

    // Assign the colors, from RGB or RGBA data, if present
    const dracoRGB = dracoDecoderResult["RGB"];
    if (dracoRGB) {
      const colorsStandardRGB =
        TileTableDataPnts.createColorsStandardRGBFromBinary(
          dracoRGB.attributeData,
          dracoRGB.attributeInfo.byteOffset,
          numPoints
        );
      const colorsNormalizedLinearRGBA = Iterables.map(
        colorsStandardRGB,
        Colors.standardRGBToNormalizedLinearRGBA
      );
      pointCloud.setNormalizedLinearColors(colorsNormalizedLinearRGBA);
    }
    const dracoRGBA = dracoDecoderResult["RGBA"];
    if (dracoRGBA) {
      const colorsStandardRGBA =
        TileTableDataPnts.createColorsStandardRGBAFromBinary(
          dracoRGBA.attributeData,
          dracoRGBA.attributeInfo.byteOffset,
          numPoints
        );
      const colorsNormalizedLinearRGBA = Iterables.map(
        colorsStandardRGBA,
        Colors.standardRGBAToNormalizedLinearRGBA
      );
      pointCloud.setNormalizedLinearColors(colorsNormalizedLinearRGBA);
    }

    // Assign the BATCH_ID values as the `_FEATURE_ID_0` attribute, if present
    const dracoBatchId = dracoDecoderResult["BATCH_ID"];
    if (dracoBatchId) {
      const legacyComponentType = dracoBatchId.attributeInfo.componentDatatype;
      const batchIds = TileTableData.createBatchIdsFromBinary(
        dracoBatchId.attributeData,
        dracoBatchId.attributeInfo.byteOffset,
        legacyComponentType,
        numPoints
      );
      const componentType =
        TileTableData.convertLegacyComponentTypeToComponentType(
          legacyComponentType
        );
      pointCloud.addAttribute(
        "_FEATURE_ID_0",
        "SCALAR",
        componentType,
        batchIds
      );
    }

    // The batch table may contain a 3DTILES_draco_point_compression
    // extension object that defines batch table properties that are
    // draco-compressed. The decoded values of these properties will
    // be part of the dracoDecoderResult, and put into the point
    // cloud as generic attributes here.
    const dracoPropertyNames = BatchTables.obtainDracoPropertyNames(batchTable);
    for (const propertyName of dracoPropertyNames) {
      const dracoProperty = dracoDecoderResult[propertyName];
      if (dracoProperty) {
        const propertyValue = batchTable[propertyName];
        if (TileTableData.isBatchTableBinaryBodyReference(propertyValue)) {
          const legacyType = propertyValue.type;
          const legacyComponentType =
            dracoProperty.attributeInfo.componentDatatype;
          const prpertyValues = TileTableData.createNumericScalarIterable(
            legacyType,
            legacyComponentType,
            dracoProperty.attributeData,
            dracoProperty.attributeInfo.byteOffset,
            numPoints
          );
          const type = TileTableData.convertLegacyTypeToType(legacyType);
          const componentType =
            TileTableData.convertLegacyComponentTypeToComponentType(
              legacyComponentType
            );
          pointCloud.addAttribute(
            propertyName,
            type,
            componentType,
            prpertyValues
          );
        }
      }
    }
  }
}

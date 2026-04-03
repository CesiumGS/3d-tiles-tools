import { Iterables } from "../../base";

import { PropertyModel } from "../../metadata";
import { PropertyModels } from "../../metadata";
import { NumericBuffers } from "../../metadata";
import { NumericPropertyModel } from "../../metadata";

import { BatchTableBinaryBodyReference } from "../../structure";
import { BinaryBodyOffset } from "../../structure";
import { I3dmFeatureTable } from "../../structure";
import { PntsFeatureTable } from "../../structure";

import { TileFormatError } from "../tileFormats/TileFormatError";

/**
 * Methods to access the data that is stored in batch- or feature tables
 * of the legacy tile formats in a generic form.
 *
 * @internal
 */
export class TileTableData {
  /**
   * Create the position data from the given feature table data.
   *
   * This will return the POSITION or POSITION_QUANTIZED data
   * as an iterable over 3D float arrays. The actual positions
   * of the returned will be relative to the position
   * that is returned by `obtainGlobalPosition`
   *
   * @param featureTable - The feature table
   * @param binary - The feature table binary
   * @param numPositions - The number of positions
   * @returns The the iterable over the data
   * @throws TileFormatError If the given feature table contains
   * neither a POSITION nor a POSITION_QUANTIZED
   */
  static createPositions(
    featureTable: PntsFeatureTable | I3dmFeatureTable,
    binary: Buffer,
    numPositions: number
  ): Iterable<number[]> {
    if (featureTable.POSITION) {
      const byteOffset = featureTable.POSITION.byteOffset;
      return TileTableData.createPositionsFromBinary(
        binary,
        byteOffset,
        numPositions
      );
    }

    if (featureTable.POSITION_QUANTIZED) {
      const quantization = TileTableData.obtainQuantizationOffsetScale(
        featureTable,
        binary
      );

      if (!quantization) {
        throw new TileFormatError(
          `The feature table contains POSITION_QUANTIZED, but not ` +
            `QUANTIZED_VOLUME_OFFSET and QUANTIZED_VOLUME_OFFSET`
        );
      }
      const byteOffset = featureTable.POSITION_QUANTIZED.byteOffset;
      const quantizedPositions =
        TileTableData.createQuantizedPositionsFromBinary(
          binary,
          byteOffset,
          numPositions
        );
      // The 'quantization.offset' will become part of the 'global position'
      // so use an offset of [0,0,0] here
      const offset = [0, 0, 0];
      const dequantization = TileTableData.createDequantization(
        offset,
        quantization.scale
      );
      return Iterables.map(quantizedPositions, dequantization);
    }

    throw new TileFormatError(
      "The feature table contains neither POSITION nor POSITION_QUANTIZED"
    );
  }

  /**
   * Create the position data from the given data
   *
   * @param binary - The feature table binary
   * @param byteOffset - The byte offset
   * @param numPositions - The number of positions
   * @returns The the iterable over the data
   */
  static createPositionsFromBinary(
    binary: Buffer,
    byteOffset: number,
    numPositions: number
  ): Iterable<number[]> {
    const legacyType = "VEC3";
    const legacyComponentType = "FLOAT";
    return TileTableData.createNumericArrayIterable(
      legacyType,
      legacyComponentType,
      binary,
      byteOffset,
      numPositions
    );
  }

  /**
   * Create the quantized positions data from the given data
   *
   * @param binary - The feature table binary
   * @param byteOffset - The byte offset
   * @param numPositions - The number of positions
   * @returns The the iterable over the data
   */
  private static createQuantizedPositionsFromBinary(
    binary: Buffer,
    byteOffset: number,
    numPositions: number
  ): Iterable<number[]> {
    const legacyType = "VEC3";
    const legacyComponentType = "UNSIGNED_SHORT";
    return TileTableData.createNumericArrayIterable(
      legacyType,
      legacyComponentType,
      binary,
      byteOffset,
      numPositions
    );
  }

  /**
   * Obtain the quantization information from the given PNTS-
   * or I3DM feature table.
   *
   * If the feature table does not contain QUANTIZED_VOLUME_OFFSET
   * or QUANTIZED_VOLUME_SCALE, then `undefined` is returned.
   * Otherwise, the offset and scale are returned.
   *
   * @param featureTable - The feature table
   * @param featureTableBinary - The feature table binary
   * @returns The quantization information
   */
  static obtainQuantizationOffsetScale(
    featureTable: PntsFeatureTable | I3dmFeatureTable,
    featureTableBinary: Buffer
  ):
    | {
        offset: number[];
        scale: number[];
      }
    | undefined {
    if (!featureTable.QUANTIZED_VOLUME_OFFSET) {
      return undefined;
    }
    if (!featureTable.QUANTIZED_VOLUME_SCALE) {
      return undefined;
    }
    const volumeOffset = TileTableData.obtainNumberArray(
      featureTableBinary,
      featureTable.QUANTIZED_VOLUME_OFFSET,
      3,
      "FLOAT32"
    );
    const volumeScale = TileTableData.obtainNumberArray(
      featureTableBinary,
      featureTable.QUANTIZED_VOLUME_SCALE,
      3,
      "FLOAT32"
    );
    return {
      offset: volumeOffset,
      scale: volumeScale,
    };
  }

  /**
   * Obtains the translation that is implied by the given `RTC_CENTER`
   * property of a feature table
   *
   * @param rtcCenter - The `RTC_CENTER` property
   * @param binary - The binary blob of the feature table
   * @returns The `RTC_CENTER` value
   */
  static obtainRtcCenter(
    rtcCenter: BinaryBodyOffset | number[],
    binary: Buffer
  ): [number, number, number] {
    const c = TileTableData.obtainNumberArray(binary, rtcCenter, 3, "FLOAT32");
    return [c[0], c[1], c[2]];
  }

  /**
   * Returns the "global position" that is implied by the given feature table.
   *
   * This position will include the RTC_CENTER (if present) and the
   * quantization offset (if present), and will be `undefined` if
   * neither of them is present.
   *
   * @param featureTable - The feature table
   * @param featureTableBinary - The feature tabel binary
   * @returns The global position
   */
  static obtainGlobalPosition(
    featureTable: PntsFeatureTable | I3dmFeatureTable,
    featureTableBinary: Buffer
  ): [number, number, number] | undefined {
    // Compute the "global position", which may include
    // the RTC_CENTER and the quantization offset.
    let globalPosition: [number, number, number] | undefined = undefined;

    // Fetch the `RTC_CENTER` from the feature table, to be used
    // as on part of the "global position"
    let rtcCenter: number[] | undefined = undefined;
    if (featureTable.RTC_CENTER) {
      rtcCenter = TileTableData.obtainRtcCenter(
        featureTable.RTC_CENTER,
        featureTableBinary
      );
      globalPosition = [rtcCenter[0], rtcCenter[1], rtcCenter[2]];
    }

    // Add the quantization offset to the global position
    const quantization = TileTableData.obtainQuantizationOffsetScale(
      featureTable,
      featureTableBinary
    );
    if (quantization) {
      if (!globalPosition) {
        globalPosition = [0, 0, 0];
      }
      globalPosition[0] += quantization.offset[0];
      globalPosition[1] += quantization.offset[1];
      globalPosition[2] += quantization.offset[2];
    }
    return globalPosition;
  }

  /**
   * Create the batch ID data from the given data
   *
   * @param binary - The feature table binary
   * @param byteOffset - The byte offset
   * @param legacyComponentType - The (legacy) component type
   * (e.g. "UNSIGNED_BYTE" - not "UINT8")
   * @param numPoints - The number of points
   * @returns The iterable over the result values
   */
  static createBatchIdsFromBinary(
    binary: Buffer,
    byteOffset: number,
    legacyComponentType: string,
    numPoints: number
  ): Iterable<number> {
    const batchIds = TileTableData.createNumericScalarIterable(
      "SCALAR",
      legacyComponentType,
      binary,
      byteOffset,
      numPoints
    );
    return batchIds;
  }

  /**
   * Obtains the data from a batch- or feature table property,
   * as an array of numbers.
   *
   * @param binary - The binary blob of the table
   * @param property - The property value. If this is a number
   * array, then it is returned directly. Otherwise, if it
   * is a binary body reference, then the corresponding
   * values from the buffer will be read and returned
   * as an array of numbers
   * @param length - The length (in number of elements) of
   * the property
   * @param componentType - The component type, e.g `FLOAT32` or `UINT16`
   * @returns The property values as an array of numbers
   */
  static obtainNumberArray(
    binary: Buffer,
    property: number[] | BinaryBodyOffset,
    length: number,
    componentType: string
  ): number[] {
    if (TileTableData.isBinaryBodyOffset(property)) {
      const byteOffset = property.byteOffset;
      const resultValues = NumericBuffers.getNumericArrayFromBuffer(
        binary,
        byteOffset,
        length,
        componentType
      );
      return resultValues.map((n: number | bigint) => Number(n));
    }
    return property;
  }

  /**
   * Returns whether the given object is a `BinaryBodyOffset`
   *
   * @param p - The object
   * @returns Whether it is a `BinaryBodyOffset`
   */
  private static isBinaryBodyOffset(
    p: BinaryBodyOffset | number[]
  ): p is BinaryBodyOffset {
    return (p as BinaryBodyOffset).byteOffset !== undefined;
  }

  /**
   * Returns whether the given object is a `BatchTableBinaryBodyReference`
   *
   * @param p - The object
   * @returns Whether it is a `BatchTableBinaryBodyReference`
   */
  static isBatchTableBinaryBodyReference(
    p: any
  ): p is BatchTableBinaryBodyReference {
    const r = p as BatchTableBinaryBodyReference;
    return (
      r.byteOffset !== undefined &&
      r.componentType !== undefined &&
      r.type !== undefined
    );
  }

  /**
   * Creates an iterable over the values that are stored in the
   * given batch- or feature table data, assuming that they are
   * numeric arrays
   *
   * @param legacyType - The legacy type, e.g. `VEC2`
   * @param legacyComponentType - The legacy component type,
   * e.g. `UNSIGNED_SHORT`
   * @param binary - The binary blob of the table
   * @param byteOffset - The offset inside the binary blob
   * where the values start
   * @param numElements - The number of elements
   * @returns The iterable
   */
  static createNumericArrayIterable(
    legacyType: string,
    legacyComponentType: string,
    binary: Buffer,
    byteOffset: number,
    numElements: number
  ): Iterable<number[]> {
    const propertyModel = TileTableData.createNumericPropertyModel(
      legacyType,
      legacyComponentType,
      binary,
      byteOffset
    );
    return PropertyModels.createNumericArrayIterable(
      propertyModel,
      numElements
    );
  }

  /**
   * Creates an iterable over the values that are stored in the
   * given batch- or feature table data, assuming that they are
   * numeric scalars
   *
   * @param legacyType - The legacy type, e.g. `SCALAR`
   * @param legacyComponentType - The legacy component type,
   * e.g. `UNSIGNED_SHORT`
   * @param binary - The binary blob of the table
   * @param byteOffset - The offset inside the binary blob
   * where the values start
   * @param numElements - The number of elements
   * @returns The iterable
   */
  static createNumericScalarIterable(
    legacyType: string,
    legacyComponentType: string,
    binary: Buffer,
    byteOffset: number,
    numElements: number
  ): Iterable<number> {
    const propertyModel = TileTableData.createNumericPropertyModel(
      legacyType,
      legacyComponentType,
      binary,
      byteOffset
    );
    return PropertyModels.createNumericScalarIterable(
      propertyModel,
      numElements
    );
  }

  /**
   * Createa a `PropertyModel` instance that is backed by
   * the numeric data of a batch- or feature table
   *
   * @param legacyType - The legacy type, e.g. `VEC2`
   * @param legacyComponentType - The legacy component type,
   * e.g. `UNSIGNED_SHORT`
   * @param binary - The binary blob of the table
   * @param byteOffset - The byte offset
   * @returns The property model
   */
  static createNumericPropertyModel(
    legacyType: string,
    legacyComponentType: string,
    binary: Buffer,
    byteOffset: number
  ): PropertyModel {
    const type = TileTableData.convertLegacyTypeToType(legacyType);
    const componentType =
      TileTableData.convertLegacyComponentTypeToComponentType(
        legacyComponentType
      );
    const valuesBuffer = binary.subarray(byteOffset);
    const propertyModel = new NumericPropertyModel(
      type,
      valuesBuffer,
      componentType
    );
    return propertyModel;
  }

  /**
   * Creates a function that receives a 3D point and returns a 3D
   * point, applying the dequantization of
   * ```
   * POSITION = POSITION_QUANTIZED * QUANTIZED_VOLUME_SCALE / 65535.0 + QUANTIZED_VOLUME_OFFSET
   * ```
   * as described in the specification.
   *
   * @param volumeOffset - The volume offset
   * @param volumeScale - The volume scale
   * @returns The dequantization function
   */
  private static createDequantization(
    volumeOffset: number[],
    volumeScale: number[]
  ): (input: number[]) => number[] {
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

  /**
   * Obtain the component type of the BATCH_ID data (if present).
   * This will be a string like `"UINT8"` or `"FLOAT32"`.
   *
   * @param featureTable - The feature table
   * @returns The BATCH_ID component type
   */
  static obtainBatchIdComponentType(
    featureTable: PntsFeatureTable | I3dmFeatureTable
  ): string | undefined {
    const batchId = featureTable.BATCH_ID;
    if (!batchId) {
      return undefined;
    }
    const legacyComponentType = batchId.componentType ?? "UNSIGNED_SHORT";
    const componentType =
      TileTableData.convertLegacyComponentTypeToComponentType(
        legacyComponentType
      );
    return componentType;
  }

  /**
   * Converts the given "legacy" type to a metadata type.
   *
   * Note that this is usually a no-op, but clearly separating
   * between the "legacy" type and the "new" type is important,
   * e.g. when the "new" types are represented as an `enum` in
   * the future.
   *
   * @param legacyType - The legacy type (e.g. `VEC2`)
   * @returns The type (e.g. `VEC2`)
   * @throws TileFormatError If the input type is invalid
   */
  static convertLegacyTypeToType(legacyType: string) {
    switch (legacyType) {
      case "SCALAR":
      case "VEC2":
      case "VEC3":
      case "VEC4":
        return legacyType;
    }
    throw new TileFormatError(
      `Table contains property with unknown type ${legacyType}`
    );
  }

  /**
   * Converts the given "legacy" component type to a metadata component type.
   *
   * This will do the standard conversions, e.g. of
   * - `BYTE` to `INT8`
   * - `FLOAT` to `FLOAT32`
   * - `UNSIGNED_SHORT` to `UINT16`
   * - etc
   *
   * @param legacyType - The legacy component type
   * @returns The component type
   * @throws TileFormatError If the input type is invalid
   */
  static convertLegacyComponentTypeToComponentType(
    legacyComponentType: string
  ) {
    switch (legacyComponentType) {
      case "BYTE":
        return "INT8";
      case "UNSIGNED_BYTE":
        return "UINT8";
      case "SHORT":
        return "INT16";
      case "UNSIGNED_SHORT":
        return "UINT16";
      case "INT":
        return "INT32";
      case "UNSIGNED_INT":
        return "UINT32";
      case "FLOAT":
        return "FLOAT32";
      case "DOUBLE":
        return "FLOAT64";
    }
    throw new TileFormatError(
      `Table contains property with unknown component type ${legacyComponentType}`
    );
  }
}

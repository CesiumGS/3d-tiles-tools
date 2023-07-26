import { Iterables } from "../base/Iterables";

import { I3dmFeatureTable } from "../structure/TileFormats/I3dmFeatureTable";

import { TileTableData } from "./TileTableData";

// TODO These should probably be in this directory:
import { AttributeCompression } from "../contentProcessing/pointClouds/AttributeCompression";
import { Colors } from "../contentProcessing/pointClouds/Colors";

/**
 * Methods to access the data that is stored in the feature table
 * of I3DM.
 */
export class TileTableDataI3dm {
  /**
   * Create the up-normal data from the given feature table data.
   *
   * This will return the NORMAL_UP or NORMAL_UP_OCT32P data
   * as an iterable over 3D float arrays.
   *
   * @param featureTable - The I3DM feature table
   * @param binary - The feature table binary
   * @param numElements - The number of elements
   * @returns The the iterable over the data
   */
  static createNormalsUp(
    featureTable: I3dmFeatureTable,
    binary: Buffer,
    numElements: number
  ): Iterable<number[]> | undefined {
    if (featureTable.NORMAL_UP) {
      const byteOffset = featureTable.NORMAL_UP.byteOffset;
      return TileTableDataI3dm.createNormalsFromBinary(
        binary,
        byteOffset,
        numElements
      );
    }

    if (featureTable.NORMAL_UP_OCT32P) {
      const byteOffset = featureTable.NORMAL_UP_OCT32P.byteOffset;
      const octEncodedNormals =
        TileTableDataI3dm.createShortOctEncodedNormalsFromBinary(
          binary,
          byteOffset,
          numElements
        );
      const normals = Iterables.map(
        octEncodedNormals,
        AttributeCompression.octDecode16
      );
      return normals;
    }
    return undefined;
  }

  /**
   * Create the right-normal data from the given feature table data.
   *
   * This will return the NORMAL_RIGHT or NORMAL_RIGHT_OCT32P data
   * as an iterable over 3D float arrays.
   *
   * @param featureTable - The I3DM feature table
   * @param binary - The feature table binary
   * @param numElements - The number of elements
   * @returns The the iterable over the data
   */
  static createNormalsRight(
    featureTable: I3dmFeatureTable,
    binary: Buffer,
    numElements: number
  ): Iterable<number[]> | undefined {
    if (featureTable.NORMAL_RIGHT) {
      const byteOffset = featureTable.NORMAL_RIGHT.byteOffset;
      return TileTableDataI3dm.createNormalsFromBinary(
        binary,
        byteOffset,
        numElements
      );
    }

    if (featureTable.NORMAL_RIGHT_OCT32P) {
      const byteOffset = featureTable.NORMAL_RIGHT_OCT32P.byteOffset;
      const octEncodedNormals =
        TileTableDataI3dm.createShortOctEncodedNormalsFromBinary(
          binary,
          byteOffset,
          numElements
        );
      const normals = Iterables.map(
        octEncodedNormals,
        AttributeCompression.octDecode16
      );
      return normals;
    }
    return undefined;
  }

  /**
   * Create the normal data from the given data
   *
   * @param binary - The feature table binary
   * @param byteOffset - The byte offset
   * @param numElements - The number of elements
   * @returns The the iterable over the data
   */
  private static createNormalsFromBinary(
    binary: Buffer,
    byteOffset: number,
    numElements: number
  ): Iterable<number[]> {
    const legacyType = "VEC3";
    const legacyComponentType = "FLOAT";
    return TileTableData.createNumericArrayIterable(
      legacyType,
      legacyComponentType,
      binary,
      byteOffset,
      numElements
    );
  }

  /**
   * Create the oct-encoded normal data from the given data
   *
   * @param binary - The feature table binary
   * @param byteOffset - The byte offset
   * @param numElements - The number of elements
   * @returns The the iterable over the data
   */
  private static createShortOctEncodedNormalsFromBinary(
    binary: Buffer,
    byteOffset: number,
    numElements: number
  ): Iterable<number[]> {
    const legacyType = "VEC2";
    const legacyComponentType = "UNSIGNED_SHORT";
    return TileTableData.createNumericArrayIterable(
      legacyType,
      legacyComponentType,
      binary,
      byteOffset,
      numElements
    );
  }

  /**
   * Create the uniform scaling data from the given feature
   * table data.
   *
   * This will return the SCALE data as an iterable over
   * numbers
   *
   * @param featureTable - The I3DM feature table
   * @param binary - The feature table binary
   * @param numElements - The number of elements
   * @returns The the iterable over the data
   */
  static createScale(
    featureTable: I3dmFeatureTable,
    binary: Buffer,
    numElements: number
  ): Iterable<number> | undefined {
    if (featureTable.SCALE) {
      const legacyType = "SCALAR";
      const legacyComponentType = "FLOAT";
      const byteOffset = featureTable.SCALE.byteOffset;
      return TileTableData.createNumericScalarIterable(
        legacyType,
        legacyComponentType,
        binary,
        byteOffset,
        numElements
      );
    }
    return undefined;
  }

  /**
   * Create the non-uniform scaling data from the given feature
   * table data.
   *
   * This will return the SCALE_NON_UNIFORM data as an
   * iterable over 3D float arrays.
   *
   * @param featureTable - The I3DM feature table
   * @param binary - The feature table binary
   * @param numElements - The number of elements
   * @returns The the iterable over the data
   */
  static createNonUniformScale(
    featureTable: I3dmFeatureTable,
    binary: Buffer,
    numElements: number
  ): Iterable<number[]> | undefined {
    if (featureTable.SCALE_NON_UNIFORM) {
      const byteOffset = featureTable.SCALE_NON_UNIFORM.byteOffset;
      const legacyType = "VEC3";
      const legacyComponentType = "FLOAT";
      return TileTableData.createNumericArrayIterable(
        legacyType,
        legacyComponentType,
        binary,
        byteOffset,
        numElements
      );
    }
    return undefined;
  }
}

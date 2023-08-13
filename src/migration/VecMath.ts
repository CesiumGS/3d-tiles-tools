import { Math as CesiumMath } from "cesium";
import { Transforms } from "cesium";
import { Ellipsoid } from "cesium";
import { Matrix3 } from "cesium";
import { Matrix4 } from "cesium";
import { Cartesian3 } from "cesium";
import { Quaternion } from "cesium";
import { DeveloperError } from "../base/DeveloperError";

/**
 * Vector math utility functions.
 *
 * The main purpose of this class is to offer the Cesium vector math
 * functionality (for matrices and quaternions) in a form that operates
 * on plain number arrays, which are the common denominator between
 * Cesium (with its own classes like 'Matrix4') and glTF-Transform
 * (which uses internal/hidden type definitions like 'mat4')
 */
export class VecMath {
  // Scratch variables for the implementation
  private static readonly upScratch = new Cartesian3();
  private static readonly rightScratch = new Cartesian3();
  private static readonly forwardScratch = new Cartesian3();
  private static readonly positionScratch0 = new Cartesian3();
  private static readonly positionScratch1 = new Cartesian3();
  private static readonly matrix3Scratch = new Matrix3();
  private static readonly matrix4Scratch0 = new Matrix4();
  private static readonly matrix4Scratch1 = new Matrix4();
  private static readonly quaternionScratch = new Quaternion();

  /**
   * Create a 4x4 identity matrix as a flat array
   *
   * @returns The matrix
   */
  static createIdentityPacked4() {
    return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  }

  /**
   * Create a 4x4 Y-up-to-Z-up conversion matrix as a flat array
   *
   * @returns The matrix
   */
  static createYupToZupPacked4() {
    return [1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1];
  }

  /**
   * Create a 4x4 Z-up-to-Y-up conversion matrix as a flat array
   *
   * @returns The matrix
   */
  static createZupToYupPacked4() {
    return [1, 0, 0, 0, 0, 0, -1, 0, 0, 1, 0, 0, 0, 0, 0, 1];
  }

  /**
   * Compute the rotation quaternions that are implied by the
   * given up- and right-vectors.
   *
   * The vectors are given as 3-element arrays. The resulting
   * quaternions will be 4-element arrays.
   *
   * @param upVectors The up-vectors
   * @param rightVectors The right-vectors
   * @returns The rotation quaternions
   */
  static computeRotationQuaternions(
    upVectors: number[][],
    rightVectors: number[][]
  ): number[][] {
    const n = upVectors.length;
    const quaternions: number[][] = [];
    for (let i = 0; i < n; i++) {
      const up = upVectors[i];
      const right = rightVectors[i];
      const quaternion = VecMath.computeRotationQuaternion(up, right);
      quaternions.push(quaternion);
    }
    return quaternions;
  }

  /**
   * Compute the rotation quaternion that is implied by the
   * given up- and right-vector.
   *
   * The vectors are given as 3-element arrays. The resulting
   * quaternion will be a 4-element array.
   *
   * @param upPacked - The up-vector
   * @param rightPacked - The right-vector
   * @returns The quaternion
   */
  private static computeRotationQuaternion(
    upPacked: number[],
    rightPacked: number[]
  ) {
    const up = VecMath.upScratch;
    const right = VecMath.rightScratch;
    const forward = VecMath.forwardScratch;
    const matrix3 = VecMath.matrix3Scratch;
    const quaternion = VecMath.quaternionScratch;

    Cartesian3.unpack(upPacked, 0, up);
    Cartesian3.unpack(rightPacked, 0, right);

    Cartesian3.cross(right, up, forward);
    Cartesian3.normalize(forward, forward);
    Matrix3.setColumn(matrix3, 0, right, matrix3);
    Matrix3.setColumn(matrix3, 1, up, matrix3);
    Matrix3.setColumn(matrix3, 2, forward, matrix3);
    Quaternion.fromRotationMatrix(matrix3, quaternion);

    const result = Quaternion.pack(quaternion, new Array(4));
    return result;
  }

  /**
   * Compute the product of the given 4x4 matrices.
   *
   * Each input matrix and the result will be flat, 16 element arrays.
   *
   * @param matrices4Packed - The matrices
   * @returns The resulting matrix
   */
  static multiplyAll4(matrices4Packed: number[][]): number[] {
    const matrix0 = VecMath.matrix4Scratch0;
    const matrix1 = VecMath.matrix4Scratch1;
    Matrix4.unpack(VecMath.createIdentityPacked4(), 0, matrix0);
    for (let i = 0; i < matrices4Packed.length; i++) {
      const matrixPacked = matrices4Packed[i];
      Matrix4.unpack(matrixPacked, 0, matrix1);
      Matrix4.multiply(matrix0, matrix1, matrix0);
    }
    const result = Matrix4.pack(matrix0, new Array(16));
    return result;
  }

  /**
   * Perform a component-wise addition of the given arrays, store
   * it in the given result array, and return the result.
   *
   * If no result array is given, then a new array will be
   * returned.
   *
   * @param a - The first array
   * @param b - The second array
   * @param result - The result array
   * @returns The result
   * @throws DeveloperError if the arrays have different lengths
   */
  static add(a: number[], b: number[], result?: number[]): number[] {
    if (a.length !== b.length) {
      throw new DeveloperError("Arrays have different lengths");
    }
    if (result != undefined) {
      if (a.length !== result.length) {
        throw new DeveloperError("Arrays have different lengths");
      }
    } else {
      result = Array(a.length);
    }
    for (let i = 0; i < a.length; i++) {
      result[i] = a[i] + b[i];
    }
    return result;
  }

  /**
   * Perform a component-wise subtraction of the given arrays, store
   * it in the given result array, and return the result.
   *
   * If no result array is given, then a new array will be
   * returned.
   *
   * @param a - The first array
   * @param b - The second array
   * @param result - The result array
   * @returns The result
   * @throws DeveloperError if the arrays have different lengths
   */
  static subtract(a: number[], b: number[], result?: number[]): number[] {
    if (a.length !== b.length) {
      throw new DeveloperError("Arrays have different lengths");
    }
    if (result != undefined) {
      if (a.length !== result.length) {
        throw new DeveloperError("Arrays have different lengths");
      }
    } else {
      result = Array(a.length);
    }
    for (let i = 0; i < a.length; i++) {
      result[i] = a[i] - b[i];
    }
    return result;
  }

  /**
   * Perform a component-wise multiplication of the given array,
   * with the given factor, store it in the given result array,
   * and return the result.
   *
   * If no result array is given, then a new array will be
   * returned.
   *
   * @param a - The array
   * @param factor - The factor
   * @param result - The result array
   * @returns The result
   * @throws DeveloperError if the arrays have different lengths
   */
  static scale(a: number[], factor: number, result?: number[]): number[] {
    if (result != undefined) {
      if (a.length !== result.length) {
        throw new DeveloperError("Arrays have different lengths");
      }
    } else {
      result = Array(a.length);
    }
    for (let i = 0; i < a.length; i++) {
      result[i] = a[i] * factor;
    }
    return result;
  }

  /**
   * Computes the inverse of the given 4x4 matrix, given as
   * a flat, 16-element array.
   *
   * @param matrix4Packed - The matrix
   * @returns The resulting matrix
   */
  static invert4(matrix4Packed: number[]): number[] {
    const matrix4 = VecMath.matrix4Scratch0;
    Matrix4.unpack(matrix4Packed, 0, matrix4);
    Matrix4.inverse(matrix4, matrix4);
    const result = Matrix4.pack(matrix4, new Array(16));
    return result;
  }

  /**
   * Computes the rotation component of the inverse of the
   * given 4x4 matrix.
   *
   * @param matrix4Packed - The matrix
   * @returns The resulting matrix
   */
  static inverseRotation4(matrix4Packed: number[]): number[] {
    const matrix4 = VecMath.matrix4Scratch0;
    const matrix3 = VecMath.matrix3Scratch;
    Matrix4.unpack(matrix4Packed, 0, matrix4);
    Matrix4.inverse(matrix4, matrix4);
    Matrix4.getRotation(matrix4, matrix3);
    Matrix4.fromRotation(matrix3, matrix4);
    const result = Matrix4.pack(matrix4, new Array(16));
    return result;
  }

  /**
   * Creates a matrix that only contains the rotation component
   * of the given 4x4 matrix.
   *
   * @param matrix4Packed - The matrix
   * @returns The resulting matrix
   */
  static extractRotation4(matrix4Packed: number[]): number[] {
    // TODO This could probably be written in a simpler form...
    const matrix4 = VecMath.matrix4Scratch0;
    const matrix3 = VecMath.matrix3Scratch;
    Matrix4.unpack(matrix4Packed, 0, matrix4);
    Matrix4.getRotation(matrix4, matrix3);
    Matrix4.fromRotation(matrix3, matrix4);
    const result = Matrix4.pack(matrix4, new Array(16));
    return result;
  }

  /**
   * Transforms the given 3D position (given as a 3-element array)
   * with the given 4x4 matrix.
   *
   * @param matrix4Packed - The matrix
   * @param positionPacked - The 3D position
   * @returns The transformed position
   */
  static transform(
    matrix4Packed: number[],
    positionPacked: number[]
  ): number[] {
    const position = VecMath.positionScratch0;
    const transformed = VecMath.positionScratch1;
    const matrix4 = VecMath.matrix4Scratch0;
    Matrix4.unpack(matrix4Packed, 0, matrix4);
    Cartesian3.unpack(positionPacked, 0, position);
    Matrix4.multiplyByPoint(matrix4, position, transformed);
    const result = Cartesian3.pack(transformed, new Array(3));
    return result;
  }

  /**
   * Computes the East-North-Up matrix for the given position.
   *
   * See `Cesium.Transforms.eastNorthUpToFixedFrame` for details.
   *
   * @param positionPacked - The position as a 3-element array
   * @returns The resulting matrix
   */
  static computeEastNorthUpMatrix4(positionPacked: number[]) {
    const position = VecMath.positionScratch0;
    const matrix4 = VecMath.matrix4Scratch0;
    Cartesian3.unpack(positionPacked, 0, position);
    Transforms.eastNorthUpToFixedFrame(position, Ellipsoid.WGS84, matrix4);
    const result = Matrix4.pack(matrix4, new Array(16));
    return result;
  }

  /**
   * Creates a quaternion from the rotation component of the given
   * 4x4 matrix.
   *
   * The matrix is a flat 16-element array, and the quaternion
   * is a 4-element array.
   *
   * @param matrix4Packed - The matrix
   * @returns The quaternion.
   */
  static matrix4ToQuaternion(matrix4Packed: number[]) {
    const matrix3 = VecMath.matrix3Scratch;
    const matrix4 = VecMath.matrix4Scratch0;
    const quaternion = VecMath.quaternionScratch;
    Matrix4.unpack(matrix4Packed, 0, matrix4);
    Matrix4.getMatrix3(matrix4, matrix3);
    Quaternion.fromRotationMatrix(matrix3, quaternion);
    const result = Quaternion.pack(quaternion, new Array(4));
    return result;
  }

  /**
   * Creates a quaternion from the rotation component of the given
   * 4x4 matrix.
   *
   * The matrix is a flat 16-element array, and the quaternion
   * is a 4-element array.
   *
   * @param matrix4Packed - The matrix
   * @returns The quaternion.
   */
  static quaternionToMatrix4(quaternionPacked: number[]) {
    const matrix3 = VecMath.matrix3Scratch;
    const matrix4 = VecMath.matrix4Scratch0;
    const quaternion = VecMath.quaternionScratch;
    Quaternion.unpack(quaternionPacked, 0, quaternion);
    Matrix3.fromQuaternion(quaternion, matrix3);
    Matrix4.fromRotation(matrix3, matrix4);
    const result = Matrix4.pack(matrix4, new Array(16));
    return result;
  }

  /**
   * Returns whether the given arrays are equal, up to a small,
   * unspecified epsilon.
   *
   * @param left - The left array
   * @param right - The right array
   * @returns Whether the arrays are epsilon-equal
   */
  static equalsEpsilon(left: number[], right: number[]): boolean {
    if (left.length != right.length) {
      return false;
    }
    const epsilon = CesiumMath.EPSILON6;
    const n = left.length;
    for (let i = 0; i < n; i++) {
      if (Math.abs(left[i] - right[i]) > epsilon) {
        return false;
      }
    }
    return true;
  }
}

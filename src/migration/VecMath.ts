import { Axis } from "cesium";
import { Math as CesiumMath } from "cesium";
import { Transforms } from "cesium";
import { Ellipsoid } from "cesium";
import { Matrix3 } from "cesium";
import { Matrix4 } from "cesium";
import { Cartesian3 } from "cesium";
import { Quaternion } from "cesium";

export class VecMath {
  // TypeScript isn't smart enough to detect that
  // this is in fact a 16-element array...
  static readonly Y_UP_TO_Z_UP_PACKED_4: [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number
  ] = [1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1];

  static readonly Z_UP_TO_Y_UP_PACKED_4: [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number
  ] = [1, 0, 0, 0, 0, 0, -1, 0, 0, 1, 0, 0, 0, 0, 0, 1];

  static readonly Z_UP_TO_X_UP_PACKED_4: [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number
  ] = [0, 0, -1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1];

  static readonly X_UP_TO_Z_UP_PACKED_4: [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number
  ] = [0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 0, 1];

  private static readonly Y_UP_TO_Z_UP_4 = Matrix4.unpack(
    VecMath.Y_UP_TO_Z_UP_PACKED_4
  );
  private static readonly Z_UP_TO_Y_UP_4 = Matrix4.unpack(
    VecMath.Z_UP_TO_Y_UP_PACKED_4
  );
  private static readonly Z_UP_TO_X_UP_4 = Matrix4.unpack(
    VecMath.Z_UP_TO_X_UP_PACKED_4
  );
  private static readonly X_UP_TO_Z_UP_4 = Matrix4.unpack(
    VecMath.X_UP_TO_Z_UP_PACKED_4
  );

  private static readonly upScratch = new Cartesian3();
  private static readonly rightScratch = new Cartesian3();
  private static readonly forwardScratch = new Cartesian3();
  private static readonly positionScratch0 = new Cartesian3();
  private static readonly positionScratch1 = new Cartesian3();
  private static readonly matrix3Scratch = new Matrix3();
  private static readonly matrix4Scratch = new Matrix4();
  private static readonly quaternionScratch = new Quaternion();

  static computeQuaternion(upPacked: number[], rightPacked: number[]) {
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

  static inverseTransform(
    matrix4Packed: number[],
    positionPacked: number[]
  ): number[] {
    const position = VecMath.positionScratch0;
    const transformed = VecMath.positionScratch1;
    const matrix4 = VecMath.matrix4Scratch;
    Matrix4.unpack(matrix4Packed, 0, matrix4);
    Matrix4.inverse(matrix4, matrix4);
    Cartesian3.unpack(positionPacked, 0, position);
    Matrix4.multiplyByPoint(matrix4, position, transformed);
    const result = Cartesian3.pack(transformed, new Array(3));
    return result;
  }

  static transform(
    matrix4Packed: number[],
    positionPacked: number[]
  ): number[] {
    const position = VecMath.positionScratch0;
    const transformed = VecMath.positionScratch1;
    const matrix4 = VecMath.matrix4Scratch;
    Matrix4.unpack(matrix4Packed, 0, matrix4);
    Cartesian3.unpack(positionPacked, 0, position);
    Matrix4.multiplyByPoint(matrix4, position, transformed);
    const result = Cartesian3.pack(transformed, new Array(3));
    return result;
  }

  static computeEastNorthUpQuaternion(positionPacked: number[]) {
    const position = VecMath.positionScratch0;
    const matrix3 = VecMath.matrix3Scratch;
    const matrix4 = VecMath.matrix4Scratch;
    const quaternion = VecMath.quaternionScratch;

    Cartesian3.unpack(positionPacked, 0, position);
    Transforms.eastNorthUpToFixedFrame(position, Ellipsoid.WGS84, matrix4);
    Matrix4.getMatrix3(matrix4, matrix3);
    Quaternion.fromRotationMatrix(matrix3, quaternion);
    const result = Quaternion.pack(quaternion, new Array(4));
    return result;
  }

  static convertYupToZup(p: number[]): number[] {
    const px = p[0];
    const py = p[1];
    const pz = p[2];
    const q = [px, pz, -py];
    return q;
  }
  static convertZupToYup(p: number[]): number[] {
    const px = p[0];
    const py = p[1];
    const pz = p[2];
    const q = [px, -pz, py];
    return q;
  }
  static convertZupToXup(p: number[]): number[] {
    const px = p[0];
    const py = p[1];
    const pz = p[2];
    const q = [-pz, py, px];
    return q;
  }
  static convertXupToZup(p: number[]): number[] {
    const px = p[0];
    const py = p[1];
    const pz = p[2];
    const q = [pz, py, -px];
    return q;
  }
}

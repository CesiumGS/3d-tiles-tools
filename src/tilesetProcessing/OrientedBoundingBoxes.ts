import { Quaternion } from "cesium";
import { Matrix4 } from "cesium";
import { Cartesian3 } from "cesium";
import { OrientedBoundingBox } from "cesium";

import { computeOBB } from "./external/dito";
import { Obb } from "./external/dito";

/**
 * Methods for computing oriented bounding boxes.
 *
 * @internal
 */
export class OrientedBoundingBoxes {
  /**
   * Compute a bounding volume box for the given points.
   *
   * This will return the 12-element array that can be used
   * as the `boundingVolume.box` in a tileset JSON.
   *
   * @param points - The points, as 3-element arrays
   * @returns The bounding volume box
   */
  static fromPoints(points: number[][]): number[] {
    return OrientedBoundingBoxes.fromPointsDitoTs(points);
  }

  /**
   * Implementation of 'fromPoints' based on dito.ts
   *
   * @param points - The points, as 3-element arrays
   * @returns The bounding volume box
   */
  private static fromPointsDitoTs(points: number[][]): number[] {
    const attribute = {
      data: points.flat(),
      size: 3,
      offsetIdx: 0,
      strideIdx: 3,
    };
    const obb: Obb = {
      center: new Float64Array(3),
      halfSize: new Float32Array(3),
      quaternion: new Float32Array(4),
    };
    computeOBB(attribute, obb);

    const translation = Cartesian3.unpack([...obb.center]);
    const rotation = Quaternion.unpack([...obb.quaternion]);
    const scale = Cartesian3.unpack(
      [...obb.halfSize].map((v: number) => v * 2)
    );
    const matrix = Matrix4.fromTranslationQuaternionRotationScale(
      translation,
      rotation,
      scale,
      new Matrix4()
    );
    const cesiumObb = OrientedBoundingBox.fromTransformation(matrix, undefined);
    const result = Array<number>(12);
    OrientedBoundingBox.pack(cesiumObb, result, 0);
    return result;
  }
}

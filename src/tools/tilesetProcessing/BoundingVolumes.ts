import { Ellipsoid } from "cesium";
import { Matrix4 } from "cesium";
import { Cartesian3 } from "cesium";
import { Rectangle } from "cesium";
import { Matrix3 } from "cesium";
import { OrientedBoundingBox } from "cesium";

import { BoundingVolume } from "../../structure";

import { OrientedBoundingBoxes } from "./OrientedBoundingBoxes";

/**
 * Utility methods for bounding volume computations.
 *
 * This class is mainly supposed to be used in the TilesetJsonCreator.
 *
 * The term "bounding volume box" refers to the 12-element number
 * arrays that are the `boundingVolume.box`.
 *
 * @internal
 */
export class BoundingVolumes {
  /**
   * Creates a bounding volume box for the unit cube
   *
   * @returns The bounding volume box
   */
  static createUnitCubeBoundingVolumeBox(): number[] {
    return [0.5, 0.5, 0.5, 0.5, 0, 0, 0, 0.5, 0, 0, 0, 0.5];
  }

  /**
   * Compute a bounding volume box for the given points.
   *
   * @param points - The points, as 3-element arrays
   * @returns The bounding volume box
   */
  static createBoundingVolumeBoxFromPoints(points: number[][]) {
    return OrientedBoundingBoxes.fromPoints(points);
  }

  /**
   * Computes an array containing the 8 corners of the given
   * bounding volume box.
   *
   * @param boundingVolumeBox - The bounding volume box
   * @returns The corners, as 3-element arrays
   */
  static computeBoundingVolumeBoxCorners(
    boundingVolumeBox: number[]
  ): number[][] {
    const center = new Cartesian3(
      boundingVolumeBox[0],
      boundingVolumeBox[1],
      boundingVolumeBox[2]
    );
    const halfAxes = Matrix3.fromArray(boundingVolumeBox, 3);

    const orientedBoundingBox = new OrientedBoundingBox(center, halfAxes);
    const cornerCartesians = orientedBoundingBox.computeCorners();
    const cornerPoints: number[][] = [];
    for (const cornerCartesian of cornerCartesians) {
      const cornerPoint: number[] = [
        cornerCartesian.x,
        cornerCartesian.y,
        cornerCartesian.z,
      ];
      cornerPoints.push(cornerPoint);
    }
    return cornerPoints;
  }

  /**
   * Creates a bounding volume box from the given minimum and maximum point
   * of an axis-aligned bounding box.
   *
   * @param min - The minimum, as a 3-element array
   * @param max - The minimum, as a 3-element array
   * @returns The bounding volume box
   */
  static createBoundingVolumeBoxFromMinMax(min: number[], max: number[]) {
    return BoundingVolumes.createBoundingVolumeBox(
      min[0],
      min[1],
      min[2],
      max[0],
      max[1],
      max[2]
    );
  }

  /**
   * Creates a bounding box for a tileset- or tile bounding volume.
   *
   * This is the center- and half-axis representation of the
   * `boundingVolume.box` that is described at
   * https://github.com/CesiumGS/3d-tiles/tree/main/specification#box,
   * computed from the minimum- and maximum point of an axis-aligned
   * bounding box.
   *
   * @param minX - The minimum x
   * @param minY - The minimum y
   * @param minZ - The minimum z
   * @param maxX - The maximum x
   * @param maxY - The maximum y
   * @param maxZ - The maximum z
   * @returns The `boundingVolume.box`
   */
  private static createBoundingVolumeBox(
    minX: number,
    minY: number,
    minZ: number,
    maxX: number,
    maxY: number,
    maxZ: number
  ): number[] {
    // The size of the box
    const dx = maxX - minX;
    const dy = maxY - minY;
    const dz = maxZ - minZ;

    // The center of the box
    const cx = minX + dx * 0.5;
    const cy = minY + dy * 0.5;
    const cz = minZ + dz * 0.5;

    // The x-direction and half length
    const hxx = dx * 0.5;
    const hxy = 0.0;
    const hxz = 0.0;

    // The y-direction and half length
    const hyx = 0.0;
    const hyy = dy * 0.5;
    const hyz = 0.0;

    // The z-direction and half length
    const hzx = 0.0;
    const hzy = 0.0;
    const hzz = dz * 0.5;

    const box = [cx, cy, cz, hxx, hxy, hxz, hyx, hyy, hyz, hzx, hzy, hzz];
    return box;
  }

  /**
   * Translate the given bounding volume box by the given amount
   *
   * @param boundingVolumeBox - The bounding volume box
   * @param translation - The translation, as a 3-element array
   * @returns The translated bounding volume box
   */
  static translateBoundingVolumeBox(
    boundingVolumeBox: number[],
    translation: number[]
  ): number[] {
    const result = boundingVolumeBox.slice();
    result[0] += translation[0];
    result[1] += translation[1];
    result[2] += translation[2];
    return result;
  }

  /**
   * Transforms the given bounding volume box with the given 4x4 transform
   * matrix, and returns the result.
   *
   * @param boundingVolumeBox - The bounding volume box
   * @param transform - The transform, as a 16-element array
   * @returns The transformed bounding volume box
   */
  static transformBoundingVolumeBox(
    boundingVolumeBox: number[],
    transform: number[]
  ) {
    const matrix = Matrix4.unpack(transform);
    const rotationScale = Matrix4.getMatrix3(matrix, new Matrix3());
    const orientedBoundingBox = OrientedBoundingBox.unpack(
      boundingVolumeBox,
      0
    );
    const center = orientedBoundingBox.center;
    const halfAxes = orientedBoundingBox.halfAxes;
    Matrix4.multiplyByPoint(matrix, center, center);
    Matrix3.multiply(rotationScale, halfAxes, halfAxes);
    return OrientedBoundingBox.pack(orientedBoundingBox, Array<number>(12));
  }

  /**
   * Compute the bounding volume box from the given bounding volume
   *
   * If the bounding volume does not contain a `box`, `region`, or `sphere`,
   * then `undefined` will be returned.
   *
   * @param boundingVolume - The bounding volume
   * @returns The bounding volume box
   */
  static computeBoundingVolumeBoxFromBoundingVolume(
    boundingVolume: BoundingVolume
  ): number[] | undefined {
    if (boundingVolume.box) {
      return boundingVolume.box.slice();
    }
    if (boundingVolume.region) {
      return BoundingVolumes.computeBoundingVolumeBoxFromRegion(
        boundingVolume.region
      );
    }
    if (boundingVolume.sphere) {
      return BoundingVolumes.computeBoundingVolumeBoxFromSphere(
        boundingVolume.sphere
      );
    }
    return undefined;
  }

  /**
   * Compute a bounding volume box from the given bounding region,
   * using the default WGS84 ellipsoid.
   *
   * @param region - The region, as a 6-element array
   * @returns - The bounding volume box
   */
  private static computeBoundingVolumeBoxFromRegion(region: number[]) {
    const rectangle = Rectangle.unpack(region, 0);
    const minimumHeight = region[4];
    const maximumHeight = region[5];
    const orientedBoundingBox = OrientedBoundingBox.fromRectangle(
      rectangle,
      minimumHeight,
      maximumHeight,
      Ellipsoid.WGS84
    );
    return OrientedBoundingBox.pack(orientedBoundingBox, Array<12>());
  }

  /**
   * Compute a bounding volume box from the given bounding sphere
   *
   * @param sphere - The sphere, as a 4-element array (center+radius)
   * @returns - The bounding volume box
   */
  private static computeBoundingVolumeBoxFromSphere(sphere: number[]) {
    const center = Cartesian3.unpack(sphere);
    const radius = sphere[3];
    const result = [
      center.x,
      center.y,
      center.z,
      center.x + radius,
      center.y,
      center.z,
      center.x,
      center.y + radius,
      center.z,
      center.x,
      center.y,
      center.z + radius,
    ];
    return result;
  }

  /**
   * Computes the union of the given boundingVolumeBoxes.
   *
   * If the given array is empty, then then a unit cube bounding
   * volume box will be returned.
   *
   * @param boundingVolumeBoxes - The bounding volume boxes
   * @returns The union volume box
   */
  static computeUnionBoundingVolumeBox(
    boundingVolumeBoxes: Iterable<number[]>
  ): number[] {
    const corners: number[][] = [];
    for (const boundingVolumeBox of boundingVolumeBoxes) {
      const newCorners =
        BoundingVolumes.computeBoundingVolumeBoxCorners(boundingVolumeBox);
      corners.push(...newCorners);
    }
    if (corners.length === 0) {
      return BoundingVolumes.createUnitCubeBoundingVolumeBox();
    }
    return BoundingVolumes.createBoundingVolumeBoxFromPoints(corners);
  }
}

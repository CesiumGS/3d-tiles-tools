import { Matrix3 } from "cesium";
import { Cartographic } from "cesium";
import { Cartesian3 } from "cesium";
import { Ellipsoid } from "cesium";
import { Math as CesiumMath } from "cesium";

import { BoundingVolume } from "../../structure";

import { Loggers } from "../../base";
const logger = Loggers.get("tilesetProcessing");

/**
 * A class offering methods for containment checks of bounding volumes
 */
export class BoundingVolumesContainment {
  // Scratch variable for all containment methods
  private static readonly positionScratch = new Cartesian3();

  // Scratch variables for boxContains
  private static readonly halfAxesScratch = new Matrix3();
  private static readonly halfAxesInverseScratch = new Matrix3();
  private static readonly centerScratch = new Cartesian3();

  // Scratch variable for regionContains
  private static readonly cartographicScratch = new Cartographic();

  /**
   * Returns whether the given bounding volume contains the given point.
   *
   * If the given bounding volume is neither a `box` nor a `sphere`
   * nor a `region`, then a warning will be printed, and `false`
   * will be returned
   *
   * @param boundingVolume - The bounding volume
   * @param point - The point, as a 3-element array
   * @param epsilon - The absolute epsilon
   * @returns Whether the box contains the point
   */
  static contains(
    boundingVolume: BoundingVolume,
    point: number[],
    epsilon: number
  ): boolean {
    if (boundingVolume.box) {
      return BoundingVolumesContainment.boxContains(
        boundingVolume.box,
        point,
        epsilon
      );
    }
    if (boundingVolume.sphere) {
      return BoundingVolumesContainment.sphereContains(
        boundingVolume.sphere,
        point,
        epsilon
      );
    }
    if (boundingVolume.region) {
      return BoundingVolumesContainment.regionContains(
        boundingVolume.region,
        point,
        epsilon
      );
    }
    logger.warn("Unknown bounding volume type: ", boundingVolume);
    return false;
  }

  /**
   * Returns whether the given bounding box contains the given point.
   *
   * @param box - The box, as a 12-element array in center-halfAxes
   * representation, as defined in the 3D Tiles specification
   * @param point - The point, as a 3-element array
   * @param epsilon - The absolute epsilon
   * @returns Whether the box contains the point
   */
  static boxContains(box: number[], point: number[], epsilon: number): boolean {
    const halfAxes = BoundingVolumesContainment.halfAxesScratch;
    const halfAxesInverse = BoundingVolumesContainment.halfAxesInverseScratch;
    const position = BoundingVolumesContainment.positionScratch;
    const center = BoundingVolumesContainment.centerScratch;

    Matrix3.fromArray(box, 3, halfAxes);
    Matrix3.inverse(halfAxes, halfAxesInverse);
    Cartesian3.fromArray(point, 0, position);
    Cartesian3.fromArray(box, 0, center);

    Cartesian3.subtract(position, center, position);
    Matrix3.multiplyByVector(halfAxesInverse, position, position);

    const containedX = Math.abs(position.x) <= 1.0 + epsilon;
    const containedY = Math.abs(position.y) <= 1.0 + epsilon;
    const containedZ = Math.abs(position.z) <= 1.0 + epsilon;
    const contained = containedX && containedY && containedZ;
    return contained;
  }

  /**
   * Returns whether the given bounding sphere contains the given point.
   *
   * @param sphere - The sphere, as a 4-element array in center-radius
   * representation, as defined in the 3D Tiles specification
   * @param point - The point as a 3-element array
   * @param epsilon - The absolute epsilon
   * @returns Whether the sphere contains the given point
   */
  static sphereContains(
    sphere: number[],
    point: number[],
    epsilon: number
  ): boolean {
    const center = BoundingVolumesContainment.centerScratch;
    const position = BoundingVolumesContainment.positionScratch;

    Cartesian3.fromArray(sphere, 0, center);
    const radius = sphere[3];
    Cartesian3.fromArray(point, 0, position);

    const limit = (radius + epsilon) * (radius + epsilon);
    const distanceSquared = Cartesian3.distanceSquared(center, position);
    const contained = distanceSquared <= limit;
    return contained;
  }

  /**
   * Returns whether the given bounding region contains the given point.
   *
   * This converts the given point into its cartographic representation
   * based on the WGS84 ellipsoid, and checks the resulting point for
   * containment in the given bounding region.
   *
   * @param region - The bounding region, in [westRad, southRad, eastRad, northRad,
   * minHeightMeters, maxHeightMeters] representation, as defined in the 3D Tiles
   * specification
   * @param point - The point as a 3-element array
   * @param epsilon - The (absolute) epsilon
   * @returns Whether the region contains the given point
   */
  static regionContains(
    region: number[],
    point: number[],
    epsilon: number
  ): boolean {
    const westRad = region[0];
    const southRad = region[1];
    const eastRad = region[2];
    const northRad = region[3];
    const minHeightMeters = region[4];
    const maxHeightMeters = region[5];

    const position = BoundingVolumesContainment.positionScratch;
    const cartographic = BoundingVolumesContainment.cartographicScratch;

    Cartesian3.fromArray(point, 0, position);
    Cartographic.fromCartesian(position, Ellipsoid.WGS84, cartographic);

    const lonRad = cartographic.longitude;
    const latRad = cartographic.latitude;
    const heightMeters = cartographic.height;

    const containedLat =
      latRad >= southRad - epsilon && latRad <= northRad + epsilon;
    const containedLon =
      BoundingVolumesContainment.normalizedLongitudeRangeContainsInclusive(
        westRad,
        eastRad,
        lonRad,
        epsilon
      );
    const containedHeight =
      heightMeters >= minHeightMeters - epsilon &&
      heightMeters <= maxHeightMeters + epsilon;

    const contained = containedLat && containedLon && containedHeight;
    return contained;
  }

  /**
   * Returns whether the given west-east range contains the given point.
   *
   * This method performs a normalization of the given range and the
   * point, bringing them into the range [-PI, PI).
   *
   * This check is inclusive, meaning that this method returns true
   * when the point is exactly at the border (including the epsilon)
   * of the given range.
   *
   * @param westRad - The west (leftmost) point in radians
   * @param eastRad - The east (rightmost) point in radians
   * @param pointRad - The point in radians
   * @param epsilon - The (absolute) epsilon
   * @returns Whether the range contains the point
   */
  static longitudeRangeContainsInclusive(
    westRad: number,
    eastRad: number,
    pointRad: number,
    epsilon: number
  ) {
    westRad = CesiumMath.convertLongitudeRange(westRad);
    eastRad = CesiumMath.convertLongitudeRange(eastRad);
    pointRad = CesiumMath.convertLongitudeRange(pointRad);
    return BoundingVolumesContainment.normalizedLongitudeRangeContainsInclusive(
      westRad,
      eastRad,
      pointRad,
      epsilon
    );
  }

  /**
   * Returns whether the given west-east range contains the given point.
   *
   * This method assumes that the given range and point are normalized,
   * meaning that they are in the range [-PI, PI).
   *
   * This check is inclusive, meaning that this method returns true
   * when the point is exactly at the border (including the epsilon)
   * of the given range.
   *
   * @param westRad - The west (leftmost) point in radians
   * @param eastRad - The east (rightmost) point in radians
   * @param pointRad - The point in radians
   * @param epsilon - The (absolute) epsilon
   * @returns Whether the range contains the point
   */
  private static normalizedLongitudeRangeContainsInclusive(
    westRad: number,
    eastRad: number,
    pointRad: number,
    epsilon: number
  ) {
    if (eastRad < westRad) {
      eastRad += CesiumMath.TWO_PI;
      if (pointRad < 0.0) {
        pointRad += CesiumMath.TWO_PI;
      }
    }
    if (pointRad < westRad - epsilon) {
      return false;
    }
    if (pointRad > eastRad + epsilon) {
      return false;
    }
    return true;
  }
}

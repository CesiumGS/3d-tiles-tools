// NOTE: These types are only used in the TilesetJsonCreator
// and should be considered an implementation detail.

// Basic, internal structures for bounding box computations
export type Point3D = [number, number, number];
export type BoundingBox3D = {
  min: Point3D;
  max: Point3D;
};

/**
 * Utility methods for bounding volume computations.
 *
 * This class is only supposed to be used in the TilesetJsonCreator.
 *
 * To reduce ambiguities, the term "bounding box" refers to actual
 * `BoundingBox3D` instances. The term "bounding volume box" refers
 * to the 12-element number arrays that are the `boundingVolume.box`.
 */
export class BoundingVolumes {
  /**
   * Creates a bounding box for the unit cube
   *
   * @returns The bounding box
   */
  static createUnitCubeBoundingBox(): BoundingBox3D {
    return {
      min: [0, 0, 0],
      max: [1, 1, 1],
    };
  }

  /**
   * Creates a bounding volume box for the unit cube
   *
   * @returns The bounding volume box
   */
  static createUnitCubeBoundingVolumeBox(): number[] {
    return BoundingVolumes.createBoundingVolumeBoxFromBoundingBox(
      BoundingVolumes.createUnitCubeBoundingBox()
    );
  }

  /**
   * Creates a boundingVolume.box from a given bounding box
   *
   * @param boundingBox The bounding box
   * @return The `boundingVolume.box`
   */
  static createBoundingVolumeBoxFromBoundingBox(
    boundingBox: BoundingBox3D
  ): number[] {
    return BoundingVolumes.createBoundingVolumeBox(
      boundingBox.min[0],
      boundingBox.min[1],
      boundingBox.min[2],
      boundingBox.max[0],
      boundingBox.max[1],
      boundingBox.max[2]
    );
  }

  /**
   * Computes an array containing the 8 corners of the given
   * bounding box.
   *
   * @param boundingBox - The bounding box
   * @returns The corners
   */
  static computeBoundingBoxCorners(boundingBox: BoundingBox3D): Point3D[] {
    const min = boundingBox.min;
    const max = boundingBox.max;
    const c0: Point3D = [min[0], min[1], min[2]];
    const c1: Point3D = [max[0], min[1], min[2]];
    const c2: Point3D = [min[0], max[1], min[2]];
    const c3: Point3D = [max[0], max[1], min[2]];
    const c4: Point3D = [min[0], min[1], max[2]];
    const c5: Point3D = [max[0], min[1], max[2]];
    const c6: Point3D = [min[0], max[1], max[2]];
    const c7: Point3D = [max[0], max[1], max[2]];
    return [c0, c1, c2, c3, c4, c5, c6, c7];
  }

  /**
   * Creates a bounding box for a tileset- or tile bounding volume.
   *
   * This is the center- and half-axis representation of the
   * `boundingVolume.box` that is described at
   * https://github.com/CesiumGS/3d-tiles/tree/main/specification#box,
   * computed from the minimum- and maximum point of a box.
   *
   * @param minX The minimum x
   * @param minY The minimum y
   * @param minZ The minimum z
   * @param maxX The maximum x
   * @param maxY The maximum y
   * @param maxZ The maximum z
   * @return The `boundingVolume.box`
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
   * Creates a boundingVolume.box from a given glTF bounding box.
   *
   * This will take into account the fact that a glTF asset with
   * the given bounding box will be transformed with the
   * y-up-to-z-up transform.
   *
   * @param boundingBox The bounding box
   * @return The `boundingVolume.box`
   */
  static createBoundingVolumeBoxFromGltfBoundingBox(
    boundingBox: BoundingBox3D
  ): number[] {
    // Take into account the y-up-to-z-up transform:
    return BoundingVolumes.createBoundingVolumeBox(
      boundingBox.min[0],
      -boundingBox.min[2],
      boundingBox.min[1],
      boundingBox.max[0],
      -boundingBox.max[2],
      boundingBox.max[1]
    );
  }

  /**
   * Create the BoundingBox3D for the given boundingVolume.box
   *
   * @param boundingVolumeBox - The bounding volume box
   * @return The bounding box
   */
  static createBoundingBoxForBoundingVolumeBox(
    boundingVolumeBox: number[]
  ): BoundingBox3D {
    // Ported from de.javagl:j3dtiles-common:0.0.1-SNAPSHOT
    // even though this is not very elegant...

    const cx = boundingVolumeBox[0];
    const cy = boundingVolumeBox[1];
    const cz = boundingVolumeBox[2];

    let minX = Infinity;
    let minY = Infinity;
    let minZ = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let maxZ = -Infinity;
    for (let i = 1; i < 4; i++) {
      const dx = boundingVolumeBox[i * 3 + 0];
      const dy = boundingVolumeBox[i * 3 + 1];
      const dz = boundingVolumeBox[i * 3 + 2];

      const x0 = cx + dx;
      const y0 = cy + dy;
      const z0 = cz + dz;

      minX = Math.min(minX, x0);
      minY = Math.min(minY, y0);
      minZ = Math.min(minZ, z0);

      maxX = Math.max(maxX, x0);
      maxY = Math.max(maxY, y0);
      maxZ = Math.max(maxZ, z0);

      const x1 = cx - dx;
      const y1 = cy - dy;
      const z1 = cz - dz;

      minX = Math.min(minX, x1);
      minY = Math.min(minY, y1);
      minZ = Math.min(minZ, z1);

      maxX = Math.max(maxX, x1);
      maxY = Math.max(maxY, y1);
      maxZ = Math.max(maxZ, z1);
    }
    return {
      min: [minX, minY, minZ],
      max: [maxX, maxY, maxZ],
    };
  }

  /**
   * Translate the given bounding box by the given amount
   *
   * @param boundingBox - The bounding box
   * @param translation - The translation
   * @returns The translated bounding box
   */
  static translateBoundingBox(
    boundingBox: BoundingBox3D,
    translation: Point3D
  ) {
    return {
      min: BoundingVolumes.add(boundingBox.min, translation),
      max: BoundingVolumes.add(boundingBox.max, translation),
    };
  }

  /**
   * Computes the component-wise sum of the given points.
   *
   * The result will be put into the given result point and
   * returned. If the result point is not given, a new point
   * will be returned.
   *
   * @param p0 - The first point
   * @param p1 - The second point
   * @param result - The point that stores the result
   * @returns The result
   */
  private static add(p0: Point3D, p1: Point3D, result?: Point3D): Point3D {
    const x = p0[0] + p1[0];
    const y = p0[1] + p1[1];
    const z = p0[2] + p1[2];
    if (!result) {
      return [x, y, z];
    }
    result[0] = x;
    result[1] = y;
    result[2] = z;
    return result;
  }

  /**
   * Computes the component-wise minimum of the given points.
   *
   * The result will be put into the given result point and
   * returned. If the result point is not given, a new point
   * will be returned.
   *
   * @param p0 - The first point
   * @param p1 - The second point
   * @param result - The point that stores the result
   * @returns The result
   */
  static min(p0: Point3D, p1: Point3D, result?: Point3D): Point3D {
    const x = Math.min(p0[0], p1[0]);
    const y = Math.min(p0[1], p1[1]);
    const z = Math.min(p0[2], p1[2]);
    if (!result) {
      return [x, y, z];
    }
    result[0] = x;
    result[1] = y;
    result[2] = z;
    return result;
  }
  /**
   * Computes the component-wise maximum of the given points.
   *
   * The result will be put into the given result point and
   * returned. If the result point is not given, a new point
   * will be returned.
   *
   * @param p0 - The first point
   * @param p1 - The second point
   * @param result - The point that stores the result
   * @returns The result
   */
  static max(p0: Point3D, p1: Point3D, result?: Point3D): Point3D {
    const x = Math.max(p0[0], p1[0]);
    const y = Math.max(p0[1], p1[1]);
    const z = Math.max(p0[2], p1[2]);
    if (!result) {
      return [x, y, z];
    }
    result[0] = x;
    result[1] = y;
    result[2] = z;
    return result;
  }

  /**
   * Computes the union of the given bounding boxes
   *
   * @param bb0 - The first bounding box
   * @param bb1 - The second bounding box
   * @returns The union
   */
  static computeBoundingBoxUnion(
    bb0: BoundingBox3D,
    bb1: BoundingBox3D
  ): BoundingBox3D {
    return {
      min: BoundingVolumes.min(bb0.min, bb1.min),
      max: BoundingVolumes.max(bb0.max, bb1.max),
    };
  }
}

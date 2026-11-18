import { Cartesian3 } from "cesium";
import { Cartographic } from "cesium";
import { Ellipsoid } from "cesium";
import { Math as CesiumMath } from "cesium";
import { Matrix4 } from "cesium";

import { BoundingVolumes } from "./BoundingVolumes";
import { BoundingVolumesContainment } from "./BoundingVolumesContainment";
import { Tile } from "../../structure";
import { Tileset } from "../../structure";

import { BoundingVolumeRefiner } from "./BoundingVolumeRefiner";
import { RefinementStats } from "./BoundingVolumeRefiner";
import { ValidationSummary } from "./Validation";

/**
 * The result of checking that each parent bounding volume encloses
 * the bounding volumes of its children
 */
export type ContainmentCheck = {
  /**
   * Number of parent/child pairs that were checked
   */
  pairsChecked: number;

  /**
   * Number of parent/child pairs where the child was not fully
   * contained in the parent
   */
  pairsFailed: number;

  /**
   * Number of parent/child pairs with bounding volume types that
   * could not be compared (for example, a box parent with a
   * region child)
   */
  pairsSkipped: number;

  /**
   * Up to 20 human-readable descriptions of failed pairs
   */
  failures: string[];
};

/**
 * Information about one output tileset
 */
export type OutputInfo = {
  version: string;
  tilesetJsonPath: string;
  entriesWritten: number;
  glbConvertedToB3dm: number;
  containment: ContainmentCheck;
  validation: ValidationSummary | undefined;
};

/**
 * The full conversion report
 */
export type ConversionReport = {
  input: string;
  timestamp: string;
  durationMilliseconds: number;

  inputTileCountExplicit: number;
  outputTileCount: number;
  implicitTileCount: number;
  contentTileCount: number;
  maxDepth: number;
  subtreeFilesSkipped: number;

  boundsMode: string;
  refinement: RefinementStats | undefined;

  /**
   * Names of glTF extensions found in `extensionsRequired` of any
   * GLB content, mapped to the number of contents that require them.
   * Clients that do not implement these will fail to load the content
   * regardless of the 3D Tiles version.
   */
  gltfExtensionsRequired: { [name: string]: number };
  gltfExtensionsUsed: { [name: string]: number };

  outputs: OutputInfo[];
};

/**
 * Methods for the containment check that is part of the report
 */
export class ConversionReports {
  /**
   * Checks that each parent bounding volume in the given tileset
   * contains the bounding volumes of its children.
   *
   * @param tileset - The tileset
   * @returns The check result
   */
  static checkContainment(tileset: Tileset): ContainmentCheck {
    const result: ContainmentCheck = {
      pairsChecked: 0,
      pairsFailed: 0,
      pairsSkipped: 0,
      failures: [],
    };
    ConversionReports.checkTile(tileset.root, "root", Matrix4.IDENTITY, result);
    return result;
  }

  private static checkTile(
    tile: Tile,
    path: string,
    parentTransform: Matrix4,
    result: ContainmentCheck
  ): void {
    const localTransform = tile.transform
      ? Matrix4.fromArray(tile.transform)
      : Matrix4.IDENTITY;
    const transform = Matrix4.multiply(
      parentTransform,
      localTransform,
      new Matrix4()
    );
    const children = tile.children ?? [];
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const childPath = `${path}/children[${i}]`;
      const childTransform = child.transform
        ? Matrix4.multiply(
            transform,
            Matrix4.fromArray(child.transform),
            new Matrix4()
          )
        : transform;
      const contained = ConversionReports.parentContainsChild(
        tile,
        child,
        childTransform
      );
      if (contained === undefined) {
        result.pairsSkipped++;
      } else {
        result.pairsChecked++;
        if (!contained) {
          result.pairsFailed++;
          if (result.failures.length < 20) {
            result.failures.push(
              `${childPath} is not contained in its parent bounding volume`
            );
          }
        }
      }
      ConversionReports.checkTile(child, childPath, transform, result);
    }
  }

  /**
   * Returns whether the parent bounding volume contains the child
   * bounding volume, or `undefined` if the types cannot be compared.
   *
   * @param parent - The parent tile
   * @param child - The child tile
   * @param childWorldTransform - The cumulative transform of the child,
   * mapping child-local coordinates to the tileset root frame
   */
  private static parentContainsChild(
    parent: Tile,
    child: Tile,
    childWorldTransform: Matrix4
  ): boolean | undefined {
    const parentBv = parent.boundingVolume;
    const childBv = child.boundingVolume;

    if (parentBv.region) {
      if (childBv.region) {
        return ConversionReports.regionContainsRegion(
          parentBv.region,
          childBv.region
        );
      }
      // Box and sphere children are checked via their corners in ECEF
      const corners = ConversionReports.computeChildCornersEcef(
        child,
        childWorldTransform
      );
      if (!corners) {
        return undefined;
      }
      for (const corner of corners) {
        if (!ConversionReports.regionContainsEcef(parentBv.region, corner)) {
          return false;
        }
      }
      return true;
    }

    if (childBv.region) {
      // A region child in a non-region parent cannot be compared
      // without the ellipsoid geometry of the region; skip
      return undefined;
    }

    // Both are boxes or spheres, in the frame of the parent after
    // applying the child transform
    let childBox: number[];
    if (childBv.box) {
      childBox = childBv.box;
    } else if (childBv.sphere) {
      const s = childBv.sphere;
      childBox = BoundingVolumes.createBoundingVolumeBoxFromMinMax(
        [s[0] - s[3], s[1] - s[3], s[2] - s[3]],
        [s[0] + s[3], s[1] + s[3], s[2] + s[3]]
      );
    } else {
      return undefined;
    }
    if (child.transform) {
      childBox = BoundingVolumes.transformBoundingVolumeBox(
        childBox,
        child.transform
      );
    }
    const corners = BoundingVolumes.computeBoundingVolumeBoxCorners(childBox);

    if (parentBv.box) {
      const epsilon = ConversionReports.computeBoxEpsilon(parentBv.box);
      for (const corner of corners) {
        if (
          !BoundingVolumeRefiner.boxContainsPoint(parentBv.box, corner, epsilon)
        ) {
          return false;
        }
      }
      return true;
    }
    if (parentBv.sphere) {
      const epsilon = 1e-6 * parentBv.sphere[3];
      for (const corner of corners) {
        if (
          !BoundingVolumesContainment.sphereContains(
            parentBv.sphere,
            corner,
            epsilon
          )
        ) {
          return false;
        }
      }
      return true;
    }
    return undefined;
  }

  /**
   * Computes the corners of the child bounding volume in ECEF, for
   * checking against a region parent
   */
  private static computeChildCornersEcef(
    child: Tile,
    childWorldTransform: Matrix4
  ): number[][] | undefined {
    const bv = child.boundingVolume;
    let box: number[];
    if (bv.box) {
      box = bv.box;
    } else if (bv.sphere) {
      const s = bv.sphere;
      box = BoundingVolumes.createBoundingVolumeBoxFromMinMax(
        [s[0] - s[3], s[1] - s[3], s[2] - s[3]],
        [s[0] + s[3], s[1] + s[3], s[2] + s[3]]
      );
    } else {
      return undefined;
    }
    const localCorners = BoundingVolumes.computeBoundingVolumeBoxCorners(box);
    const scratch = new Cartesian3();
    return localCorners.map((corner) => {
      Cartesian3.fromArray(corner, 0, scratch);
      Matrix4.multiplyByPoint(childWorldTransform, scratch, scratch);
      return [scratch.x, scratch.y, scratch.z];
    });
  }

  /**
   * An absolute epsilon for containment checks in the given box,
   * relative to its largest half axis
   */
  private static computeBoxEpsilon(box: number[]): number {
    let maxLength = 0;
    for (let i = 0; i < 3; i++) {
      const x = box[3 + i * 3];
      const y = box[4 + i * 3];
      const z = box[5 + i * 3];
      maxLength = Math.max(maxLength, Math.sqrt(x * x + y * y + z * z));
    }
    return Math.max(1e-9, maxLength * 1e-7);
  }

  private static readonly ANGULAR_EPSILON = 1e-10;
  private static readonly HEIGHT_EPSILON = 1e-3;

  /**
   * Returns whether the parent region contains the child region,
   * comparing latitudes and heights directly and longitudes relative
   * to the parent's western edge (so that regions across the
   * antimeridian work)
   */
  private static regionContainsRegion(
    parent: number[],
    child: number[]
  ): boolean {
    const eps = ConversionReports.ANGULAR_EPSILON;
    if (child[1] < parent[1] - eps || child[3] > parent[3] + eps) {
      return false;
    }
    const hEps = ConversionReports.HEIGHT_EPSILON;
    if (child[4] < parent[4] - hEps || child[5] > parent[5] + hEps) {
      return false;
    }
    const parentWidth = ConversionReports.longitudeWidth(parent[0], parent[2]);
    if (parentWidth >= CesiumMath.TWO_PI - eps) {
      return true;
    }
    const childWestOffset = ConversionReports.longitudeOffset(
      parent[0],
      child[0]
    );
    const childEastOffset = ConversionReports.longitudeOffset(
      parent[0],
      child[2]
    );
    const childWidth = ConversionReports.longitudeWidth(child[0], child[2]);
    return (
      childWestOffset <= parentWidth + eps &&
      childEastOffset <= parentWidth + eps &&
      childWestOffset + childWidth <= parentWidth + eps
    );
  }

  /**
   * The eastward angular distance from west to east, in [0, 2PI]. A
   * difference of exactly 2PI (a full circle) is preserved.
   */
  private static longitudeWidth(west: number, east: number): number {
    let width = east - west;
    if (width < 0) {
      width += CesiumMath.TWO_PI;
    }
    return width;
  }

  /**
   * The eastward angular distance from a reference longitude to a
   * point, where distances within epsilon of a full circle (caused
   * by rounding when the point is 1 ulp west of the reference) are
   * treated as zero
   */
  private static longitudeOffset(reference: number, point: number): number {
    const offset = ConversionReports.longitudeWidth(reference, point);
    if (offset >= CesiumMath.TWO_PI - ConversionReports.ANGULAR_EPSILON) {
      return 0;
    }
    return offset;
  }

  private static readonly scratchCartesian = new Cartesian3();
  private static readonly scratchCartographic = new Cartographic();

  /**
   * Returns whether the region contains the given ECEF point, with
   * separate epsilons for angles (radians) and heights (meters)
   */
  private static regionContainsEcef(
    region: number[],
    point: number[]
  ): boolean {
    const position = Cartesian3.fromArray(
      point,
      0,
      ConversionReports.scratchCartesian
    );
    const c = Cartographic.fromCartesian(
      position,
      Ellipsoid.WGS84,
      ConversionReports.scratchCartographic
    );
    if (!c) {
      return false;
    }
    const eps = ConversionReports.ANGULAR_EPSILON;
    const hEps = ConversionReports.HEIGHT_EPSILON;
    if (c.latitude < region[1] - eps || c.latitude > region[3] + eps) {
      return false;
    }
    if (c.height < region[4] - hEps || c.height > region[5] + hEps) {
      return false;
    }
    const width = ConversionReports.longitudeWidth(region[0], region[2]);
    if (width >= CesiumMath.TWO_PI - eps) {
      return true;
    }
    const offset = ConversionReports.longitudeOffset(region[0], c.longitude);
    return offset <= width + eps;
  }
}

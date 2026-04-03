import { Cartesian3 } from "cesium";
import { Math as CesiumMath } from "cesium";
import { Matrix3 } from "cesium";
import { Rectangle } from "cesium";

import { defined } from "../../../base";

import { BoundingVolume } from "../../../structure";
import { BoundingVolumeS2 } from "../../../structure";

import { HilbertOrder } from "./HilbertOrder";
import { S2Cell } from "./S2Cell";

/**
 * Methods to derive bounding volumes of implicit tiles.
 *
 * Largely ported from CesiumJS Implicit3DTileContent.js
 *
 * @internal
 */
export class BoundingVolumeDerivation {
  /**
   * Given the coordinates of a tile, derive its bounding volume from the root.
   *
   * @param rootBoundingVolume - The root bounding volume
   * @param implicitCoordinates - The coordinates of the child tile, as an
   * array [level,x,y] for quadtrees or [level,x,y,z] for octrees.
   * @returns An object containing the JSON for a bounding volume,
   * or `undefined` if the given bounding volume was of a type from
   * which no other bounding volume can be derived (i.e. when it
   * was a bounding sphere)
   */
  static deriveBoundingVolume(
    rootBoundingVolume: BoundingVolume,
    implicitCoordinates: number[]
  ): BoundingVolume | undefined {
    const level = implicitCoordinates[0];
    const x = implicitCoordinates[1];
    const y = implicitCoordinates[2];
    const z =
      implicitCoordinates.length > 3 ? implicitCoordinates[3] : undefined;

    if (
      rootBoundingVolume.extensions &&
      BoundingVolumeDerivation.hasExtension(
        rootBoundingVolume,
        "3DTILES_bounding_volume_S2"
      )
    ) {
      const extensions = rootBoundingVolume.extensions;
      const s2Object = extensions["3DTILES_bounding_volume_S2"];
      const boundingVolumeS2 = s2Object as BoundingVolumeS2;
      const childBoundingVolumeS2 =
        BoundingVolumeDerivation.deriveBoundingVolumeS2(
          boundingVolumeS2,
          level,
          x,
          y,
          z
        );
      return {
        extensions: {
          "3DTILES_bounding_volume_S2": childBoundingVolumeS2,
        },
      };
    }

    if (rootBoundingVolume.region) {
      const childRegion = BoundingVolumeDerivation.deriveBoundingRegion(
        rootBoundingVolume.region,
        level,
        x,
        y,
        z
      );

      return {
        region: childRegion,
      };
    }
    if (rootBoundingVolume.box) {
      const childBox = BoundingVolumeDerivation.deriveBoundingBox(
        rootBoundingVolume.box,
        level,
        x,
        y,
        z
      );

      return {
        box: childBox,
      };
    }

    // Bounding spheres cannot be derived:
    return undefined;
  }

  /**
   * Check if a specific extension is present on a JSON object. This can be used
   * for either 3D Tiles extensions or glTF extensions
   * @param json - The JSON object
   * @param extensionName - The name of the extension, e.g. '3DTILES_implicit_tiling'
   * @returns True if the extension is present
   * @internal
   */
  private static hasExtension(json: any, extensionName: string): boolean {
    return json && json.extensions && json.extensions[extensionName];
  }

  private static readonly scratchScaleFactors = new Cartesian3();
  private static readonly scratchRootCenter = new Cartesian3();
  private static readonly scratchCenter = new Cartesian3();
  private static readonly scratchHalfAxes = new Matrix3();

  /**
   * Derive a bounding volume for a descendant tile (child, grandchild, etc.),
   * assuming a quadtree or octree implicit tiling scheme. The (level, x, y, [z])
   * coordinates are given to select the descendant tile and compute its position
   * and dimensions.
   * <p>
   * If z is present, octree subdivision is used. Otherwise, quadtree subdivision
   * is used. Quadtrees are always divided at the midpoint of the the horizontal
   * dimensions, i.e. (x, y), leaving the z axis unchanged.
   * </p>
   * <p>
   * This computes the child volume directly from the root bounding volume rather
   * than recursively subdividing to minimize floating point error.
   * </p>
   *
   * @param rootBox - An array of 12 numbers representing the bounding box of the root tile
   * @param level - The level of the descendant tile relative to the root implicit tile
   * @param x - The x coordinate of the descendant tile
   * @param y - The y coordinate of the descendant tile
   * @param z - The z coordinate of the descendant tile (octree only)
   * @returns An array of 12 numbers representing the bounding box of the descendant tile.
   */
  private static deriveBoundingBox(
    rootBox: number[],
    level: number,
    x: number,
    y: number,
    z: number | undefined
  ): number[] {
    if (level === 0) {
      return rootBox;
    }

    const rootCenter = Cartesian3.unpack(
      rootBox,
      0,
      BoundingVolumeDerivation.scratchRootCenter
    );
    const rootHalfAxes = Matrix3.unpack(
      rootBox,
      3,
      BoundingVolumeDerivation.scratchHalfAxes
    );

    const tileScale = Math.pow(2, -level);
    const modelSpaceX = -1 + (2 * x + 1) * tileScale;
    const modelSpaceY = -1 + (2 * y + 1) * tileScale;

    let modelSpaceZ = 0;
    const scaleFactors = Cartesian3.fromElements(
      tileScale,
      tileScale,
      1,
      BoundingVolumeDerivation.scratchScaleFactors
    );

    if (defined(z)) {
      modelSpaceZ = -1 + (2 * z + 1) * tileScale;
      scaleFactors.z = tileScale;
    }

    let center = Cartesian3.fromElements(
      modelSpaceX,
      modelSpaceY,
      modelSpaceZ,
      BoundingVolumeDerivation.scratchCenter
    );
    center = Matrix3.multiplyByVector(
      rootHalfAxes,
      center,
      BoundingVolumeDerivation.scratchCenter
    );
    center = Cartesian3.add(
      center,
      rootCenter,
      BoundingVolumeDerivation.scratchCenter
    );

    let halfAxes = Matrix3.clone(rootHalfAxes);
    halfAxes = Matrix3.multiplyByScale(halfAxes, scaleFactors, halfAxes);

    const childBox = Array<number>(12);
    Cartesian3.pack(center, childBox);
    Matrix3.pack(halfAxes, childBox, 3);
    return childBox;
  }

  private static readonly scratchRectangle = new Rectangle();
  /**
   * Derive a bounding volume for a descendant tile (child, grandchild, etc.),
   * assuming a quadtree or octree implicit tiling scheme. The (level, x, y, [z])
   * coordinates are given to select the descendant tile and compute its position
   * and dimensions.
   * <p>
   * If z is present, octree subdivision is used. Otherwise, quadtree subdivision
   * is used. Quadtrees are always divided at the midpoint of the the horizontal
   * dimensions, i.e. (mid_longitude, mid_latitude), leaving the height values
   * unchanged.
   * </p>
   * <p>
   * This computes the child volume directly from the root bounding volume rather
   * than recursively subdividing to minimize floating point error.
   * </p>
   * @param rootRegion - An array of 6 numbers representing the root implicit tile
   * @param level - The level of the descendant tile relative to the root implicit tile
   * @param x - The x coordinate of the descendant tile
   * @param y - The x coordinate of the descendant tile
   * @param z - The z coordinate of the descendant tile (octree only)
   * @returns An array of 6 numbers representing the bounding region of the descendant tile
   * @internal
   */
  private static deriveBoundingRegion(
    rootRegion: number[],
    level: number,
    x: number,
    y: number,
    z: number | undefined
  ): number[] {
    if (level === 0) {
      return rootRegion.slice();
    }

    const rectangle = Rectangle.unpack(
      rootRegion,
      0,
      BoundingVolumeDerivation.scratchRectangle
    );
    const rootMinimumHeight = rootRegion[4];
    const rootMaximumHeight = rootRegion[5];
    const tileScale = Math.pow(2, -level);

    const childWidth = tileScale * rectangle.width;
    const west = CesiumMath.negativePiToPi(rectangle.west + x * childWidth);
    const east = CesiumMath.negativePiToPi(west + childWidth);

    const childHeight = tileScale * rectangle.height;
    const south = CesiumMath.negativePiToPi(rectangle.south + y * childHeight);
    const north = CesiumMath.negativePiToPi(south + childHeight);

    // Height is only subdivided for octrees; It remains constant for quadtrees.
    let minimumHeight = rootMinimumHeight;
    let maximumHeight = rootMaximumHeight;
    if (defined(z)) {
      const childThickness =
        tileScale * (rootMaximumHeight - rootMinimumHeight);
      minimumHeight += z * childThickness;
      maximumHeight = minimumHeight + childThickness;
    }

    return [west, south, east, north, minimumHeight, maximumHeight];
  }

  /**
   * Derive a bounding volume for a descendant tile (child, grandchild, etc.),
   * assuming a quadtree or octree implicit tiling scheme. The (level, x, y, [z])
   * coordinates are given to select the descendant tile and compute its position
   * and dimensions.
   * <p>
   * If z is present, octree subdivision is used. Otherwise, quadtree subdivision
   * is used. Quadtrees are always divided at the midpoint of the the horizontal
   * dimensions, i.e. (x, y), leaving the z axis unchanged.
   * </p>
   *
   * @param level - The level of the descendant tile relative to the root implicit tile
   * @param x - The x coordinate of the descendant tile
   * @param y - The y coordinate of the descendant tile
   * @param z - The z coordinate of the descendant tile (octree only)
   * @returns The new bounding volume
   * @internal
   */
  private static deriveBoundingVolumeS2(
    boundingVolumeS2: BoundingVolumeS2,
    level: number,
    x: number,
    y: number,
    z: number | undefined
  ): BoundingVolumeS2 {
    if (level === 0) {
      return boundingVolumeS2;
    }
    // Extract the first 3 face bits from the 64-bit S2 cell ID.
    // eslint-disable-next-line no-undef
    const baseCellId = S2Cell.getIdFromToken(boundingVolumeS2.token);
    const face = Number(baseCellId >> BigInt(61));
    // The Hilbert curve is rotated for the "odd" faces on the S2 Earthcube.
    // See http://s2geometry.io/devguide/img/s2cell_global.jpg
    const position =
      face % 2 === 0
        ? HilbertOrder.encode2D(level, x, y)
        : HilbertOrder.encode2D(level, y, x);
    const cellId = S2Cell.fromFacePositionLevel(face, BigInt(position), level);

    let minHeight, maxHeight;
    if (defined(z)) {
      // In CesiumJS, this information was computed from
      // the "childIndex" that was passed along, i.e. this
      // is equivalent to the condition "childIndex < 4"
      const lower = (z & 1) === 0;

      const midpointHeight =
        (boundingVolumeS2.maximumHeight + boundingVolumeS2.minimumHeight) / 2;
      minHeight = lower ? boundingVolumeS2.minimumHeight : midpointHeight;
      maxHeight = lower ? midpointHeight : boundingVolumeS2.maximumHeight;
    } else {
      minHeight = boundingVolumeS2.minimumHeight;
      maxHeight = boundingVolumeS2.maximumHeight;
    }

    return {
      token: S2Cell.getTokenFromId(cellId),
      minimumHeight: minHeight,
      maximumHeight: maxHeight,
    };
  }
}

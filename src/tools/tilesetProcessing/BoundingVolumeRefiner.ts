import { Cartesian3 } from "cesium";
import { Cartographic } from "cesium";
import { Ellipsoid } from "cesium";
import { Math as CesiumMath } from "cesium";
import { Matrix3 } from "cesium";
import { Matrix4 } from "cesium";
import * as Cesium from "cesium";

// S2Cell is exported by CesiumJS at runtime, but not declared in its types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const S2Cell: any = (Cesium as any).S2Cell;

import { BoundingVolume } from "../../structure";
import { BoundingVolumes } from "./BoundingVolumes";
import { BoundingVolumesContainment } from "./BoundingVolumesContainment";
import { Buffers } from "../../base";
import { ContentDataTypeRegistry } from "../../base";
import { ContentDataTypes } from "../../base";
import { GltfUtilities } from "../contentProcessing/GltfUtilities";
import { Loggers } from "../../base";
import { ResourceResolver } from "../../base";
import { Tile } from "../../structure";
import { Tiles } from "../../tilesets";
import { VertexProcessing } from "../contentProcessing/VertexProcessing";

const logger = Loggers.get("tilesetProcessing");

/**
 * The smallest half extent, in the units of the tile frame, that a
 * refined box will have along any axis. Planar content would otherwise
 * produce boxes with a zero-length half axis, which several clients
 * cannot invert.
 */
const MINIMUM_HALF_EXTENT = 1e-3;

/**
 * The content types whose vertices `VertexProcessing` can read. Any
 * other content type leaves the tile bounding volume unrefined.
 */
const READABLE_CONTENT_TYPES = new Set<string>([
  ContentDataTypes.CONTENT_TYPE_GLB,
  ContentDataTypes.CONTENT_TYPE_B3DM,
  ContentDataTypes.CONTENT_TYPE_I3DM,
  ContentDataTypes.CONTENT_TYPE_PNTS,
  ContentDataTypes.CONTENT_TYPE_CMPT,
]);

/**
 * glTF extensions whose geometry `VertexProcessing` does not expand.
 * Content that uses them keeps its original bounding volume.
 */
const UNSUPPORTED_GLTF_EXTENSIONS = ["EXT_mesh_gpu_instancing"];

/**
 * Number of samples along each S2 cell edge when converting a cell
 * to a region
 */
const S2_EDGE_SAMPLES = 16;

/**
 * Options for the bounding volume refinement
 */
export type RefinementOptions = {
  /**
   * Padding, in the units of the tile frame (meters for
   * untransformed tilesets), that is added on all sides of each
   * refined bounding volume
   */
  padding: number;
};

/**
 * Statistics about a refinement run
 */
export type RefinementStats = {
  /**
   * Number of tiles that were visited
   */
  tilesVisited: number;

  /**
   * Number of tiles whose bounding volume was replaced
   */
  tilesRefined: number;

  /**
   * Number of tiles that kept their original (derived) bounding
   * volume, because no content and no child information was
   * available, or because the content could not be read. In the
   * latter case, the original volume may have been expanded to
   * enclose the refined children.
   */
  tilesKeptOriginal: number;

  /**
   * Number of tiles whose content could not be read completely, and
   * which therefore kept their original bounding volume
   */
  tilesWithUnreadableContent: number;

  /**
   * Number of tiles whose content vertices were NOT all contained
   * in the original bounding volume (the "loose or wrong bounds"
   * situation this tool is meant to fix)
   */
  tilesWithContentOutsideOriginal: number;

  /**
   * The largest distance (in tile frame units, meters for untransformed
   * tilesets) by which a content vertex lay outside its tile's original
   * box or sphere. Only computed for boxes and spheres.
   */
  maxContentDistanceOutsideOriginal: number;

  /**
   * Total number of content vertices that were processed
   */
  verticesProcessed: number;

  /**
   * Sum over all refined tiles of (refined volume / original volume).
   * Divide by `tilesRefined` for the mean shrink ratio.
   */
  volumeRatioSum: number;

  /**
   * Per-tile refinement messages for content that could not be
   * read or bounding volumes that could not be refined
   */
  warnings: string[];
};

/**
 * Tight bounds of a set of points, expressed in the frame of
 * a reference box (see `BoxFrame`)
 */
type Extents = {
  min: number[];
  max: number[];
};

/**
 * An orthonormal frame derived from a bounding volume box:
 * the box center, and the normalized half-axis directions
 * as the columns of a rotation matrix.
 */
type BoxFrame = {
  center: Cartesian3;
  rotation: Matrix3;
};

type RegionExtents = {
  /**
   * The reference longitude, in radians, around which longitude
   * differences are measured (to handle the antimeridian)
   */
  referenceLongitude: number;
  minDeltaLongitude: number;
  maxDeltaLongitude: number;
  minLatitude: number;
  maxLatitude: number;
  minHeight: number;
  maxHeight: number;
};

type S2Volume = { token: string; minimumHeight: number; maximumHeight: number };

/**
 * Accumulates the bounds of content vertices and child volumes for
 * one tile, without storing the vertices
 */
type Accumulator = {
  kind: "box" | "region";

  // Box accumulation (in the tile frame)
  frame: BoxFrame | undefined;
  extents: Extents | undefined;

  // Region accumulation (cartographic)
  regionExtents: RegionExtents | undefined;
  fallbackRegion: number[] | undefined;

  /**
   * The cumulative transform of the tile (only used for regions)
   */
  transform: Matrix4;

  vertexCount: number;
  outsideCount: number;
  maxOutsideDistance: number;
  complete: boolean;
};

/**
 * Methods to replace the bounding volumes of an explicit tile
 * hierarchy with tight bounding volumes that are computed from
 * the actual tile content, and that are unioned bottom-up so
 * that each parent encloses all of its children.
 *
 * Bounding volume boxes keep the orientation of the original
 * (derived) box. Regions and S2 cells become regions. Spheres
 * become boxes.
 */
export class BoundingVolumeRefiner {
  /**
   * Refines the bounding volumes of the given hierarchy, in place.
   *
   * @param root - The root tile of the explicit hierarchy
   * @param resourceResolver - The resolver for content data
   * @param options - The options
   * @returns The refinement statistics
   */
  static async refine(
    root: Tile,
    resourceResolver: ResourceResolver,
    options: RefinementOptions
  ): Promise<RefinementStats> {
    const stats: RefinementStats = {
      tilesVisited: 0,
      tilesRefined: 0,
      tilesKeptOriginal: 0,
      tilesWithUnreadableContent: 0,
      tilesWithContentOutsideOriginal: 0,
      maxContentDistanceOutsideOriginal: 0,
      verticesProcessed: 0,
      volumeRatioSum: 0,
      warnings: [],
    };
    await BoundingVolumeRefiner.refineTile(
      root,
      Matrix4.IDENTITY,
      resourceResolver,
      options,
      stats
    );
    return stats;
  }

  /**
   * Refines the given tile and (recursively, first) its children.
   *
   * @param tile - The tile
   * @param parentTransform - The cumulative transform of the parent,
   * mapping parent-local coordinates to the tileset root frame
   * @param resourceResolver - The resource resolver
   * @param options - The options
   * @param stats - The statistics to update
   */
  private static async refineTile(
    tile: Tile,
    parentTransform: Matrix4,
    resourceResolver: ResourceResolver,
    options: RefinementOptions,
    stats: RefinementStats
  ): Promise<void> {
    stats.tilesVisited++;

    const localTransform = tile.transform
      ? Matrix4.fromArray(tile.transform)
      : Matrix4.IDENTITY;
    const transform = Matrix4.multiply(
      parentTransform,
      localTransform,
      new Matrix4()
    );

    const children = tile.children ?? [];
    for (const child of children) {
      await BoundingVolumeRefiner.refineTile(
        child,
        transform,
        resourceResolver,
        options,
        stats
      );
    }

    const original = tile.boundingVolume;
    const accumulator = BoundingVolumeRefiner.createAccumulator(
      original,
      transform
    );
    if (!accumulator) {
      stats.tilesKeptOriginal++;
      return;
    }

    await BoundingVolumeRefiner.accumulateContent(
      tile,
      original,
      accumulator,
      resourceResolver,
      stats
    );
    stats.verticesProcessed += accumulator.vertexCount;
    if (accumulator.outsideCount > 0) {
      stats.tilesWithContentOutsideOriginal++;
      stats.maxContentDistanceOutsideOriginal = Math.max(
        stats.maxContentDistanceOutsideOriginal,
        accumulator.maxOutsideDistance
      );
    }
    if (!accumulator.complete) {
      stats.tilesWithUnreadableContent++;
      stats.tilesKeptOriginal++;
      // The original volume is kept, but the refined children may stick
      // out of it (for example, through the minimum half extent), so the
      // original volume is expanded to enclose them
      if (children.length > 0) {
        BoundingVolumeRefiner.accumulateOriginal(accumulator, original);
        const compatible = BoundingVolumeRefiner.accumulateChildren(
          accumulator,
          children
        );
        const expanded = compatible
          ? BoundingVolumeRefiner.finalize(accumulator, { padding: 0 })
          : undefined;
        if (expanded) {
          tile.boundingVolume = expanded;
        }
      }
      return;
    }

    const childrenCompatible = BoundingVolumeRefiner.accumulateChildren(
      accumulator,
      children
    );
    if (!childrenCompatible) {
      stats.warnings.push(
        `Tile with contents ${Tiles.getContentUris(tile)} has children ` +
          `with incompatible bounding volume types; keeping its original volume`
      );
      stats.tilesKeptOriginal++;
      return;
    }

    const refined = BoundingVolumeRefiner.finalize(accumulator, options);
    if (!refined) {
      stats.tilesKeptOriginal++;
      return;
    }

    const originalVolume = BoundingVolumeRefiner.computeVolume(original);
    const refinedVolume = BoundingVolumeRefiner.computeVolume(refined);
    if (
      originalVolume !== undefined &&
      refinedVolume !== undefined &&
      originalVolume > 0
    ) {
      stats.volumeRatioSum += refinedVolume / originalVolume;
    } else {
      stats.volumeRatioSum += 1;
    }
    stats.tilesRefined++;
    tile.boundingVolume = refined;

    // Content bounding volumes were derived for the original tile volume
    // and may no longer be contained in the refined one. The tile volume
    // is now tight around the content anyway.
    for (const content of Tiles.getContents(tile)) {
      delete content.boundingVolume;
    }
  }

  // ---------------------------------------------------------------------
  // Accumulation

  /**
   * Creates the accumulator for the given original bounding volume,
   * or `undefined` if the volume type is not supported
   */
  private static createAccumulator(
    original: BoundingVolume,
    transform: Matrix4
  ): Accumulator | undefined {
    const base = {
      frame: undefined,
      extents: undefined,
      regionExtents: undefined,
      fallbackRegion: undefined,
      transform: transform,
      vertexCount: 0,
      outsideCount: 0,
      maxOutsideDistance: 0,
      complete: true,
    };
    if (original.box) {
      return {
        ...base,
        kind: "box",
        frame: BoundingVolumeRefiner.createBoxFrame(original.box),
        extents: BoundingVolumeRefiner.createEmptyExtents(),
      };
    }
    if (original.sphere) {
      const s = original.sphere;
      return {
        ...base,
        kind: "box",
        frame: {
          center: new Cartesian3(s[0], s[1], s[2]),
          rotation: Matrix3.clone(Matrix3.IDENTITY),
        },
        extents: BoundingVolumeRefiner.createEmptyExtents(),
      };
    }
    if (original.region) {
      return {
        ...base,
        kind: "region",
        regionExtents: BoundingVolumeRefiner.createEmptyRegionExtents(
          BoundingVolumeRefiner.computeRegionCenterLongitude(original.region)
        ),
      };
    }
    const s2 = original.extensions?.["3DTILES_bounding_volume_S2"] as
      | S2Volume
      | undefined;
    if (s2) {
      const fallbackRegion = BoundingVolumeRefiner.s2ToRegion(s2);
      return {
        ...base,
        kind: "region",
        regionExtents: BoundingVolumeRefiner.createEmptyRegionExtents(
          BoundingVolumeRefiner.computeRegionCenterLongitude(fallbackRegion)
        ),
        fallbackRegion: fallbackRegion,
      };
    }
    return undefined;
  }

  /**
   * Reads all content of the given tile and feeds the vertex positions
   * into the accumulator. Positions are in the local frame of the tile
   * (after the y-up-to-z-up conversion of glTF, and after applying RTC
   * centers or node transforms).
   *
   * Sets `accumulator.complete` to `false` when any content could not
   * be read or has a type whose vertices cannot be processed.
   */
  private static async accumulateContent(
    tile: Tile,
    original: BoundingVolume,
    accumulator: Accumulator,
    resourceResolver: ResourceResolver,
    stats: RefinementStats
  ): Promise<void> {
    const scratchPosition = new Cartesian3();
    const scratchCartographic = new Cartographic();
    const ecef = [0, 0, 0];

    const consumer = (p: number[]) => {
      accumulator.vertexCount++;
      if (accumulator.kind === "box") {
        BoundingVolumeRefiner.expandExtents(
          accumulator.extents as Extents,
          accumulator.frame as BoxFrame,
          p
        );
        const distance = BoundingVolumeRefiner.localVolumeDistanceOutside(
          original,
          p
        );
        if (distance > 1e-6) {
          accumulator.outsideCount++;
          accumulator.maxOutsideDistance = Math.max(
            accumulator.maxOutsideDistance,
            distance
          );
        }
        return;
      }
      Cartesian3.fromArray(p, 0, scratchPosition);
      Matrix4.multiplyByPoint(
        accumulator.transform,
        scratchPosition,
        scratchPosition
      );
      const cartographic = Cartographic.fromCartesian(
        scratchPosition,
        Ellipsoid.WGS84,
        scratchCartographic
      );
      if (!cartographic) {
        // Point at the ellipsoid center
        return;
      }
      BoundingVolumeRefiner.expandRegionExtents(
        accumulator.regionExtents as RegionExtents,
        cartographic
      );
      if (original.region) {
        Cartesian3.pack(scratchPosition, ecef, 0);
        if (
          !BoundingVolumesContainment.regionContains(
            original.region,
            ecef,
            1e-7
          )
        ) {
          accumulator.outsideCount++;
        }
      }
    };

    const externalGlbResolver = async (
      uri: string
    ): Promise<Buffer | undefined> => {
      const data = await resourceResolver.resolveData(uri);
      if (!data) {
        return undefined;
      }
      return BoundingVolumeRefiner.ungzip(data);
    };

    const contentUris = Tiles.getContentUris(tile);
    for (const contentUri of contentUris) {
      let data = await resourceResolver.resolveData(contentUri);
      if (!data) {
        stats.warnings.push(
          `Could not read content ${contentUri}; keeping original bounding volume`
        );
        accumulator.complete = false;
        continue;
      }
      data = BoundingVolumeRefiner.ungzip(data);
      const type = await ContentDataTypeRegistry.findType(contentUri, data);
      if (type === undefined || !READABLE_CONTENT_TYPES.has(type)) {
        stats.warnings.push(
          `Content ${contentUri} has type ${type} whose vertices cannot be ` +
            `read; keeping original bounding volume`
        );
        accumulator.complete = false;
        continue;
      }
      if (type === ContentDataTypes.CONTENT_TYPE_GLB) {
        const unsupported =
          BoundingVolumeRefiner.findUnsupportedGltfExtensions(data);
        if (unsupported.length > 0) {
          stats.warnings.push(
            `Content ${contentUri} uses ${unsupported}, which is not ` +
              `supported for bounding volume computation; keeping original ` +
              `bounding volume`
          );
          accumulator.complete = false;
          continue;
        }
      }
      try {
        await VertexProcessing.fromContent(
          contentUri,
          data,
          externalGlbResolver,
          false,
          consumer
        );
      } catch (e) {
        stats.warnings.push(
          `Could not process vertices of content ${contentUri}: ${e}; ` +
            `keeping original bounding volume`
        );
        accumulator.complete = false;
      }
    }
  }

  /**
   * Adds the original bounding volume of a tile to the accumulator
   */
  private static accumulateOriginal(
    accumulator: Accumulator,
    original: BoundingVolume
  ): void {
    if (accumulator.kind === "box") {
      let box = original.box;
      if (!box && original.sphere) {
        const s = original.sphere;
        box = BoundingVolumes.createBoundingVolumeBoxFromMinMax(
          [s[0] - s[3], s[1] - s[3], s[2] - s[3]],
          [s[0] + s[3], s[1] + s[3], s[2] + s[3]]
        );
      }
      if (!box) {
        return;
      }
      for (const corner of BoundingVolumes.computeBoundingVolumeBoxCorners(
        box
      )) {
        BoundingVolumeRefiner.expandExtents(
          accumulator.extents as Extents,
          accumulator.frame as BoxFrame,
          corner
        );
      }
      return;
    }
    const region = original.region ?? accumulator.fallbackRegion;
    if (region) {
      BoundingVolumeRefiner.expandRegionExtentsByRegion(
        accumulator.regionExtents as RegionExtents,
        region
      );
    }
  }

  /**
   * Adds the (already refined) bounding volumes of the given children
   * to the accumulator. Returns `false` if a child has a bounding volume
   * type that cannot be unioned into the accumulator.
   */
  private static accumulateChildren(
    accumulator: Accumulator,
    children: Tile[]
  ): boolean {
    for (const child of children) {
      if (accumulator.kind === "box") {
        const corners =
          BoundingVolumeRefiner.computeCornersInParentFrame(child);
        if (!corners) {
          return false;
        }
        for (const corner of corners) {
          BoundingVolumeRefiner.expandExtents(
            accumulator.extents as Extents,
            accumulator.frame as BoxFrame,
            corner
          );
        }
      } else {
        const childRegion = BoundingVolumeRefiner.getRegion(
          child.boundingVolume
        );
        if (!childRegion) {
          return false;
        }
        BoundingVolumeRefiner.expandRegionExtentsByRegion(
          accumulator.regionExtents as RegionExtents,
          childRegion
        );
      }
    }
    return true;
  }

  /**
   * Creates the refined bounding volume from the accumulator, or
   * `undefined` if nothing was accumulated
   */
  private static finalize(
    accumulator: Accumulator,
    options: RefinementOptions
  ): BoundingVolume | undefined {
    const padding = options.padding;
    if (accumulator.kind === "box") {
      const extents = accumulator.extents as Extents;
      if (!BoundingVolumeRefiner.isValidExtents(extents)) {
        return undefined;
      }
      for (let i = 0; i < 3; i++) {
        extents.min[i] -= padding;
        extents.max[i] += padding;
      }
      return {
        box: BoundingVolumeRefiner.createBoxFromExtents(
          accumulator.frame as BoxFrame,
          extents
        ),
      };
    }

    const extents = accumulator.regionExtents as RegionExtents;
    if (!BoundingVolumeRefiner.isValidRegionExtents(extents)) {
      if (!accumulator.fallbackRegion) {
        return undefined;
      }
      BoundingVolumeRefiner.expandRegionExtentsByRegion(
        extents,
        accumulator.fallbackRegion
      );
    }
    return {
      region: BoundingVolumeRefiner.createRegionFromExtents(extents, padding),
    };
  }

  private static ungzip(data: Buffer): Buffer {
    if (Buffers.isGzipped(data)) {
      return Buffers.gunzip(data);
    }
    return data;
  }

  private static findUnsupportedGltfExtensions(glb: Buffer): string[] {
    try {
      const json = JSON.parse(GltfUtilities.extractJsonFromGlb(glb).toString());
      const used: string[] = json.extensionsUsed ?? [];
      return used.filter((name) => UNSUPPORTED_GLTF_EXTENSIONS.includes(name));
    } catch (e) {
      return [];
    }
  }

  // ---------------------------------------------------------------------
  // Boxes

  /**
   * Creates the orthonormal frame of the given box.
   *
   * A single degenerate half axis (zero length, common for flat 2.5D
   * data) is replaced with the normal of the other two. When more than
   * one axis is degenerate, or the axes are not orthogonal, the frame
   * falls back to the identity rotation.
   *
   * @param box - The box
   * @returns The frame
   */
  private static createBoxFrame(box: number[]): BoxFrame {
    const center = Cartesian3.fromArray(box, 0, new Cartesian3());
    const halfAxes = Matrix3.fromArray(box, 3, new Matrix3());
    const columns = [new Cartesian3(), new Cartesian3(), new Cartesian3()];
    const degenerate: number[] = [];
    for (let i = 0; i < 3; i++) {
      Matrix3.getColumn(halfAxes, i, columns[i]);
      const length = Cartesian3.magnitude(columns[i]);
      if (length < CesiumMath.EPSILON12) {
        degenerate.push(i);
      } else {
        Cartesian3.divideByScalar(columns[i], length, columns[i]);
      }
    }
    if (degenerate.length > 1) {
      return { center: center, rotation: Matrix3.clone(Matrix3.IDENTITY) };
    }
    if (degenerate.length === 1) {
      const i = degenerate[0];
      const a = columns[(i + 1) % 3];
      const b = columns[(i + 2) % 3];
      Cartesian3.cross(a, b, columns[i]);
      if (Cartesian3.magnitude(columns[i]) < CesiumMath.EPSILON12) {
        // The remaining axes are parallel
        return { center: center, rotation: Matrix3.clone(Matrix3.IDENTITY) };
      }
      Cartesian3.normalize(columns[i], columns[i]);
    }
    const rotation = new Matrix3();
    for (let i = 0; i < 3; i++) {
      Matrix3.setColumn(rotation, i, columns[i], rotation);
    }
    // Guard against non-orthogonal half axes (not allowed by the
    // specification, but seen in the wild): fall back to identity
    const check = Matrix3.multiply(
      Matrix3.transpose(rotation, new Matrix3()),
      rotation,
      new Matrix3()
    );
    if (!Matrix3.equalsEpsilon(check, Matrix3.IDENTITY, CesiumMath.EPSILON6)) {
      return { center: center, rotation: Matrix3.clone(Matrix3.IDENTITY) };
    }
    return { center: center, rotation: rotation };
  }

  private static createEmptyExtents(): Extents {
    return {
      min: [Infinity, Infinity, Infinity],
      max: [-Infinity, -Infinity, -Infinity],
    };
  }

  private static isValidExtents(extents: Extents): boolean {
    for (let i = 0; i < 3; i++) {
      if (!(extents.min[i] <= extents.max[i])) {
        return false;
      }
    }
    return true;
  }

  private static readonly scratchLocal = new Cartesian3();
  private static readonly scratchDelta = new Cartesian3();
  private static readonly scratchRotationInverse = new Matrix3();

  /**
   * Expands the given extents to include the given point, expressed
   * in the given frame.
   */
  private static expandExtents(
    extents: Extents,
    frame: BoxFrame,
    point: number[]
  ): void {
    const delta = Cartesian3.fromArray(
      point,
      0,
      BoundingVolumeRefiner.scratchDelta
    );
    Cartesian3.subtract(delta, frame.center, delta);
    const inverse = Matrix3.transpose(
      frame.rotation,
      BoundingVolumeRefiner.scratchRotationInverse
    );
    const local = Matrix3.multiplyByVector(
      inverse,
      delta,
      BoundingVolumeRefiner.scratchLocal
    );
    extents.min[0] = Math.min(extents.min[0], local.x);
    extents.min[1] = Math.min(extents.min[1], local.y);
    extents.min[2] = Math.min(extents.min[2], local.z);
    extents.max[0] = Math.max(extents.max[0], local.x);
    extents.max[1] = Math.max(extents.max[1], local.y);
    extents.max[2] = Math.max(extents.max[2], local.z);
  }

  /**
   * Creates a 12-element box from the given frame and extents
   */
  private static createBoxFromExtents(
    frame: BoxFrame,
    extents: Extents
  ): number[] {
    const mid = new Cartesian3(
      (extents.min[0] + extents.max[0]) * 0.5,
      (extents.min[1] + extents.max[1]) * 0.5,
      (extents.min[2] + extents.max[2]) * 0.5
    );
    const halfExtents = new Cartesian3(
      Math.max(MINIMUM_HALF_EXTENT, (extents.max[0] - extents.min[0]) * 0.5),
      Math.max(MINIMUM_HALF_EXTENT, (extents.max[1] - extents.min[1]) * 0.5),
      Math.max(MINIMUM_HALF_EXTENT, (extents.max[2] - extents.min[2]) * 0.5)
    );
    const center = Matrix3.multiplyByVector(
      frame.rotation,
      mid,
      new Cartesian3()
    );
    Cartesian3.add(center, frame.center, center);
    const halfAxes = Matrix3.multiplyByScale(
      frame.rotation,
      halfExtents,
      new Matrix3()
    );
    const box = Array<number>(12);
    Cartesian3.pack(center, box, 0);
    Matrix3.pack(halfAxes, box, 3);
    return box;
  }

  /**
   * Computes the 8 corners of the bounding volume of the given child,
   * transformed with the child transform, so that they are given in
   * the frame of the parent tile. Spheres are converted to their
   * axis-aligned bounding box. Returns `undefined` for regions.
   */
  private static computeCornersInParentFrame(
    child: Tile
  ): number[][] | undefined {
    const bv = child.boundingVolume;
    let box: number[] | undefined;
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
    if (child.transform) {
      box = BoundingVolumes.transformBoundingVolumeBox(box, child.transform);
    }
    return BoundingVolumes.computeBoundingVolumeBoxCorners(box);
  }

  // ---------------------------------------------------------------------
  // Regions and S2 cells

  private static createEmptyRegionExtents(
    referenceLongitude: number
  ): RegionExtents {
    return {
      referenceLongitude: referenceLongitude,
      minDeltaLongitude: Infinity,
      maxDeltaLongitude: -Infinity,
      minLatitude: Infinity,
      maxLatitude: -Infinity,
      minHeight: Infinity,
      maxHeight: -Infinity,
    };
  }

  private static isValidRegionExtents(extents: RegionExtents): boolean {
    return (
      extents.minDeltaLongitude <= extents.maxDeltaLongitude &&
      extents.minLatitude <= extents.maxLatitude &&
      extents.minHeight <= extents.maxHeight
    );
  }

  /**
   * Creates a region from the given extents. When the longitude
   * extents (plus padding) cover the full circle, the region spans
   * from -PI to PI instead of wrapping into a sliver.
   */
  private static createRegionFromExtents(
    extents: RegionExtents,
    padding: number
  ): number[] {
    const angularPadding = padding / Ellipsoid.WGS84.minimumRadius;
    let west: number;
    let east: number;
    const longitudeSpan =
      extents.maxDeltaLongitude -
      extents.minDeltaLongitude +
      2 * angularPadding;
    if (longitudeSpan >= CesiumMath.TWO_PI - CesiumMath.EPSILON10) {
      west = -CesiumMath.PI;
      east = CesiumMath.PI;
    } else {
      west = CesiumMath.negativePiToPi(
        extents.referenceLongitude + extents.minDeltaLongitude - angularPadding
      );
      east = CesiumMath.negativePiToPi(
        extents.referenceLongitude + extents.maxDeltaLongitude + angularPadding
      );
    }
    const south = Math.max(
      -CesiumMath.PI_OVER_TWO,
      extents.minLatitude - angularPadding
    );
    const north = Math.min(
      CesiumMath.PI_OVER_TWO,
      extents.maxLatitude + angularPadding
    );
    return [
      west,
      south,
      east,
      north,
      extents.minHeight - padding,
      extents.maxHeight + padding,
    ];
  }

  static computeRegionCenterLongitude(region: number[]): number {
    const west = region[0];
    const east = region[2];
    let width = east - west;
    if (width < 0) {
      width += CesiumMath.TWO_PI;
    }
    return CesiumMath.negativePiToPi(west + width * 0.5);
  }

  private static expandRegionExtents(
    extents: RegionExtents,
    cartographic: Cartographic
  ): void {
    const deltaLongitude = CesiumMath.negativePiToPi(
      cartographic.longitude - extents.referenceLongitude
    );
    extents.minDeltaLongitude = Math.min(
      extents.minDeltaLongitude,
      deltaLongitude
    );
    extents.maxDeltaLongitude = Math.max(
      extents.maxDeltaLongitude,
      deltaLongitude
    );
    extents.minLatitude = Math.min(extents.minLatitude, cartographic.latitude);
    extents.maxLatitude = Math.max(extents.maxLatitude, cartographic.latitude);
    extents.minHeight = Math.min(extents.minHeight, cartographic.height);
    extents.maxHeight = Math.max(extents.maxHeight, cartographic.height);
  }

  private static expandRegionExtentsByRegion(
    extents: RegionExtents,
    region: number[]
  ): void {
    const west = region[0];
    const south = region[1];
    const east = region[2];
    const north = region[3];
    const minHeight = region[4];
    const maxHeight = region[5];
    // Express west and east relative to the reference longitude. The
    // width is computed first, so that regions across the antimeridian
    // and full-circle regions are handled correctly.
    let width = east - west;
    if (width < 0) {
      width += CesiumMath.TWO_PI;
    }
    let deltaWest: number;
    let deltaEast: number;
    if (width >= CesiumMath.TWO_PI - CesiumMath.EPSILON10) {
      deltaWest = -CesiumMath.PI;
      deltaEast = CesiumMath.PI;
    } else {
      deltaWest = CesiumMath.negativePiToPi(west - extents.referenceLongitude);
      deltaEast = deltaWest + width;
    }
    extents.minDeltaLongitude = Math.min(extents.minDeltaLongitude, deltaWest);
    extents.maxDeltaLongitude = Math.max(extents.maxDeltaLongitude, deltaEast);
    extents.minLatitude = Math.min(extents.minLatitude, south);
    extents.maxLatitude = Math.max(extents.maxLatitude, north);
    extents.minHeight = Math.min(extents.minHeight, minHeight);
    extents.maxHeight = Math.max(extents.maxHeight, maxHeight);
  }

  /**
   * Returns the region of the given bounding volume, converting an S2
   * volume if necessary, or `undefined` if it has neither
   */
  private static getRegion(
    boundingVolume: BoundingVolume
  ): number[] | undefined {
    if (boundingVolume.region) {
      return boundingVolume.region;
    }
    const s2 = boundingVolume.extensions?.["3DTILES_bounding_volume_S2"] as
      | S2Volume
      | undefined;
    if (s2) {
      return BoundingVolumeRefiner.s2ToRegion(s2);
    }
    return undefined;
  }

  /**
   * Converts an S2 cell bounding volume into a region.
   *
   * CesiumJS interprets the spherical coordinates of S2 cell vertices
   * as geodetic longitude and latitude, so the cell is sampled on the
   * unit sphere and the samples are read back as longitude and
   * latitude directly. Cell edges are great circles, so points along
   * each edge and the latitude extremum of each edge are included.
   * Cells whose samples span more than half of the longitude circle
   * contain a pole; they receive the full longitude range and the
   * corresponding polar latitude.
   *
   * @param s2 - The S2 bounding volume
   * @returns The region
   */
  static s2ToRegion(s2: S2Volume): number[] {
    if (!S2Cell) {
      throw new Error(
        "The CesiumJS build does not export S2Cell; S2 bounding volumes " +
          "cannot be converted"
      );
    }
    const cell = S2Cell.fromToken(s2.token);
    const toUnitSphere = (ecef: Cartesian3): Cartesian3 => {
      const c = Cartographic.fromCartesian(ecef, Ellipsoid.WGS84);
      const cosLat = Math.cos(c.latitude);
      return new Cartesian3(
        cosLat * Math.cos(c.longitude),
        cosLat * Math.sin(c.longitude),
        Math.sin(c.latitude)
      );
    };
    const center = toUnitSphere(cell.getCenter());
    const centerLongitude = Math.atan2(center.y, center.x);
    const extents =
      BoundingVolumeRefiner.createEmptyRegionExtents(centerLongitude);

    const vertices: Cartesian3[] = [];
    for (let i = 0; i < 4; i++) {
      vertices.push(toUnitSphere(cell.getVertex(i)));
    }
    const cartographic = new Cartographic();
    const addSample = (unit: Cartesian3) => {
      cartographic.longitude = Math.atan2(unit.y, unit.x);
      cartographic.latitude = Math.asin(CesiumMath.clamp(unit.z, -1, 1));
      cartographic.height = s2.minimumHeight;
      BoundingVolumeRefiner.expandRegionExtents(extents, cartographic);
      cartographic.height = s2.maximumHeight;
      BoundingVolumeRefiner.expandRegionExtents(extents, cartographic);
    };
    const sample = new Cartesian3();
    const normal = new Cartesian3();
    const extremum = new Cartesian3();
    const scratchCross = new Cartesian3();
    const zAxis = Cartesian3.UNIT_Z;
    for (let i = 0; i < 4; i++) {
      const a = vertices[i];
      const b = vertices[(i + 1) % 4];
      for (let k = 0; k < S2_EDGE_SAMPLES; k++) {
        const t = k / S2_EDGE_SAMPLES;
        Cartesian3.lerp(a, b, t, sample);
        Cartesian3.normalize(sample, sample);
        addSample(sample);
      }
      // The latitude extrema of the great circle through a and b are
      // +/- the projection of the z axis onto the circle plane. Include
      // them when they lie on the arc between a and b.
      Cartesian3.cross(a, b, normal);
      if (Cartesian3.magnitude(normal) < CesiumMath.EPSILON12) {
        continue;
      }
      Cartesian3.normalize(normal, normal);
      const zDotN = Cartesian3.dot(zAxis, normal);
      Cartesian3.multiplyByScalar(normal, zDotN, extremum);
      Cartesian3.subtract(zAxis, extremum, extremum);
      if (Cartesian3.magnitude(extremum) < CesiumMath.EPSILON12) {
        continue;
      }
      Cartesian3.normalize(extremum, extremum);
      for (const sign of [1, -1]) {
        const p = Cartesian3.multiplyByScalar(extremum, sign, sample);
        const afterA =
          Cartesian3.dot(Cartesian3.cross(a, p, scratchCross), normal) >= 0;
        const beforeB =
          Cartesian3.dot(Cartesian3.cross(p, b, scratchCross), normal) >= 0;
        if (afterA && beforeB) {
          addSample(p);
        }
      }
    }
    addSample(center);

    const longitudeSpan = extents.maxDeltaLongitude - extents.minDeltaLongitude;
    if (longitudeSpan > CesiumMath.PI) {
      // The cell contains a pole
      extents.minDeltaLongitude = -CesiumMath.PI;
      extents.maxDeltaLongitude = CesiumMath.PI;
      extents.referenceLongitude = 0;
      if (center.z >= 0) {
        extents.maxLatitude = CesiumMath.PI_OVER_TWO;
      } else {
        extents.minLatitude = -CesiumMath.PI_OVER_TWO;
      }
    }
    return BoundingVolumeRefiner.createRegionFromExtents(extents, 0);
  }

  // ---------------------------------------------------------------------
  // Containment and volume

  /**
   * Returns how far the given point (in the tile frame) lies outside the
   * given box or sphere, or 0 if it is contained. Regions and other
   * types return 0.
   */
  private static localVolumeDistanceOutside(
    boundingVolume: BoundingVolume,
    point: number[]
  ): number {
    if (boundingVolume.box) {
      return BoundingVolumeRefiner.boxDistanceOutside(
        boundingVolume.box,
        point
      );
    }
    if (boundingVolume.sphere) {
      const s = boundingVolume.sphere;
      const dx = point[0] - s[0];
      const dy = point[1] - s[1];
      const dz = point[2] - s[2];
      return Math.max(0, Math.sqrt(dx * dx + dy * dy + dz * dz) - s[3]);
    }
    return 0;
  }

  /**
   * Returns the largest per-axis distance by which the given point lies
   * outside the given box, or 0 if it is contained. Degenerate axes use
   * the normal of the other two, as in `boxContainsPoint`.
   */
  static boxDistanceOutside(box: number[], point: number[]): number {
    const offset = BoundingVolumeRefiner.scratchOffset;
    offset.x = point[0] - box[0];
    offset.y = point[1] - box[1];
    offset.z = point[2] - box[2];
    const halfAxes = Matrix3.fromArray(
      box,
      3,
      BoundingVolumeRefiner.scratchHalfAxes
    );
    const axes = BoundingVolumeRefiner.scratchColumns;
    const lengths = [0, 0, 0];
    for (let i = 0; i < 3; i++) {
      Matrix3.getColumn(halfAxes, i, axes[i]);
      lengths[i] = Cartesian3.magnitude(axes[i]);
    }
    let maxDistance = 0;
    for (let i = 0; i < 3; i++) {
      const direction = BoundingVolumeRefiner.scratchAxis;
      if (lengths[i] < CesiumMath.EPSILON14) {
        if (
          lengths[(i + 1) % 3] < CesiumMath.EPSILON14 ||
          lengths[(i + 2) % 3] < CesiumMath.EPSILON14
        ) {
          continue;
        }
        Cartesian3.cross(axes[(i + 1) % 3], axes[(i + 2) % 3], direction);
        Cartesian3.normalize(direction, direction);
      } else {
        Cartesian3.divideByScalar(axes[i], lengths[i], direction);
      }
      const projection = Math.abs(Cartesian3.dot(offset, direction));
      maxDistance = Math.max(maxDistance, projection - lengths[i]);
    }
    return Math.max(0, maxDistance);
  }

  private static readonly scratchAxis = new Cartesian3();
  private static readonly scratchOffset = new Cartesian3();
  private static readonly scratchHalfAxes = new Matrix3();
  private static readonly scratchColumns = [
    new Cartesian3(),
    new Cartesian3(),
    new Cartesian3(),
  ];

  /**
   * Returns whether the given box contains the given point, with the
   * given absolute epsilon (in the units of the box). Unlike a
   * matrix-inverse based check, this also works for degenerate boxes
   * that have a zero-length half axis, as long as the half axes are
   * orthogonal.
   *
   * @param box - The box (12 elements)
   * @param point - The point (3 elements)
   * @param epsilon - The absolute epsilon
   * @returns Whether the point is contained
   */
  static boxContainsPoint(
    box: number[],
    point: number[],
    epsilon: number
  ): boolean {
    const offset = BoundingVolumeRefiner.scratchOffset;
    offset.x = point[0] - box[0];
    offset.y = point[1] - box[1];
    offset.z = point[2] - box[2];
    const halfAxes = Matrix3.fromArray(
      box,
      3,
      BoundingVolumeRefiner.scratchHalfAxes
    );
    const axes = BoundingVolumeRefiner.scratchColumns;
    const lengths = [0, 0, 0];
    for (let i = 0; i < 3; i++) {
      Matrix3.getColumn(halfAxes, i, axes[i]);
      lengths[i] = Cartesian3.magnitude(axes[i]);
    }
    for (let i = 0; i < 3; i++) {
      const direction = BoundingVolumeRefiner.scratchAxis;
      if (lengths[i] < CesiumMath.EPSILON14) {
        // Degenerate axis: use the normal of the plane that is spanned
        // by the other two axes. If those are degenerate as well, the
        // box is a line or point and the check is skipped for this axis.
        const a = axes[(i + 1) % 3];
        const b = axes[(i + 2) % 3];
        if (
          lengths[(i + 1) % 3] < CesiumMath.EPSILON14 ||
          lengths[(i + 2) % 3] < CesiumMath.EPSILON14
        ) {
          continue;
        }
        Cartesian3.cross(a, b, direction);
        Cartesian3.normalize(direction, direction);
      } else {
        Cartesian3.divideByScalar(axes[i], lengths[i], direction);
      }
      const projection = Cartesian3.dot(offset, direction);
      if (Math.abs(projection) > lengths[i] + epsilon) {
        return false;
      }
    }
    return true;
  }

  /**
   * Computes a volume measure for the given bounding volume. For
   * boxes and spheres, this is the actual volume. For regions, it is
   * the product of the angular extents and the height range, which
   * is only meaningful when comparing regions with each other.
   */
  static computeVolume(boundingVolume: BoundingVolume): number | undefined {
    if (boundingVolume.box) {
      const halfAxes = Matrix3.fromArray(boundingVolume.box, 3, new Matrix3());
      return 8 * Math.abs(Matrix3.determinant(halfAxes));
    }
    if (boundingVolume.sphere) {
      const r = boundingVolume.sphere[3];
      return (4 / 3) * Math.PI * r * r * r;
    }
    if (boundingVolume.region) {
      const r = boundingVolume.region;
      let width = r[2] - r[0];
      if (width < 0) {
        width += CesiumMath.TWO_PI;
      }
      return width * (r[3] - r[1]) * (r[5] - r[4]);
    }
    return undefined;
  }

  /**
   * Logs a summary of the given statistics
   */
  static logSummary(stats: RefinementStats): void {
    const mean =
      stats.tilesRefined > 0 ? stats.volumeRatioSum / stats.tilesRefined : 1;
    logger.info(
      `Refined ${stats.tilesRefined} of ${stats.tilesVisited} bounding ` +
        `volumes from ${stats.verticesProcessed} vertices, mean volume ` +
        `ratio ${mean.toFixed(3)}, ${stats.tilesWithContentOutsideOriginal} ` +
        `tiles had content outside their original bounding volume ` +
        `(up to ${stats.maxContentDistanceOutsideOriginal.toFixed(
          2
        )} units), ` +
        `${stats.tilesWithUnreadableContent} tiles had unreadable content`
    );
    for (const warning of stats.warnings) {
      logger.warn(warning);
    }
  }
}

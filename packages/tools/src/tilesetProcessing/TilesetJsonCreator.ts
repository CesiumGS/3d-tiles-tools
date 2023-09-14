import fs from "fs";
import path from "path";

import { getBounds } from "@gltf-transform/core";

import { Tile } from "@3d-tiles-tools/structure";
import { Tileset } from "@3d-tiles-tools/structure";
import { BoundingVolume } from "@3d-tiles-tools/structure";
import { BatchTable } from "@3d-tiles-tools/structure";
import { PntsFeatureTable } from "@3d-tiles-tools/structure";
import { B3dmFeatureTable } from "@3d-tiles-tools/structure";
import { I3dmFeatureTable } from "@3d-tiles-tools/structure";

import { BufferedContentData } from "@3d-tiles-tools/base";
import { ContentDataTypes } from "@3d-tiles-tools/base";
import { ContentDataTypeRegistry } from "@3d-tiles-tools/base";
import { Loggers } from "@3d-tiles-tools/base";

import { TileFormats } from "@3d-tiles-tools/tilesets";
import { TileTableData } from "@3d-tiles-tools/tilesets";
import { TileTableDataI3dm } from "@3d-tiles-tools/tilesets";
import { VecMath } from "@3d-tiles-tools/tilesets";

import { GltfTransform } from "../contentProcessing/GltfTransform";
import { PntsPointClouds } from "../pointClouds/PntsPointClouds";

import { BoundingVolumes } from "./BoundingVolumes";
import { BoundingBox3D } from "./BoundingVolumes";
import { Point3D } from "./BoundingVolumes";

const logger = Loggers.get("tilesetProcessing");

const DEFAULT_LEAF_GEOMETRIC_ERROR = 512;
const DEFAULT_TILESET_GEOMETRIC_ERROR = 4096;

/**
 * A class for creating `Tileset` JSON objects from tile content files.
 *
 * @internal
 */
export class TilesetJsonCreator {
  // Implementation notes:
  //
  // To reduce ambiguities, the term "bounding box" refers to actual
  // `BoundingBox3D` instances. The term "bounding volume box" refers
  // to the 12-element number arrays that are the `boundingVolume.box`.
  //
  // Nearly all functions of this class are 'private', and some of
  // them make assumptions that only hold internally - namely, that
  // tiles do not have a `transform` property, or their bounding
  // volumes are actually `boundingVolume.box` bounding volumes.

  /**
   * Creates a tileset that uses the specified files as its
   * tile contents.
   *
   * Many details about the resulting tileset are intentionally
   * not specified.
   *
   * @param baseDir - The base directory against which the
   * content URIs are resolved
   * @param contentUris The content URIs
   * @returns The tileset
   * @throws Error if content data could not be read
   */
  static async createTilesetFromContents(
    baseDir: string,
    contentUris: string[]
  ) {
    const leafTiles = [];
    for (let i = 0; i < contentUris.length; i++) {
      const contentUri = contentUris[i];
      const leafTile = await TilesetJsonCreator.createLeafTileFromContent(
        baseDir,
        contentUri
      );
      if (leafTile) {
        leafTiles.push(leafTile);
      }
    }
    const tileset = TilesetJsonCreator.createTilesetFromLeafTiles(leafTiles);
    return tileset;
  }

  /**
   * Creates a leaf tile with the specified tile content.
   *
   * The content data will be loaded from the specified file, given
   * as `<baseDir>/<contentUri>`. The content data type will be
   * determined.
   *
   * If the content data type is one of the supported types (which
   * are unspecified for now), then its bounding volume will be
   * computed, and used as the bounding volume of the resulting tile.
   *
   * If the content data type is not supported, then a warning
   * will be printed and `undefined` will be returned.
   *
   * @param baseDir - The base directory against which the
   * content URI is resolved
   * @param contentUri The content URI
   * @returns The leaf tile
   * @throws Error if content data could not be read
   */
  private static async createLeafTileFromContent(
    baseDir: string,
    contentUri: string
  ): Promise<Tile | undefined> {
    // Read the content data and determine its type
    const fileName = path.join(baseDir, contentUri);
    const data = fs.readFileSync(fileName);

    // Prepare the resolver for external GLBs in I3DM
    const externalGlbResolver = async (
      uri: string
    ): Promise<Buffer | undefined> => {
      const externalGlbUri = path.resolve(baseDir, uri);
      return fs.readFileSync(externalGlbUri);
    };

    const boundingBox = await TilesetJsonCreator.computeContentDataBoundingBox(
      contentUri,
      data,
      externalGlbResolver
    );
    if (!boundingBox) {
      logger.warn(`Content data type of ${contentUri} is not supported.`);
      return undefined;
    }
    logger.debug(
      `Bounding box for ${contentUri} is ` +
        `${boundingBox.min} ... ${boundingBox.max}`
    );
    const boundingVolumeBox =
      BoundingVolumes.createBoundingVolumeBoxFromGltfBoundingBox(boundingBox);

    const boundingVolume = {
      box: boundingVolumeBox,
    };
    const geometricError = DEFAULT_LEAF_GEOMETRIC_ERROR;
    return TilesetJsonCreator.createLeafTile(
      boundingVolume,
      geometricError,
      contentUri
    );
  }

  /**
   * Computes the bounding box from the given content data.
   *
   * @param contentUri - The content URI
   * @param data The content data
   * @param externalGlbResolver The resolver for external GLBs in I3DMs
   * @returns The bounding box, or undefined if no bounding box could
   * be computed from the given content.
   * @throws Error if the I3DM referred to a GLB that could not be
   * resolved
   */
  private static async computeContentDataBoundingBox(
    contentUri: string,
    data: Buffer,
    externalGlbResolver: (glbUri: string) => Promise<Buffer | undefined>
  ) {
    const contentData = new BufferedContentData(contentUri, data);
    const contentDataType = await ContentDataTypeRegistry.findContentDataType(
      contentData
    );

    if (contentDataType === ContentDataTypes.CONTENT_TYPE_GLB) {
      return TilesetJsonCreator.computeBoundingBoxFromGlb(data);
    } else if (contentDataType === ContentDataTypes.CONTENT_TYPE_PNTS) {
      return TilesetJsonCreator.computeBoundingBoxFromPnts(data);
    } else if (contentDataType === ContentDataTypes.CONTENT_TYPE_B3DM) {
      return TilesetJsonCreator.computeBoundingBoxFromB3dm(data);
    } else if (contentDataType === ContentDataTypes.CONTENT_TYPE_I3DM) {
      return TilesetJsonCreator.computeBoundingBoxFromI3dm(
        data,
        externalGlbResolver
      );
    } else if (contentDataType === ContentDataTypes.CONTENT_TYPE_CMPT) {
      return TilesetJsonCreator.computeBoundingBoxFromCmpt(
        data,
        externalGlbResolver
      );
    }
    return undefined;
  }

  /**
   * Creates a tileset with the given leaf tiles.
   *
   * This assumes that the given tiles do not have a `transform`.
   *
   * If there is only one leaf tile, then this will become
   * the root of the tileset. Otherwise, the tileset root
   * will have the given tiles as its children.
   *
   * @param leafTiles - The leaf tiles
   * @returns The tileset
   */
  private static createTilesetFromLeafTiles(leafTiles: Tile[]): Tileset {
    const tilesetGeometricError = DEFAULT_TILESET_GEOMETRIC_ERROR;
    let root = undefined;
    if (leafTiles.length === 1) {
      root = leafTiles[0];
    } else {
      root = TilesetJsonCreator.createParentTile(leafTiles);
    }
    root.refine = "ADD";
    const tileset: Tileset = {
      asset: {
        version: "1.1",
      },
      geometricError: tilesetGeometricError,
      root: root,
    };
    return tileset;
  }

  /**
   * Creates a parent tile for the given child tiles.
   *
   * This assumes that the child tiles do not have a `transform`.
   *
   * It will compute the bounding volume box of the parent tile
   * from the bounding volume boxes of the children (using
   * `computeTilesUnionBoundingVolumeBox`), and a suitable (but unspecified)
   * geometric error for the parent tile.
   *
   * @param children - The children
   * @returns The parent tile
   */
  private static createParentTile(children: Tile[]): Tile {
    const geometricErrors = children.map((t: Tile) => t.geometricError);
    const maxGeometricError = Math.max(1, Math.max(...geometricErrors));
    const parentGeometricError = 2 * maxGeometricError;
    const parentBoundingVolumeBox =
      TilesetJsonCreator.computeTilesUnionBoundingVolumeBox(children);
    const tile: Tile = {
      boundingVolume: {
        box: parentBoundingVolumeBox,
      },
      geometricError: parentGeometricError,
      children: children,
    };
    return tile;
  }

  /**
   * Computes the `boundingVolume.box` that is the union of all bounding
   * volume boxes of the given tiles.
   *
   * This assumes that the child tiles do not have a `transform`.
   *
   * It also assumes that the input tile bounding volumes are actually
   * bounding boxes. Tiles that have different types of bounding
   * volumes will be ignored. If no tile has a bounding volume box,
   * then a unit cube bounding volume box will be returned.
   *
   * @param tiles - The input tiles
   * @returns The bounding volume box
   */
  private static computeTilesUnionBoundingVolumeBox(tiles: Tile[]): number[] {
    const boundingVolumeBoxes = tiles
      .map((t: Tile) => t.boundingVolume.box)
      .filter((b: number[] | undefined): b is number[] => b !== undefined);
    return TilesetJsonCreator.computeUnionBoundingVolumeBox(
      boundingVolumeBoxes
    );
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
  private static computeUnionBoundingVolumeBox(
    boundingVolumeBoxes: Iterable<number[]>
  ): number[] {
    let unionBoundingBox = undefined;
    for (const boundingVolumeBox of boundingVolumeBoxes) {
      const boundingBox =
        BoundingVolumes.createBoundingBoxForBoundingVolumeBox(
          boundingVolumeBox
        );
      if (!unionBoundingBox) {
        unionBoundingBox = boundingBox;
      } else {
        unionBoundingBox = BoundingVolumes.computeBoundingBoxUnion(
          unionBoundingBox,
          boundingBox
        );
      }
    }
    if (!unionBoundingBox) {
      unionBoundingBox = BoundingVolumes.createUnitCubeBoundingBox();
    }
    logger.debug(
      `Union bounding box is ` +
        `${unionBoundingBox.min} ... ${unionBoundingBox.max}`
    );
    return BoundingVolumes.createBoundingVolumeBoxFromBoundingBox(
      unionBoundingBox
    );
  }

  /**
   * Creates a leaf tile from the given data
   *
   * @param boundingVolume - The bounding volume
   * @param geometricError - The geometric error
   * @param contentUri - The content URI
   * @returns The tile
   */
  private static createLeafTile(
    boundingVolume: BoundingVolume,
    geometricError: number,
    contentUri: string
  ): Tile {
    const tile: Tile = {
      boundingVolume: boundingVolume,
      geometricError: geometricError,
      content: {
        uri: contentUri,
      },
    };
    return tile;
  }

  /**
   * Computes the bounding box of the given PNTS data
   *
   * @param pntsBuffer - The PNTS data buffer
   * @returns A promise to the bounding box
   */
  private static async computeBoundingBoxFromPnts(
    pntsBuffer: Buffer
  ): Promise<BoundingBox3D> {
    // Read the tile data from the input data
    const tileData = TileFormats.readTileData(pntsBuffer);
    const batchTable = tileData.batchTable.json as BatchTable;
    const featureTable = tileData.featureTable.json as PntsFeatureTable;
    const featureTableBinary = tileData.featureTable.binary;

    // Create a `ReadablePointCloud` that allows accessing
    // the PNTS data
    const pntsPointCloud = await PntsPointClouds.create(
      featureTable,
      featureTableBinary,
      batchTable
    );

    // Compute the minimum/maximum position
    const min: Point3D = [Infinity, Infinity, Infinity];
    const max: Point3D = [-Infinity, -Infinity, -Infinity];
    const globalPosition = pntsPointCloud.getGlobalPosition() ?? [0, 0, 0];
    const localPositions = pntsPointCloud.getPositions();
    for (const localPosition of localPositions) {
      const yupPosition: Point3D = [
        localPosition[0] + globalPosition[0],
        localPosition[1] + globalPosition[1],
        localPosition[2] + globalPosition[2],
      ];
      const position: Point3D = [
        yupPosition[0],
        yupPosition[2],
        -yupPosition[1],
      ];
      BoundingVolumes.min(min, position, min);
      BoundingVolumes.max(max, position, max);
    }
    const result: BoundingBox3D = {
      min: min,
      max: max,
    };
    return result;
  }

  /**
   * Computes the bounding box of the given B3DM data
   *
   * @param b3dmBuffer - The B3DM data buffer
   * @returns A promise to the bounding box
   */
  private static async computeBoundingBoxFromB3dm(
    b3dmBuffer: Buffer
  ): Promise<BoundingBox3D> {
    // Compute the bounding box from the payload (GLB data)
    const tileData = TileFormats.readTileData(b3dmBuffer);
    const glbBuffer = tileData.payload;
    const gltfBoundngBox = await TilesetJsonCreator.computeBoundingBoxFromGlb(
      glbBuffer
    );

    // If the feature table defines an `RTC_CENTER`, then
    // translate the bounding box by this amount, taking
    // the y-up-to-z-up-conversion into account
    const featureTable = tileData.featureTable.json as B3dmFeatureTable;
    if (featureTable.RTC_CENTER) {
      const featureTableBinary = tileData.featureTable.binary;
      const rtcCenter = TileTableData.obtainRtcCenter(
        featureTable.RTC_CENTER,
        featureTableBinary
      );
      const tx = rtcCenter[0];
      const ty = rtcCenter[2];
      const tz = -rtcCenter[1];
      const b3dmBoundingBox = BoundingVolumes.translateBoundingBox(
        gltfBoundngBox,
        [tx, ty, tz]
      );
      return b3dmBoundingBox;
    }
    return gltfBoundngBox;
  }

  /**
   * Computes the bounding box of the given I3DM data
   *
   * @param i3dmBuffer - The I3DM data buffer
   * @param externalGlbResolver - The resolver for external GLB data from I3DMs
   * @returns A promise to the bounding box
   * @throws Error if the I3DM referred to a GLB that could not be
   * resolved
   */
  private static async computeBoundingBoxFromI3dm(
    i3dmBuffer: Buffer,
    externalGlbResolver: (glbUri: string) => Promise<Buffer | undefined>
  ): Promise<BoundingBox3D> {
    // Obtain the GLB buffer for the tile data. With `gltfFormat===1`, it
    // is stored directly as the payload. Otherwise (with `gltfFormat===0`)
    // the payload is a URI that has to be resolved.
    const tileData = TileFormats.readTileData(i3dmBuffer);
    let glbBuffer = undefined;
    if (tileData.header.gltfFormat === 1) {
      glbBuffer = tileData.payload;
    } else {
      const glbUri = tileData.payload.toString().replace(/\0/g, "");
      glbBuffer = await externalGlbResolver(glbUri);
      if (!glbBuffer) {
        throw new Error(`Could not resolve external GLB from ${glbUri}`);
      }
    }

    // Compute the bounding box from the payload (GLB data)
    const gltfBoundingBox = await TilesetJsonCreator.computeBoundingBoxFromGlb(
      glbBuffer
    );
    const gltfCorners =
      BoundingVolumes.computeBoundingBoxCorners(gltfBoundingBox);

    // Compute the instance matrices of the I3DM data
    const featureTable = tileData.featureTable.json as I3dmFeatureTable;
    const featureTableBinary = tileData.featureTable.binary;
    const numInstances = featureTable.INSTANCES_LENGTH;
    const instanceMatrices = TileTableDataI3dm.createInstanceMatrices(
      featureTable,
      featureTableBinary,
      numInstances
    );

    // Compute the minimum and maximum of the instance bounding boxes.
    // This is simply computed by transforming the corner points
    // of the glTF bounding box with the instancing transforms. This is
    // FAR from being the "tightest" bounding volume, but computing that
    // would require a robust OrientedBoundingBox::fromPoints function.
    const matrixZupToYup = VecMath.createZupToYupPacked4();
    const matrixYupToZup = VecMath.createYupToZupPacked4();
    const min: Point3D = [Infinity, Infinity, Infinity];
    const max: Point3D = [-Infinity, -Infinity, -Infinity];
    for (const matrix of instanceMatrices) {
      // Compute the matrix that first transforms the points from
      // the glTF coordinate system into Z-up, then applies the
      // I3DM transform, and then transforms them back to Y-up
      const gltfMatrix = VecMath.multiplyAll4([
        matrixZupToYup,
        matrix,
        matrixYupToZup,
      ]);

      for (const gltfCorner of gltfCorners) {
        const transformedCorner = TilesetJsonCreator.transformPoint3D(
          gltfMatrix,
          gltfCorner
        );
        BoundingVolumes.min(min, transformedCorner, min);
        BoundingVolumes.max(max, transformedCorner, max);
      }
    }
    return {
      min: min,
      max: max,
    };
  }

  /**
   * Computes the bounding box of the given CMPT data
   *
   * @param cmptBuffer - The CMPT data buffer
   * @returns A promise to the bounding box
   */
  private static async computeBoundingBoxFromCmpt(
    cmptBuffer: Buffer,
    externalGlbResolver: (glbUri: string) => Promise<Buffer | undefined>
  ): Promise<BoundingBox3D> {
    let unionBoundingBox = undefined;
    const compositeTileData = TileFormats.readCompositeTileData(cmptBuffer);
    const buffers = compositeTileData.innerTileBuffers;
    for (const buffer of buffers) {
      const innerBoundingBox =
        await TilesetJsonCreator.computeContentDataBoundingBox(
          "[inner tile of CMPT]",
          buffer,
          externalGlbResolver
        );
      if (!innerBoundingBox) {
        continue;
      }
      logger.debug(
        `  Inner bounding box for CMPT is ` +
          `${innerBoundingBox.min} ... ${innerBoundingBox.max}`
      );

      if (!unionBoundingBox) {
        unionBoundingBox = innerBoundingBox;
      } else {
        unionBoundingBox = BoundingVolumes.computeBoundingBoxUnion(
          unionBoundingBox,
          innerBoundingBox
        );
      }
    }
    if (!unionBoundingBox) {
      unionBoundingBox = BoundingVolumes.createUnitCubeBoundingBox();
    }
    return unionBoundingBox;
  }

  /**
   * Transforms the given 3D point with the given 4x4 matrix, writes
   * the result into the given target, and returns it. If no target
   * is given, then a new point will be created and returned.
   *
   * @param matrix - The 4x4 matrix
   * @param point - The 3D point
   * @param target - The target
   * @returns The result
   */
  private static transformPoint3D(
    matrix: number[],
    point: Point3D,
    target?: Point3D
  ): Point3D {
    const px = point[0];
    const py = point[1];
    const pz = point[2];
    const x = matrix[0] * px + matrix[4] * py + matrix[8] * pz + matrix[12];
    const y = matrix[1] * px + matrix[5] * py + matrix[9] * pz + matrix[13];
    const z = matrix[2] * px + matrix[6] * py + matrix[10] * pz + matrix[14];
    if (!target) {
      return [x, y, z];
    }
    target[0] = x;
    target[1] = y;
    target[2] = z;
    return target;
  }

  /**
   * Computes the bounding box of the given glTF asset.
   *
   * This will compute the bounding box of the default scene
   * (or the first scene of the asset). If there is no scene,
   * then a warning will be printed, and a unit cube bounding
   * box will be returned.
   *
   * @param glbBuffer - The buffer containing GLB data
   * @returns A promise to the bounding box
   */
  private static async computeBoundingBoxFromGlb(
    glbBuffer: Buffer
  ): Promise<BoundingBox3D> {
    const io = await GltfTransform.getIO();
    const document = await io.readBinary(glbBuffer);
    const root = document.getRoot();
    let scene = root.getDefaultScene();
    if (!scene) {
      const scenes = root.listScenes();
      if (scenes.length > 0) {
        scene = scenes[0];
      }
    }
    if (scene) {
      const bounds = getBounds(scene);
      return bounds;
    }
    logger.warn("No scenes found in glTF - using unit bounding box");
    return BoundingVolumes.createUnitCubeBoundingBox();
  }
}

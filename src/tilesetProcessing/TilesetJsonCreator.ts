import fs from "fs";
import path from "path";

import { getBounds } from "@gltf-transform/core";

import { Tile } from "../structure/Tile";
import { Tileset } from "../structure/Tileset";
import { BoundingVolume } from "../structure/BoundingVolume";
import { BatchTable } from "../structure/TileFormats/BatchTable";
import { PntsFeatureTable } from "../structure/TileFormats/PntsFeatureTable";

import { GltfTransform } from "../contentProcessing/GltfTransform";
import { PntsPointClouds } from "../contentProcessing/pointClouds/PntsPointClouds";

import { BufferedContentData } from "../contentTypes/BufferedContentData";
import { ContentDataTypes } from "../contentTypes/ContentDataTypes";
import { ContentDataTypeRegistry } from "../contentTypes/ContentDataTypeRegistry";

import { TileFormats } from "../tileFormats/TileFormats";

import { BoundingVolumes } from "./BoundingVolumes";
import { BoundingBox3D } from "./BoundingVolumes";
import { Point3D } from "./BoundingVolumes";
import { B3dmFeatureTable } from "../structure/TileFormats/B3dmFeatureTable";
import { TileTableData } from "../migration/TileTableData";

const DEFAULT_LEAF_GEOMETRIC_ERROR = 512;
const DEFAULT_TILESET_GEOMETRIC_ERROR = 4096;

/**
 * A class for creating `Tileset` JSON objects from tile content files.
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
   * If the conetnt data type is not supported, then a warning
   * will be printed and `undefined` will be returned.
   *
   * @param baseDir - The base directory against which the
   * content URI is resolved
   * @param contentUri The content URI
   * @returns The leaf tile
   */
  private static async createLeafTileFromContent(
    baseDir: string,
    contentUri: string
  ): Promise<Tile | undefined> {
    const fileName = path.join(baseDir, contentUri);
    const data = fs.readFileSync(fileName);
    const contentData = new BufferedContentData(contentUri, data);
    const contentDataType = await ContentDataTypeRegistry.findContentDataType(
      contentData
    );

    let boundingVolumeBox = BoundingVolumes.createUnitCubeBoundingVolumeBox();
    if (contentDataType === ContentDataTypes.CONTENT_TYPE_GLB) {
      const boundingBox = await TilesetJsonCreator.computeBoundingBoxFromGlb(
        data
      );

      // TODO Debug log
      console.log(
        "Bounding box for " +
          contentUri +
          " is " +
          boundingBox.min +
          " ... " +
          boundingBox.max
      );

      boundingVolumeBox =
        BoundingVolumes.createBoundingVolumeBoxFromGltfBoundingBox(boundingBox);
    } else if (contentDataType === ContentDataTypes.CONTENT_TYPE_PNTS) {
      const boundingBox = await TilesetJsonCreator.computeBoundingBoxFromPnts(
        data
      );

      // TODO Debug log
      console.log(
        "Bounding box for " +
          contentUri +
          " is " +
          boundingBox.min +
          " ... " +
          boundingBox.max
      );

      // TODO I would have expected that the PNTS bounding box
      // does NOT require the up-axis transform, i.e. that it should be
      // createBoundingVolumeBoxFromBoundingBox instead of
      // createBoundingVolumeBoxFromGltfBoundingBox - review that!
      boundingVolumeBox =
        BoundingVolumes.createBoundingVolumeBoxFromGltfBoundingBox(boundingBox);
    } else if (contentDataType === ContentDataTypes.CONTENT_TYPE_B3DM) {
      const boundingBox = await TilesetJsonCreator.computeBoundingBoxFromB3dm(
        data
      );

      // TODO Debug log
      console.log(
        "Bounding box for " +
          contentUri +
          " is " +
          boundingBox.min +
          " ... " +
          boundingBox.max
      );

      boundingVolumeBox =
        BoundingVolumes.createBoundingVolumeBoxFromGltfBoundingBox(boundingBox);
    } else {
      console.warn(
        "WARNING: Content data type " + contentDataType + " is not supported."
      );
      return undefined;
    }
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
   * `computeUnionBoundingVolumeBox`), and a suitable (but unspecified)
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
      TilesetJsonCreator.computeUnionBoundingVolumeBox(children);
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
  private static computeUnionBoundingVolumeBox(tiles: Tile[]): number[] {
    let parentBoundingBox = undefined;
    for (const tile of tiles) {
      const box = tile.boundingVolume.box;
      if (box) {
        const boundingBox =
          BoundingVolumes.createBoundingBoxForBoundingVolumeBox(box);
        if (!parentBoundingBox) {
          parentBoundingBox = boundingBox;
        } else {
          parentBoundingBox = BoundingVolumes.union(
            parentBoundingBox,
            boundingBox
          );
        }
      }
    }
    if (!parentBoundingBox) {
      parentBoundingBox = BoundingVolumes.createUnitCubeBoundingBox();
    }
    return BoundingVolumes.createBoundingVolumeBoxFromBoundingBox(
      parentBoundingBox
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
      const position: Point3D = [
        localPosition[0] + globalPosition[0],
        localPosition[1] + globalPosition[1],
        localPosition[2] + globalPosition[2],
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
   * @param pntsBuffer - The B3DM data buffer
   * @returns A promise to the bounding box
   */
  private static async computeBoundingBoxFromB3dm(
    pntsBuffer: Buffer
  ): Promise<BoundingBox3D> {
    // Compute the bounding box from the payload (GLB data)
    const tileData = TileFormats.readTileData(pntsBuffer);
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
    console.log("No scenes found in glTF - using unit bounding box");
    return BoundingVolumes.createUnitCubeBoundingBox();
  }
}

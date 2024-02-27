import fs from "fs";
import path from "path";

import { Cartographic } from "cesium";
import { Matrix4 } from "cesium";
import { Transforms } from "cesium";

import { DeveloperError } from "../../base";

import { Tile } from "../../structure";
import { Tileset } from "../../structure";
import { BoundingVolume } from "../../structure";

import { BoundingVolumes } from "./BoundingVolumes";
import { ContentBoundingVolumes } from "./ContentBoundingVolumes";

import { Loggers } from "../../base";
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
  // The term "bounding volume box" refers to the 12-element number
  // arrays that are the `boundingVolume.box`.
  //
  // Nearly all functions of this class are 'private', and some of
  // them make assumptions about the structure of parts of the
  // tileset that only hold internally

  /**
   * Creates a tileset that uses the specified files as its
   * tile contents.
   *
   * Many details about the resulting tileset are intentionally
   * not specified.
   *
   * @param baseDir - The base directory against which the
   * content URIs are resolved
   * @param contentUris - The content URIs
   * @returns The tileset
   * @throws Error if content data could not be read
   */
  static async createTilesetFromContents(
    baseDir: string,
    contentUris: string[]
  ) {
    const leafTiles: Tile[] = [];
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
   * @param contentUri - The content URI
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
    const boundingVolumeBox =
      await ContentBoundingVolumes.computeContentDataBoundingVolumeBox(
        contentUri,
        data,
        externalGlbResolver
      );
    if (!boundingVolumeBox) {
      logger.warn(`Content data type of ${contentUri} is not supported.`);
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
   * If there is only one leaf tile, then this will become
   * the root of the tileset. Otherwise, the tileset root
   * will have the given tiles as its children.
   *
   * @param leafTiles - The leaf tiles
   * @returns The tileset
   */
  private static createTilesetFromLeafTiles(leafTiles: Tile[]): Tileset {
    const tilesetGeometricError = DEFAULT_TILESET_GEOMETRIC_ERROR;
    let root: Tile | undefined = undefined;
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
   * Computes a bounding volume box for the given tile
   *
   * If the tile does not have children, then this will return
   * a bounding volume box that is created from the bounding
   * volume of the given tile.
   *
   * Otherwise, it will compute the bounding volumes of the
   * children, transform each of them with the child transform,
   * and return the union of these transformed child bounding
   * volumes.
   *
   * @param tile - The tile
   * @param parentTransform - The transform of the parent tile,
   * as a 16-element array
   * @returns The bounding volume box
   */
  private static computeTileBoundingVolumeBox(
    tile: Tile
  ): number[] | undefined {
    if (!tile.children || tile.children.length === 0) {
      return BoundingVolumes.computeBoundingVolumeBoxFromBoundingVolume(
        tile.boundingVolume
      );
    }
    return TilesetJsonCreator.computeChildrenBoundingVolumeBox(tile.children);
  }

  /**
   * Compute the bounding box for a tile with the given children.
   *
   * This will compute the bounding volumes of the children,
   * transform each of them with the child transform, and
   * return the union of these transformed child bounding
   * volumes.
   *
   * @param children - The children
   * @returns The bounding volume box
   */
  private static computeChildrenBoundingVolumeBox(
    children: Tile[]
  ): number[] | undefined {
    const childBoundingVolumeBoxes: number[][] = [];
    for (const child of children) {
      const childBoundingVolumeBox =
        TilesetJsonCreator.computeTileBoundingVolumeBox(child);
      if (childBoundingVolumeBox !== undefined) {
        if (child.transform === undefined) {
          childBoundingVolumeBoxes.push(childBoundingVolumeBox);
        } else {
          const transformedChildBoundingVolumeBox =
            BoundingVolumes.transformBoundingVolumeBox(
              childBoundingVolumeBox,
              child.transform
            );
          childBoundingVolumeBoxes.push(transformedChildBoundingVolumeBox);
        }
      }
    }
    return BoundingVolumes.computeUnionBoundingVolumeBox(
      childBoundingVolumeBoxes
    );
  }

  /**
   * Creates a parent tile for the given child tiles.
   *
   * It will compute the bounding volume box of the parent tile
   * from the bounding volume boxes of the children, and a
   * suitable (but unspecified) geometric error for the parent tile.
   *
   * @param children - The children
   * @returns The parent tile
   */
  private static createParentTile(children: Tile[]): Tile {
    const geometricErrors = children.map((t: Tile) => t.geometricError);
    const maxGeometricError = Math.max(1, Math.max(...geometricErrors));
    const parentGeometricError = 2 * maxGeometricError;
    const parentBoundingVolumeBox =
      TilesetJsonCreator.computeChildrenBoundingVolumeBox(children);
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
   * Computes the transform for a tile to place it at the given cartographic
   * position.
   *
   * The given position is either (longitudeDegrees, latitudeDegrees)
   * or (longitudeDegrees, latitudeDegrees, heightMeters). The returned
   * array will be that of a 4x4 matrix in column-major order.
   *
   * @param cartographicPositionDegrees - The cartographic position
   * @returns The transform
   * @throws DeveloperError If the given array has a length smaller than 2
   */
  static computeTransformFromCartographicPositionDegrees(
    cartographicPositionDegrees: number[]
  ) {
    if (cartographicPositionDegrees.length < 2) {
      throw new DeveloperError(
        `Expected an array of at least length 2, but received an array ` +
          `of length ${cartographicPositionDegrees.length}: ${cartographicPositionDegrees}`
      );
    }
    const lonDegrees = cartographicPositionDegrees[0];
    const latDegrees = cartographicPositionDegrees[1];
    const height =
      cartographicPositionDegrees.length >= 3
        ? cartographicPositionDegrees[2]
        : 0.0;
    const cartographic = Cartographic.fromDegrees(
      lonDegrees,
      latDegrees,
      height
    );
    const cartesian = Cartographic.toCartesian(cartographic);
    const enuMatrix = Transforms.eastNorthUpToFixedFrame(cartesian);
    const transform = Matrix4.toArray(enuMatrix);
    return transform;
  }
}

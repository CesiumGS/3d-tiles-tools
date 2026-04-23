import { s2 } from "s2js";

import { Tileset } from "../../structure";
import { Tile } from "../../structure";
import { Content } from "../../structure";
import { BoundingVolume } from "../../structure";

import { S2Cell } from "../../tilesets";
import { Extensions } from "../../tilesets";

import { DeveloperError, Loggers } from "../../base";
const logger = Loggers.get("tilesetProcessing");

/**
 * A class for creating `Tileset` JSON objects for S2 cells
 *
 * @internal
 */
export class TilesetJsonCreatorS2 {
  /**
   * A conservative global minimum height in meters for all
   * bounding volumes
   */
  private static readonly GLOBAL_MIN_HEIGHT = -12000;

  /**
   * A conservative global maximum height in meters for all
   * bounding volumes
   */
  private static readonly GLOBAL_MAX_HEIGHT = -9000;

  /**
   * A bounding volume (region) that covers the whole globe
   */
  private static readonly GLOBAL_BOUNDING_VOLUME: BoundingVolume = {
    region: [
      -3.141592653589793,
      -1.5707963267948966,
      3.141592653589793,
      1.5707963267948966,
      TilesetJsonCreatorS2.GLOBAL_MIN_HEIGHT,
      TilesetJsonCreatorS2.GLOBAL_MAX_HEIGHT,
    ],
  };

  /**
   * The geometricError that should be used for the tileset
   */
  private readonly tilesetGeometricError: number;

  /**
   * The geometric error that should be used for the root tile
   */
  private readonly rootGeometricError: number;

  /**
   * Whether S2 bounding volumes should be used for the tiles.
   *
   * When this is `true`, then the bounding volumes of the tiles
   * will be S2 bounding volumes, and the resulting tileset will
   * require the `3DTILES_bounding_volume_S2` extension.
   *
   * When this is `false`, then bounding regions will be created
   * from the S2 cells, and `3DTILES_bounding_volume_S2` will
   * not be required.
   */
  private readonly useS2BoundingVolumes: boolean;

  /**
   * The maximum S2 level (inclusive) for which tiles should
   * be created
   */
  private maxLevelInclusive: number;

  /**
   * A template URI for the content in the leaf tiles.
   *
   * This may involve the `{cellIdToken}` template that will
   * be replaced by the 2D cell ID token
   */
  private contentTemplateUri: string;

  /**
   * Creates a new instance with unspecified default values
   */
  constructor() {
    this.tilesetGeometricError = 1048576;
    this.rootGeometricError = 524288;
    this.useS2BoundingVolumes = true;
    this.maxLevelInclusive = 7;
    this.contentTemplateUri = "content-{cellIdToken}";
  }

  /**
   * Set the maximum S2 level (inclusive) for which tiles should be generated.
   *
   *
   * @param maxLevelInclusive - The maximum level, inclusive
   * @throws DeveloperError If the given value is negative
   */
  setMaxLevelInclusive(maxLevelInclusive: number) {
    if (maxLevelInclusive < 0) {
      throw new DeveloperError(
        `The maxLevelInclusive may not be negative, ` +
          `but is ${maxLevelInclusive}`
      );
    }
    this.maxLevelInclusive = maxLevelInclusive;
  }

  /**
   * Set the content template URI that should be used for the content
   * in the leaf tiles.
   *
   * This may involve a template parameter `{cellIdToken}` that will
   * be replaced with the S2 cell ID token of the respective S2 cell.
   *
   * @param contentTemplateUri - The template URI
   */
  setContentTemplateUri(contentTemplateUri: string) {
    this.contentTemplateUri = contentTemplateUri;
  }

  /**
   * Create the tileset based on the current configuration.
   *
   * @returns The tileset
   */
  createTileset(): Tileset {
    logger.info(`Creating tileset for S2 cells...`);
    logger.info(`  maxLevelInclusive: ${this.maxLevelInclusive}`);
    logger.info(`  contentTemplateUri: ${this.contentTemplateUri}`);

    const tilesetGeometricError = this.tilesetGeometricError;
    const useS2BoundingVolumes = this.useS2BoundingVolumes;
    const root = this.createRoot();
    const tileset: Tileset = {
      asset: {
        version: "1.1",
      },
      geometricError: tilesetGeometricError,
      root: root,
    };
    if (useS2BoundingVolumes) {
      Extensions.addExtensionRequired(tileset, "3DTILES_bounding_volume_S2");
    }

    logger.info(`Creating tileset for S2 cells DONE`);
    return tileset;
  }

  /**
   * Creates the root tile of the tileset (and all its children,
   * created via `buildHierarchy`.
   *
   * The root tile will have 6 children, one for each S2 face.
   * Each of these children will contain the S2 quadtree up to
   * the `maxLevelInclusive`.
   *
   * @returns The root tile
   */
  private createRoot(): Tile {
    const rootGeometricError = this.rootGeometricError;
    const rootBoundingVolumeRegion =
      TilesetJsonCreatorS2.GLOBAL_BOUNDING_VOLUME;

    const children: Tile[] = [];
    const root: Tile = {
      refine: "ADD",
      boundingVolume: rootBoundingVolumeRegion,
      geometricError: rootGeometricError,
      children: children,
    };
    for (let faceIndex = 0; faceIndex < 6; faceIndex++) {
      const cellId = s2.cellid.fromFace(faceIndex);
      const child = this.createTile(0, cellId);
      children.push(child);
      this.buildHierarchy(child, cellId, 0);
    }

    return root;
  }

  /**
   * Recursively build the hierarchy of tiles for S2 cells,
   * starting with the given tile.
   *
   * @param tile - The tile
   * @param cellId - The S2 cell ID of the given tile
   * @param currentLevel - The current level (0 for the face root tiles)
   */
  private buildHierarchy(tile: Tile, cellId: bigint, currentLevel: number) {
    if (currentLevel >= this.maxLevelInclusive) {
      return;
    }
    const children: Tile[] = [];
    tile.children = children;
    const childIds = s2.cellid.children(cellId);
    for (const childId of childIds) {
      const child = this.createTile(currentLevel, childId);
      children.push(child);
      this.buildHierarchy(child, childId, currentLevel + 1);
    }
  }

  /**
   * Creates a Tile for the given S2 cell ID.
   *
   * @param level - The level of the tile (0 for the face root tiles)
   * @param cellId - The S2 cell ID to create the tile from
   * @returns The tile
   */
  private createTile(level: number, cellId: bigint): Tile {
    const geometricError = this.computeGeometricError(level);
    const boundingVolume = this.createBoundingVolume(cellId);
    const content = this.createContent(level, cellId);
    const tile: Tile = {
      geometricError: geometricError,
      boundingVolume: boundingVolume,
      content: content,
    };
    return tile;
  }

  /**
   * Creates the content for the specified tile.
   *
   * This will return `undefined` for all but the leaf tiles of the
   * S2 tile hierarchy.
   *
   * For the leaf tiles, it will return a Content that has a URI that
   * was created based on the S2 cell ID.
   *
   * @param level - The level of the tile (0 for the face root tiles)
   * @param cellId - The S2 cell ID of the containing tile
   * @returns The content
   */
  private createContent(level: number, cellId: bigint): Content | undefined {
    if (level != this.maxLevelInclusive - 1) {
      return undefined;
    }
    const contentUri = this.createContentUri(cellId);
    const content: Content = {
      uri: contentUri,
    };
    return content;
  }

  /**
   * Creates a URI for the specified S2 cell ID.
   *
   * This will substitute the S2 cell ID token into the
   * `contentTemplateUri`.
   *
   * @param cellId - The S2 cell ID
   * @returns The URI
   */
  private createContentUri(cellId: bigint): string {
    const cellIdToken = S2Cell.getTokenFromId(cellId);
    let result = this.contentTemplateUri;
    result = result.replace(/{cellIdToken}/g, cellIdToken);
    return result;
  }

  /**
   * Computes the geometric error for a tile at the given level.
   *
   * @param level - The level (0 for the face root tiles)
   * @returns The geometric error
   */
  private computeGeometricError(level: number): number {
    const rootGeometricError = this.rootGeometricError;
    const geometricError = rootGeometricError / Math.pow(2, level);
    return geometricError;
  }

  /**
   * Creates a bounding volume for the tile with the given S2 cell ID
   *
   * @param cellId - The S2 cell ID
   * @returns The bounding volume
   */
  private createBoundingVolume(cellId: bigint): BoundingVolume {
    if (this.useS2BoundingVolumes) {
      return TilesetJsonCreatorS2.createBoundingVolumeS2(cellId);
    }
    return TilesetJsonCreatorS2.createBoundingVolumeRegion(cellId);
  }

  /**
   * Creates a bounding volume that uses the `3DTILES_bounding_volume_S2`
   * extension with the given S2 cell ID
   *
   * @param cellId - The S2 cell ID
   * @returns The bounding volume
   */
  private static createBoundingVolumeS2(cellId: bigint): BoundingVolume {
    const boundingVolume: any = {
      extensions: {
        "3DTILES_bounding_volume_S2": {
          token: S2Cell.getTokenFromId(cellId),
          minimumHeight: TilesetJsonCreatorS2.GLOBAL_MIN_HEIGHT,
          maximumHeight: TilesetJsonCreatorS2.GLOBAL_MAX_HEIGHT,
        },
      },
    };
    return boundingVolume;
  }

  /**
   * Creates a bounding volume (region) that fully encloses the specified
   * S2 cell.
   *
   * @param cellId - The S2 cell ID
   * @returns he bounding volume
   */
  private static createBoundingVolumeRegion(cellId: bigint): BoundingVolume {
    const cell = s2.Cell.fromCellID(cellId);
    const rect = cell.rectBound();
    const w = rect.lng.lo;
    const s = rect.lat.lo;
    const e = rect.lng.hi;
    const n = rect.lat.hi;
    const minHeight = TilesetJsonCreatorS2.GLOBAL_MIN_HEIGHT;
    const maxHeight = TilesetJsonCreatorS2.GLOBAL_MAX_HEIGHT;
    const region = [w, s, e, n, minHeight, maxHeight];
    const boundingVolume: BoundingVolume = {
      region: region,
    };
    return boundingVolume;
  }
}

import fs from "fs";
import path from "path";

import { BoundingVolume } from "../structure/BoundingVolume";
import { Tile } from "../structure/Tile";
import { Tileset } from "../structure/Tileset";

import { GltfTransform } from "../contentProcessing/GltfTransform";

import { getBounds } from "@gltf-transform/core";

// Basic, internal structures for bounding box computations
type Point3D = [number, number, number];
type BoundingBox3D = {
  min: Point3D;
  max: Point3D;
};
const UNIT_CUBE_BOUNDING_BOX: BoundingBox3D = {
  min: [0, 0, 0],
  max: [1, 1, 1],
};

/**
 * A class for creating `Tileset` JSON objects from tile content files.
 */
export class TilesetJsonCreator {
  // Implementation note:
  // To reduce ambiguities, the term "bounding box" refers to actual
  // `BoundingBox3D` instances. The term "bounding volume box" refers
  // to the 12-element number arrays that are the `boundingVolume.box`.
  // Nearly all functions of this class are 'private', and some of
  // them make assumptions that only hold internally - namely, that
  // tiles do not have a `transform` property, or their bounding
  // volumes are actually `boundingVolume.box` bounding volumes.

  /**
   * Creates a tileset that uses the specified GLB files as its
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
  static async createTilesetFromGlbs(baseDir: string, contentUris: string[]) {
    const leafTiles = [];
    for (let i = 0; i < contentUris.length; i++) {
      const contentUri = contentUris[i];
      const leafTile = await TilesetJsonCreator.createLeafTileFromGlb(
        baseDir,
        contentUri
      );
      leafTiles.push(leafTile);
    }
    const tileset = TilesetJsonCreator.createTilesetFromLeafTiles(leafTiles);
    return tileset;
  }

  /**
   * Creates a leaf tile with the specified tile content.
   *
   * The GLB will be loaded from the specified file, given as
   * `<baseDir>/<contentUri>`. Its bounding wolume will be
   * computed and used as the bounding volume of the
   * resulting tile.
   *
   * @param baseDir - The base directory against which the
   * content URI is resolved
   * @param contentUri The content URI
   * @returns The leaf tile
   */
  private static async createLeafTileFromGlb(
    baseDir: string,
    contentUri: string
  ): Promise<Tile> {
    const glbFileName = path.join(baseDir, contentUri);
    const boundingBox = await TilesetJsonCreator.computeBoundingBoxFromGlbFile(
      glbFileName
    );
    const boundingVolumeBox =
      TilesetJsonCreator.createBoundingVolumeBoxFromGltfBoundingBox(
        boundingBox
      );
    const boundingVolume = {
      box: boundingVolumeBox,
    };
    const geometricError = 1.0;
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
    const tilesetGeometricError = 1024;
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
          TilesetJsonCreator.createBoundingBoxForBoundingVolumeBox(box);
        if (!parentBoundingBox) {
          parentBoundingBox = boundingBox;
        } else {
          parentBoundingBox = TilesetJsonCreator.union(
            parentBoundingBox,
            boundingBox
          );
        }
      }
    }
    if (!parentBoundingBox) {
      parentBoundingBox = UNIT_CUBE_BOUNDING_BOX;
    }
    return TilesetJsonCreator.createBoundingVolumeBoxFromBoundingBox(
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
   * Computes the component-wise minimum of the given points
   *
   * @param p0 - The first point
   * @param p1 - The second point
   * @returns The minimum
   */
  private static min(p0: Point3D, p1: Point3D): Point3D {
    return [
      Math.min(p0[0], p1[0]),
      Math.min(p0[1], p1[1]),
      Math.min(p0[2], p1[2]),
    ];
  }
  /**
   * Computes the component-wise maximum of the given points
   *
   * @param p0 - The first point
   * @param p1 - The second point
   * @returns The maximum
   */
  private static max(p0: Point3D, p1: Point3D): Point3D {
    return [
      Math.max(p0[0], p1[0]),
      Math.max(p0[1], p1[1]),
      Math.max(p0[2], p1[2]),
    ];
  }

  /**
   * Computes the union of the given bounding boxes
   *
   * @param bb0 - The first bounding box
   * @param bb1 - The second bounding box
   * @returns The union
   */
  private static union(bb0: BoundingBox3D, bb1: BoundingBox3D): BoundingBox3D {
    return {
      min: TilesetJsonCreator.min(bb0.min, bb1.min),
      max: TilesetJsonCreator.max(bb0.max, bb1.max),
    };
  }

  /**
   * Computes the bounding box of the given glTF file.
   *
   * This will compute the bounding box of the default scene
   * (or the first scene of the asset). If there is no scene,
   * then a warning will be printed, and a unit cube bounding
   * box will be returned.
   *
   * @param glbFileName - The name of the GLB file
   * @returns A promise to the bounding box
   */
  private static async computeBoundingBoxFromGlbFile(
    glbFileName: string
  ): Promise<BoundingBox3D> {
    const glbBuffer = fs.readFileSync(glbFileName);
    return TilesetJsonCreator.computeBoundingBoxFromGlb(glbBuffer);
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
    return UNIT_CUBE_BOUNDING_BOX;
  }

  /**
   * Creates a boundingVolume.box from a given bounding box
   *
   * @param minX The minimum x
   * @param minY The minimum y
   * @param minZ The minimum z
   * @param maxX The maximum x
   * @param maxY The maximum y
   * @param maxZ The maximum z
   * @return The `boundingVolume.box`
   */
  private static createBoundingVolumeBoxFromBoundingBox(
    boundingBox: BoundingBox3D
  ): number[] {
    return TilesetJsonCreator.createBoundingVolumeBox(
      boundingBox.min[0],
      boundingBox.min[1],
      boundingBox.min[2],
      boundingBox.max[0],
      boundingBox.max[1],
      boundingBox.max[2]
    );
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
   * @param minX The minimum x
   * @param minY The minimum y
   * @param minZ The minimum z
   * @param maxX The maximum x
   * @param maxY The maximum y
   * @param maxZ The maximum z
   * @return The `boundingVolume.box`
   */
  private static createBoundingVolumeBoxFromGltfBoundingBox(
    boundingBox: BoundingBox3D
  ): number[] {
    // Take into account the y-up-to-z-up transform:
    return TilesetJsonCreator.createBoundingVolumeBox(
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
  private static createBoundingBoxForBoundingVolumeBox(
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
}

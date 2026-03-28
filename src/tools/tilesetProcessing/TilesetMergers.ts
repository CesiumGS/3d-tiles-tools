import { Paths } from "../../base";

import { Tileset } from "../../structure";
import { Tile } from "../../structure";

import { TilesetError } from "../../tilesets";

import { BoundingVolumes } from "./BoundingVolumes";

/**
 * A class containing utility functions that are required for the
 * `TilesetMerger` and related classes.
 *
 * These are only supposed to be used internally.
 *
 * Most of the functions (specifically, the undocumented ones) are
 * taken from the `mergeTileset.js` of the  `merge-tilesets` branch,
 * commit: d7e76e59022fc5e5aa4b848730ec9f8f4dea6d4e, with slight
 * modification of 'getChildren' for disambiguation and updates to
 * compute bounding boxes instead of bounding spheres, and a fix
 * for https://github.com/CesiumGS/3d-tiles-tools/issues/157
 *
 * @internal
 */
export class TilesetMergers {
  /**
   * Creates a string that does not exist yet.
   *
   * If the given prefix is not yet contained in the given list,
   * then it is returned. Otherwise, it is made "unique" in an
   * unspecified way, and then returned.
   *
   * This does NOT add the new string to the given list!
   *
   * @param prefix - The prefix
   * @param existing - The existing strings
   * @returns The unique string
   */
  static createUnique(prefix: string, existing: string[]): string {
    let result = prefix;
    let counter = 0;
    for (;;) {
      if (!existing.includes(result)) {
        return result;
      }
      result = `${prefix}-${counter}`;
      counter++;
    }
  }

  static getChildren(
    tilesets: Tileset[],
    externalTilesetDirectories: string[],
    tilesetJsonFileNames: string[]
  ) {
    const length = tilesets.length;
    const children = Array<Tile>(length);
    for (let i = 0; i < length; ++i) {
      const tilesetJsonFileName = tilesetJsonFileNames[i];
      const externalTilesetDirectory = externalTilesetDirectories[i];
      const tilesetUrl = Paths.join(
        externalTilesetDirectory,
        tilesetJsonFileName
      );

      children[i] = tilesets[i].root;
      children[i].content = {
        uri: tilesetUrl,
      };
      children[i].boundingVolume = {
        box: TilesetMergers.getBoundingBox(tilesets[i]),
      };
      delete children[i].children;
      delete children[i].transform;
      delete children[i].implicitTiling;
    }
    return children;
  }

  static getMergedGeometricError(tilesets: Tileset[]): number {
    let geometricError = 0.0;
    const length = tilesets.length;
    for (let i = 0; i < length; ++i) {
      geometricError = Math.max(geometricError, tilesets[i].geometricError);
    }
    return geometricError;
  }

  static getBoundingBox(tileset: Tileset): number[] {
    const root = tileset.root;
    const boundingVolume = root.boundingVolume;
    const boundingVolumeBox =
      BoundingVolumes.computeBoundingVolumeBoxFromBoundingVolume(
        boundingVolume
      );
    if (boundingVolumeBox === undefined) {
      throw new TilesetError("No bounding volume found in root tile");
    }
    if (root.transform === undefined) {
      return boundingVolumeBox;
    }
    return BoundingVolumes.transformBoundingVolumeBox(
      boundingVolumeBox,
      root.transform
    );
  }

  static getMergedBox(tilesets: Tileset[]): number[] {
    const length = tilesets.length;
    const boundingBoxes = Array<number[]>(length);
    for (let i = 0; i < length; ++i) {
      boundingBoxes[i] = TilesetMergers.getBoundingBox(tilesets[i]);
    }
    const boundingBox =
      BoundingVolumes.computeUnionBoundingVolumeBox(boundingBoxes);
    return boundingBox;
  }
}

import path from "path";
import { ContentDataTypeChecks } from "../contentTypes/ContentDataTypeChecks";
import { ContentDataTypes } from "../contentTypes/ContentDataTypes";
import { Tileset } from "../structure/Tileset";

import { TilesetCombiner } from "../tilesetProcessing/TilesetCombiner";
import { TilesetMerger } from "../tilesetProcessing/TilesetMerger";
import { TilesetUpgrader } from "../tilesetProcessing/TilesetUpgrader";

/**
 * Methods related to tilesets.
 *
 * Most of the methods in this class are either utility methods, or
 * wrappers around the classes that implement parts of the command
 * line functionality (and that may become `TilesetStage`s in a
 * pipeline at some point).
 */
export class Tilesets {
  /**
   * Performs the `combine` command line operation.
   *
   * @param tilesetSourceName - The tileset source name
   * @param tilesetTargetName - The tileset target name
   * @param overwrite Whether the target should be overwritten if
   * it already exists
   * @returns A promise that resolves when the process is finished
   * @throws TilesetError When the input could not be processed,
   * or when the output already exists and `overwrite` was `false`.
   */
  static async combine(
    tilesetSourceName: string,
    tilesetTargetName: string,
    overwrite: boolean
  ): Promise<void> {
    const externalTilesetDetector = ContentDataTypeChecks.createIncludedCheck(
      ContentDataTypes.CONTENT_TYPE_TILESET
    );
    const tilesetCombiner = new TilesetCombiner(externalTilesetDetector);
    await tilesetCombiner.combine(
      tilesetSourceName,
      tilesetTargetName,
      overwrite
    );
  }

  /**
   * Performs the `merge` command line operation.
   *
   * @param tilesetSourceName - The tileset source name
   * @param tilesetTargetName - The tileset target name
   * @param overwrite Whether the target should be overwritten if
   * it already exists
   * @returns A promise that resolves when the process is finished
   * @throws TilesetError When the input could not be processed,
   * or when the output already exists and `overwrite` was `false`.
   */
  static async merge(
    tilesetSourceNames: string[],
    tilesetTargetName: string,
    overwrite: boolean
  ): Promise<void> {
    const tilesetMerger = new TilesetMerger();
    await tilesetMerger.merge(tilesetSourceNames, tilesetTargetName, overwrite);
  }

  /**
   * Performs the `upgrade` command line operation.
   *
   * @param tilesetSourceName - The tileset source name
   * @param tilesetTargetName - The tileset target name
   * @param overwrite Whether the target should be overwritten if
   * it already exists
   * @param gltfUpgradeOptions - Options that may be passed
   * to `gltf-pipeline` when GLB data in B3DM or I3DM is
   * supposed to be upgraded.
   * @returns A promise that resolves when the process is finished
   * @throws TilesetError When the input could not be processed,
   * or when the output already exists and `overwrite` was `false`.
   */
  static async upgrade(
    tilesetSourceName: string,
    tilesetTargetName: string,
    overwrite: boolean,
    gltfUpgradeOptions: any
  ) {
    const quiet = false;
    const tilesetUpgrader = new TilesetUpgrader(quiet, gltfUpgradeOptions);
    tilesetUpgrader.upgrade(tilesetSourceName, tilesetTargetName, overwrite);
  }

  /**
   * Performs the `upgrade` operation directly on a tileset
   *
   * @returns A promise that resolves when the process is finished
   * @throws TilesetError When the input could not be processed
   */
  static async upgradeTileset(tileset: Tileset) {
    const quiet = false;
    const gltfUpgradeOptions = undefined;
    const tilesetUpgrader = new TilesetUpgrader(quiet, gltfUpgradeOptions);
    await tilesetUpgrader.upgradeTileset(tileset);
  }

  /**
   * Determine the name of the file that contains the tileset JSON data.
   *
   * If the given name ends with '.json' (case insensitively), then the
   * name is the last path component of the given name.
   *
   * Otherwise (if the given name is a directory, or the name of a file
   * that does not end with '.json'), then the default name 'tileset.json'
   * is returned.
   *
   * @param tilesetSourceName - The tileset source name
   * @returns The tileset file name
   */
  static determineTilesetJsonFileName(tilesetSourceName: string): string {
    if (tilesetSourceName.toLowerCase().endsWith(".json")) {
      return path.basename(tilesetSourceName);
    }
    return "tileset.json";
  }

  /**
   * Returns whether the given names likely refer to the same package.
   *
   * This will interpret the given strings as paths and normalize them.
   * When the names end with `.json` (case insensitively), then the
   * method returns whether the names refer to the same directory.
   * Otherwise, it returns whether the paths are equal.
   *
   * @param tilesetPackageName0 - The first package name
   * @param tilesetPackageName1 - The second package name
   * @returns Whether the names refer to the same package
   */
  static areEqualPackages(
    tilesetPackageName0: string,
    tilesetPackageName1: string
  ): boolean {
    let name0 = path.normalize(tilesetPackageName0);
    if (name0.toLowerCase().endsWith(".json")) {
      name0 = path.dirname(tilesetPackageName0);
    }
    let name1 = path.normalize(tilesetPackageName1);
    if (name1.toLowerCase().endsWith(".json")) {
      name1 = path.dirname(tilesetPackageName1);
    }
    return name0 === name1;
  }
}

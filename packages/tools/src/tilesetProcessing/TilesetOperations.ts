import { ContentDataTypeChecks } from "@3d-tiles-tools/base";
import { ContentDataTypes } from "@3d-tiles-tools/base";

import { Tileset } from "@3d-tiles-tools/structure";

import { TilesetCombiner } from "./TilesetCombiner";
import { TilesetMerger } from "./TilesetMerger";
import { TilesetUpgrader } from "./TilesetUpgrader";

export class TilesetOperations {
  /**
   * Performs the `combine` command line operation.
   *
   * @param tilesetSourceName - The tileset source name
   * @param tilesetTargetName - The tileset target name
   * @param overwrite - Whether the target should be overwritten if
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
   * @param overwrite - Whether the target should be overwritten if
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
   * @param overwrite - Whether the target should be overwritten if
   * it already exists
   * @param targetVersion - The target version - 1.0 or 1.1
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
    targetVersion: string,
    gltfUpgradeOptions: any
  ) {
    const tilesetUpgrader = new TilesetUpgrader(
      targetVersion,
      gltfUpgradeOptions
    );
    await tilesetUpgrader.upgrade(
      tilesetSourceName,
      tilesetTargetName,
      overwrite
    );
  }

  /**
   * Performs the `upgrade` operation directly on a tileset
   *
   * @param tileset - The tileset
   * @param targetVersion - The target version - 1.0 or 1.1
   * @returns A promise that resolves when the process is finished
   * @throws TilesetError When the input could not be processed
   */
  static async upgradeTileset(tileset: Tileset, targetVersion: string) {
    const gltfUpgradeOptions = undefined;
    const tilesetUpgrader = new TilesetUpgrader(
      targetVersion,
      gltfUpgradeOptions
    );
    await tilesetUpgrader.upgradeTileset(tileset);
  }
}

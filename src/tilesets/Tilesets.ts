import path from "path";
import { ContentDataTypeChecks } from "../contentTypes/ContentDataTypeChecks";
import { ContentDataTypes } from "../contentTypes/ContentDataTypes";

import { TilesetCombiner } from "../tilesetProcessing/TilesetCombiner";
import { TilesetMerger } from "../tilesetProcessing/TilesetMerger";
import { TilesetUpgrader } from "../tilesetProcessing/TilesetUpgrader";

/**
 * Methods related to tilesets
 */
export class Tilesets {
  static async combine(
    tilesetSourceName: string,
    tilesetTargetName: string,
    overwrite: boolean
  ): Promise<void> {

    const externalTilesetDetector = ContentDataTypeChecks.createCheck(
      ContentDataTypes.CONTENT_TYPE_TILESET);
    const tilesetCombiner = new TilesetCombiner(externalTilesetDetector);
    await tilesetCombiner.combine(
      tilesetSourceName,
      tilesetTargetName,
      overwrite
    );
  }

  static async merge(
    tilesetSourceNames: string[],
    tilesetTargetName: string,
    overwrite: boolean
  ): Promise<void> {
    const tilesetMerger = new TilesetMerger();
    await tilesetMerger.merge(tilesetSourceNames, tilesetTargetName, overwrite);
  }

  static async upgrade(tilesetSourceName: string, tilesetTargetName: string) {
    const tilesetUpgrader = new TilesetUpgrader();
    tilesetUpgrader.upgrade(tilesetSourceName, tilesetTargetName);
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
}

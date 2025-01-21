import path from "path";

import { TilesetSource } from "../../tilesets";
import { TilesetSources } from "../../tilesets";
import { TilesetTarget } from "../../tilesets";
import { TilesetTargets } from "../../tilesets";
import { TilesetError } from "../../tilesets";
import { Tilesets } from "../../tilesets";
import { ZipToPackage } from "../../tilesets";

import { Loggers } from "../../base";
const logger = Loggers.get("tilesetProcessing");

/**
 * Methods for converting tilesets between different storage formats.
 * (i.e. the file system, or 3D Tiles archives/packages).
 *
 * @internal
 */
export class TilesetConverter {
  /**
   * Convert a source tileset to a target tileset.
   *
   * The source and target names can be
   * - The path to a tileset JSON file
   * - A directory that contains a `tileset.json` file
   * - A 3D Tiles package (with `.3tz` or `.3dtiles` extension)
   *
   * Package files are required to contain a `tileset.json` file for the
   * top-level tileset. When the source was a specific tileset JSON file,
   * then this file will be renamed to `tileset.json` if necessary for
   * writing it into a package (and if this causes a duplicate entry, then
   * an error will be thrown). Otherwise, it is expected that the source
   * contains a file that matches the required file for the output.
   *
   * @param tilesetSource - The tileset source
   * @param tilesetSourceJsonFileName - The name of the tileset JSON file
   * in the source
   * @param tilesetTarget - The tileset target
   * @param tilesetTargetJsonFileName - The name of the tileset JSON file
   * in the target
   * @returns A promise that resolves when the process is finished
   * @throws TilesetError If the requirements for the tileset JSON
   * file names (stated above) are not met.
   */
  static async convert(
    tilesetSourceName: string,
    tilesetSourceJsonFileName: string | undefined,
    tilesetTargetName: string,
    overwrite: boolean
  ) {
    const inputExtension = path.extname(tilesetSourceName).toLowerCase();
    if (inputExtension === ".zip") {
      if (tilesetSourceJsonFileName === undefined) {
        tilesetSourceJsonFileName =
          Tilesets.determineTilesetJsonFileName(tilesetSourceName);
      }
      await ZipToPackage.convert(
        tilesetSourceName,
        tilesetSourceJsonFileName,
        tilesetTargetName,
        overwrite
      );
      return;
    }
    if (tilesetSourceJsonFileName === undefined) {
      tilesetSourceJsonFileName =
        Tilesets.determineTilesetJsonFileName(tilesetSourceName);
    }
    const tilesetTargetJsonFileName =
      Tilesets.determineTilesetJsonFileName(tilesetTargetName);
    const tilesetSource = await TilesetSources.createAndOpen(tilesetSourceName);
    const tilesetTarget = await TilesetTargets.createAndBegin(
      tilesetTargetName,
      overwrite
    );

    try {
      await TilesetConverter.convertData(
        tilesetSource,
        tilesetSourceJsonFileName,
        tilesetTarget,
        tilesetTargetJsonFileName
      );
    } finally {
      await tilesetSource.close();
      await tilesetTarget.end();
    }
  }

  /**
   * Convert a source tileset to a target tileset.
   *
   * The source and target names can be
   * - The path to a tileset JSON file
   * - A directory that contains a `tileset.json` file
   * - A 3D Tiles package (with `.3tz` or `.3dtiles` extension)
   *
   * Package files are required to contain a `tileset.json` file for the
   * top-level tileset. When the source was a specific tileset JSON file,
   * then this file will be renamed to `tileset.json` if necessary for
   * writing it into a package (and if this causes a duplicate entry, then
   * an error will be thrown). Otherwise, it is expected that the source
   * contains a file that matches the required file for the output.
   *
   * @param tilesetSource - The tileset source
   * @param tilesetSourceJsonFileName - The name of the tileset JSON file
   * in the source
   * @param tilesetTarget - The tileset target
   * @param tilesetTargetJsonFileName - The name of the tileset JSON file
   * in the target
   * @returns A promise that resolves when the process is finished
   * @throws TilesetError If the requirements for the tileset JSON
   * file names (stated above) are not met.
   */
  static async convertData(
    tilesetSource: TilesetSource,
    tilesetSourceJsonFileName: string,
    tilesetTarget: TilesetTarget,
    tilesetTargetJsonFileName: string
  ): Promise<void> {
    const keys = await tilesetSource.getKeys();

    // This could be much shorter, but has to handle the case
    // that the source or target JSON file names do not match the
    // default/recommended case of being called `tileset.json`. It
    // has to keep track of whether the designated source name was
    // found, and the target that it may have been renamed to, and
    // keep track of whether this renaming caused a duplicate (e.g.
    // when the input contained `example.json` and `tileset.json`,
    // but `example.json` was said to be the top-level name in the
    // source and should be stored as `tileset.json` in the target)
    let tilesetSourceJsonFileNameWasFound = false;
    let causedDuplicate = false;
    for await (const key of keys) {
      const content = await tilesetSource.getValue(key);
      if (content) {
        if (key === tilesetSourceJsonFileName) {
          tilesetSourceJsonFileNameWasFound = true;
          if (tilesetSourceJsonFileName !== tilesetTargetJsonFileName) {
            logger.debug(
              `Storing ${tilesetSourceJsonFileName} from source` +
                `as ${tilesetTargetJsonFileName} in target`
            );
          }
          await tilesetTarget.addEntry(tilesetTargetJsonFileName, content);
        } else {
          if (key === tilesetTargetJsonFileName) {
            causedDuplicate = true;
          }
          await tilesetTarget.addEntry(key, content);
        }
      }
    }
    if (!tilesetSourceJsonFileNameWasFound) {
      throw new TilesetError(
        `File ${tilesetSourceJsonFileName} was not found in source`
      );
    }
    if (causedDuplicate) {
      throw new TilesetError(
        `The input tileset JSON file name ${tilesetSourceJsonFileName} ` +
          `becomes ${tilesetTargetJsonFileName} in the output, ` +
          `causing a duplicate entry`
      );
    }
  }
}

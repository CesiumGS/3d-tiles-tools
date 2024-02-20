import path from "path";

import { TilesetSources } from "../../tilesets";
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
   * Convert an input tileset to an output tileset.
   *
   * The input and output are the names of tileset sources and targets.
   *
   * The input and output can be
   * - The path to a tileset JSON file
   * - A directory that contains a `tileset.json` file
   * - A 3D Tiles package (with `.3tz` or `.3dtiles` extension)
   *
   * Package files are required to contain a `tileset.json` file for the
   * top-level tileset. When the input was a specific tileset JSON file,
   * then this file will be renamed to `tileset.json` if necessary for
   * writing it into a package (and if this causes a duplicate entry, then
   * an error will be thrown). Otherwise, it is expected that the input
   * contains a file that matches the required file for the output.
   *
   * @param input - The full input name
   * @param inputTilesetJsonFileName - The name of the tileset JSON file
   * in the input. When this is not given, then the name will either be
   * the file name of the input (if the input was a JSON file), or default
   * to 'tileset.json' (if the input was a directory or a tileset package)
   * @param output - The full output name
   * @param force - Whether existing output files may be overwritten
   * @returns A promise that resolves when the process is finished
   * @throws TilesetError If the requirements for the tileset JSON
   * file names (stated above) are not met.
   */
  static async convert(
    input: string,
    inputTilesetJsonFileName: string | undefined,
    output: string,
    force: boolean
  ) {
    if (inputTilesetJsonFileName === undefined) {
      inputTilesetJsonFileName = Tilesets.determineTilesetJsonFileName(input);
    }
    const outputTilesetJsonFileName =
      Tilesets.determineTilesetJsonFileName(output);

    const inputExtension = path.extname(input).toLowerCase();
    if (inputExtension === ".zip") {
      await ZipToPackage.convert(
        input,
        inputTilesetJsonFileName,
        output,
        force
      );
      return;
    }

    const tilesetSource = TilesetSources.createAndOpen(input);
    const tilesetTarget = TilesetTargets.createAndBegin(output, force);
    let inputTilesetJsonFileNameWasFound = false;
    let causedDuplicate = false;
    const keys = tilesetSource.getKeys();
    for (const key of keys) {
      const content = tilesetSource.getValue(key);
      if (content) {
        if (key === inputTilesetJsonFileName) {
          inputTilesetJsonFileNameWasFound = true;
          if (inputTilesetJsonFileName !== outputTilesetJsonFileName) {
            logger.debug(
              `Storing ${inputTilesetJsonFileName} from ${input} ` +
                `as ${outputTilesetJsonFileName} in ${output}`
            );
          }
          tilesetTarget.addEntry(outputTilesetJsonFileName, content);
        } else {
          if (key === outputTilesetJsonFileName) {
            causedDuplicate = true;
          }
          tilesetTarget.addEntry(key, content);
        }
      }
    }
    tilesetSource.close();
    await tilesetTarget.end();

    if (!inputTilesetJsonFileNameWasFound) {
      throw new TilesetError(
        `File ${inputTilesetJsonFileName} was not found in ${input}`
      );
    }
    if (causedDuplicate) {
      throw new TilesetError(
        `The input tileset JSON file name ${inputTilesetJsonFileName} ` +
          `becomes ${outputTilesetJsonFileName} in the output, ` +
          `causing a duplicate entry`
      );
    }
  }
}

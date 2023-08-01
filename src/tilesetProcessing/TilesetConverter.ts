import path from "path";

import { ZipToPackage } from "../packages/ZipToPackage";

import { TilesetSources } from "../tilesetData/TilesetSources";
import { TilesetTargets } from "../tilesetData/TilesetTargets";
import { TilesetError } from "../tilesetData/TilesetError";

import { Tilesets } from "../tilesets/Tilesets";

/**
 * Methods for converting tilesets between different storage formats.
 * (i.e. the file system, or 3D Tiles archives/packages, or in ZIP
 * files)
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
   * The input can alternatively be a `.zip` file.
   *
   * Package files are required to contain a `tileset.json` file for the
   * top-level tileset. When the input was a specific tileset JSON file,
   * then this file will be renamed to `tileset.json` if necessary for
   * writing it into a package (and if this causes a duplicate entry, then
   * an error will be thrown). Otherwise, it is expected that the input
   * contains a file that matches the required file for the output.
   *
   * @param input - The full input name
   * @param output - The full output name
   * @param force - Whether existing output files may be overwritten
   * @returns A promise that resolves when the process is finished
   * @throws TilesetError If the requirements for the tileset JSON
   * file names (stated above) are not met.
   */
  static async convert(input: string, output: string, force: boolean) {
    const inputExtension = path.extname(input).toLowerCase();
    if (inputExtension === ".zip") {
      await ZipToPackage.convert(input, output, force);
      return;
    }

    const inputTilesetJsonFileName =
      Tilesets.determineTilesetJsonFileName(input);
    const outputTilesetJsonFileName =
      Tilesets.determineTilesetJsonFileName(output);

    const tilesetSource = TilesetSources.createAndOpen(input);
    const tilesetTarget = TilesetTargets.createAndBegin(output, force);
    let inputJsonFileNameWasFound = false;
    let causedDuplicate = false;
    const keys = tilesetSource.getKeys();
    for (const key of keys) {
      const content = tilesetSource.getValue(key);
      if (content) {
        if (key === inputTilesetJsonFileName) {
          inputJsonFileNameWasFound = true;
          if (inputTilesetJsonFileName !== outputTilesetJsonFileName) {
            console.log(
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

    if (!inputJsonFileNameWasFound) {
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

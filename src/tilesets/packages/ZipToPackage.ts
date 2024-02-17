import StreamZip from "node-stream-zip";

import { Paths } from "../../base";

import { TilesetTargets } from "../tilesetData/TilesetTargets";
import { Tilesets } from "../tilesets/Tilesets";
import { TilesetError } from "../tilesetData/TilesetError";

/**
 * Methods for converting ZIP files into 3D Tiles packages.
 *
 * @internal
 */
export class ZipToPackage {
  /**
   * Writes the data from the given input file (which is assumed to be a plain
   * ZIP file) into a tileset target.
   *
   * The type of the output depends on the extension of the output file name:
   * If it is `.3tz`, then the output will be a 3TZ archive
   * If it is `.3dtiles`, then the output will be a 3DTILES package
   * If it is empty, then the output will be a directory
   *
   * @param inputFileName - The full input file name
   * @param inputTilesetJsonFileName - The name of the tileset JSON file that
   * is expected to be present in the ZIP. This will usually be
   * 'tileset.json', but can be overridden to use another JSON file as
   * the main tileset JSON file.
   * @param outputFileName - The full output file name
   * @param overwrite - Whether the output file should be overwritten
   * if it already exists
   * @throws TilesetError If the input did not contain the tileset JSON
   * file that was expected for the input or the output.
   */
  static async convert(
    inputFileName: string,
    inputTilesetJsonFileName: string,
    outputFileName: string,
    overwrite: boolean
  ) {
    const zip = new StreamZip.async({ file: inputFileName });

    const tilesetTarget = TilesetTargets.createAndBegin(
      outputFileName,
      overwrite
    );

    const outputTilesetJsonFileName =
      Tilesets.determineTilesetJsonFileName(outputFileName);

    let inputTilesetJsonFileNameWasFound = false;
    let outputTilesetJsonFileNameWasFound = false;

    // When a the output is a directory, then there
    // is no requirement for the output file name
    if (Paths.isDirectory(outputFileName)) {
      outputTilesetJsonFileNameWasFound = true;
    }

    const entries = await zip.entries();
    for (const entry of Object.values(entries)) {
      const e = entry as any;
      if (!e.isDirectory) {
        let key = e.name;
        const content = await zip.entryData(e.name);
        if (content) {
          if (key === inputTilesetJsonFileName) {
            inputTilesetJsonFileNameWasFound = true;
            key = outputTilesetJsonFileName;
          }
          if (key === outputTilesetJsonFileName) {
            outputTilesetJsonFileNameWasFound = true;
          }
          tilesetTarget.addEntry(key, content);
        }
      }
    }
    await zip.close();
    await tilesetTarget.end();

    if (!inputTilesetJsonFileNameWasFound) {
      throw new TilesetError(
        `File ${inputFileName} did not contain a ${inputTilesetJsonFileName}`
      );
    }
    if (!outputTilesetJsonFileNameWasFound) {
      throw new TilesetError(
        `File ${inputFileName} did not contain a ${outputTilesetJsonFileName}`
      );
    }
  }
}

import StreamZip from "node-stream-zip";

import { TilesetTargets } from "../tilesetData/TilesetTargets";
import { Tilesets } from "../tilesets/Tilesets";
import { TilesetError } from "../tilesetData/TilesetError";
import { Paths } from "../base/Paths";

/**
 * Methods for converting ZIP files into 3D Tiles packages.
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
   * @param inputFileName The full input file name
   * @param outputFileName The full output file name
   * @param overwrite Whether the output file should be overwritten
   * if it already exists
   * @throws TilesetError If the input did not contain the tileset JSON
   * file that was expected for the output.
   */
  static async convert(
    inputFileName: string,
    outputFileName: string,
    overwrite: boolean
  ) {
    const zip = new StreamZip.async({ file: inputFileName });

    const tilesetTarget = TilesetTargets.createAndBegin(
      outputFileName,
      overwrite
    );

    const outputJsonFileName =
      Tilesets.determineTilesetJsonFileName(outputFileName);

    let outputJsonFileNameWasFound = false;

    // When a ZIP is converted into a directory, then there
    // is no requirement for the output file name
    if (Paths.isDirectory(outputFileName)) {
      outputJsonFileNameWasFound = true;
    }

    const entries = await zip.entries();
    for (const entry of Object.values(entries)) {
      const e = entry as any;
      if (!e.isDirectory) {
        const key = e.name;
        const content = await zip.entryData(e.name);
        if (content) {
          if (key === outputJsonFileName) {
            outputJsonFileNameWasFound = true;
          }
          tilesetTarget.addEntry(key, content);
        }
      }
    }
    await zip.close();
    await tilesetTarget.end();

    if (!outputJsonFileNameWasFound) {
      throw new TilesetError(
        `File ${inputFileName} did not contain a ${outputJsonFileName}`
      );
    }
  }
}

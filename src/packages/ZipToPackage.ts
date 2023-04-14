import StreamZip from "node-stream-zip";

import { TilesetTargets } from "../tilesetData/TilesetTargets";

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
    tilesetTarget.begin(outputFileName, overwrite);

    const entries = await zip.entries();
    for (const entry of Object.values(entries)) {
      const e = entry as any;
      if (!e.isDirectory) {
        const key = e.name;
        const content = await zip.entryData(e.name);
        if (content) {
          tilesetTarget.addEntry(key, content);
        }
      }
    }
    await zip.close();
    await tilesetTarget.end();
  }
}

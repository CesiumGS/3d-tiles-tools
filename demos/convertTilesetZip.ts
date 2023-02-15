import path from "path";
import StreamZip from "node-stream-zip";

import { TilesetTargets } from "../src/tilesetData/TilesetTargets";

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
export async function convertTilesetZip(
  inputFileName: string,
  outputFileName: string,
  overwrite: boolean
) {
  const zip = new StreamZip.async({ file: inputFileName });

  const outputExtension = path.extname(outputFileName).toLowerCase();
  const tilesetTarget = TilesetTargets.create(outputExtension)!;
  tilesetTarget.begin(outputFileName, overwrite);

  const entries = await zip.entries();
  for (const entry of Object.values(entries)) {
    const e = entry as any;
    if (!e.isDirectory) {
      const key = e.name;
      const content = await zip.entryData(e.name);
      tilesetTarget.addEntry(key, content!);
    }
  }
  await zip.close();
  await tilesetTarget.end();
}

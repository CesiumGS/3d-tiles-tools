/* eslint-disable @typescript-eslint/no-unused-vars */

import { TilesetEntry } from "../src/tilesetData/TilesetEntry";

/**
 * Utility class for processing tileset entries for the specs.
 *
 * It offers "dummy" methods for
 * - modification of the URIs (file names)
 * - content processing (just changing the file name)
 * and stores all processed source entry names so that
 * the exact set of processed entries may be checked
 * in the tests.
 */
export class SpecEntryProcessor {
  processedKeys: string[] = [];

  processUri = (uri: string) => {
    return "PROCESSED_" + uri;
  };

  processEntry = async (
    sourceEntry: TilesetEntry,
    type: string | undefined
  ) => {
    this.processedKeys.push(sourceEntry.key);
    return {
      key: this.processUri(sourceEntry.key),
      value: sourceEntry.value,
    };
  };
}

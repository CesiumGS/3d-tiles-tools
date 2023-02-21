import { ContentOps } from "../contentOperations/ContentOps";

import { TilesetEntry } from "../tilesetData/TilesetEntry";

export class TilesetEntries {
  static gzip(inputEntry: TilesetEntry): TilesetEntry {
    const inputKey = inputEntry.key;
    const inputValue = inputEntry.value;
    const outputKey = inputKey;
    const outputValue = ContentOps.gzipBuffer(inputValue);
    return {
      key: outputKey,
      value: outputValue,
    };
  }

  static gunzip(inputEntry: TilesetEntry): TilesetEntry {
    const inputKey = inputEntry.key;
    const inputValue = inputEntry.value;
    const outputKey = inputKey;
    const outputValue = ContentOps.gunzipBuffer(inputValue);
    return {
      key: outputKey,
      value: outputValue,
    };
  }
}

import { Buffers } from "../base/Buffers";

import { Paths } from "../base/Paths";
import { ContentOps } from "../contentOperations/ContentOps";
import { TilesetEntry } from "../tilesetData/TilesetEntry";

export class TilesetEntries {
  static hasExtension(entry: TilesetEntry, ...extensions: string[]): boolean {
    const key = entry.key;
    return Paths.hasExtension(key, ...extensions);
  }
  static isGzipped(entry: TilesetEntry): boolean {
    const value = entry.value;
    return Buffers.isGzipped(value);
  }

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

import zlib from "zlib";
import { Buffers } from "../base/Buffers";

import { Paths } from "../base/Paths";
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
    const outputValue = zlib.gzipSync(inputValue);
    return {
      key: outputKey,
      value: outputValue,
    };
  }

  static ungzip(inputEntry: TilesetEntry): TilesetEntry {
    const inputKey = inputEntry.key;
    const inputValue = inputEntry.value;
    const outputKey = inputKey;
    let outputValue: Buffer;
    if (Buffers.isGzipped(inputValue)) {
      outputValue = zlib.gunzipSync(inputValue);
    } else {
      outputValue = inputValue;
    }
    return {
      key: outputKey,
      value: outputValue,
    };
  }
}

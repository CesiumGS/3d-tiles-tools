import { Buffers } from "../base/Buffers";

import { TilesetEntry } from "../tilesetData/TilesetEntry";

export class TilesetEntries {
  static gzip(inputEntry: TilesetEntry): TilesetEntry {
    const inputKey = inputEntry.key;
    const inputValue = inputEntry.value;
    const outputKey = inputKey;
    const outputValue = Buffers.gzip(inputValue);
    return {
      key: outputKey,
      value: outputValue,
    };
  }

  static gunzip(inputEntry: TilesetEntry): TilesetEntry {
    const inputKey = inputEntry.key;
    const inputValue = inputEntry.value;
    const outputKey = inputKey;
    const outputValue = Buffers.gunzip(inputValue);
    return {
      key: outputKey,
      value: outputValue,
    };
  }
}

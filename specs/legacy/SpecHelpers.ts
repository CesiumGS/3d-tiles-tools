import fs from "fs";
import path from "path";

import { Iterables } from "../../src/base/Iterables";

export class SpecHelpers {
  static getPaddedByteLength(byteLength: number): number {
    const boundary = 8;
    const remainder = byteLength % boundary;
    const padding = remainder === 0 ? 0 : boundary - remainder;
    return byteLength + padding;
  }

  static forceDeleteDirectory(p: string) {
    fs.rmSync(p, {
      force: true,
      recursive: true,
    });
  }

  static isJson(file: string): boolean {
    return path.extname(file) === ".json";
  }

  static getContentUris(string: string): string[] {
    const regex = new RegExp('"uri"\\s?:\\s?"([^"]*)"', "g");
    const matches = string.matchAll(regex);
    const uris: string[] = [];
    for (const match of matches) {
      uris.push(match[1]);
    }
    return uris;
  }

  static getNumberOfTilesets(directory: string): number {
    const recurse = true;
    const files = Iterables.overFiles(directory, recurse);
    let numberOfJsonFiles = 0;
    for (const file of files) {
      if (SpecHelpers.isJson(file)) {
        numberOfJsonFiles++;
      }
    }
    return numberOfJsonFiles;
  }
}

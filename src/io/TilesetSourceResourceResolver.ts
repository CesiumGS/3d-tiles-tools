import path from "path";

import { Paths } from "../base/Paths";
import { Uris } from "../base/Uris";

import { TilesetSource } from "../tilesetData/TilesetSource";

import { ResourceResolver } from "./ResourceResolver";

/**
 * Implementation of a `ResourceResolver` based on a `TilesetSource`
 *
 * @internal
 */
export class TilesetSourceResourceResolver implements ResourceResolver {
  private readonly _basePath: string;
  private readonly _tilesetSourceFileName: string;
  private readonly _tilesetSource: TilesetSource;

  constructor(
    basePath: string,
    tilesetSourceFileName: string,
    tilesetSource: TilesetSource
  ) {
    this._basePath = basePath;
    this._tilesetSourceFileName = tilesetSourceFileName;
    this._tilesetSource = tilesetSource;
  }

  resolveUri(uri: string): string {
    const resolved = path.resolve(this._basePath, decodeURIComponent(uri));
    return resolved;
  }

  async resolveData(uri: string): Promise<Buffer | null> {
    if (Uris.isDataUri(uri)) {
      const data = Buffer.from(uri.split(",")[1], "base64");
      return data;
    }
    if (Uris.isAbsoluteUri(uri)) {
      return null;
    }
    const localUri = Paths.join(this._basePath, uri);
    const entry = this._tilesetSource.getValue(localUri);
    if (!entry) {
      return null;
    }
    return entry!;
  }

  async resolveDataPartial(
    uri: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    maxBytes: number
  ): Promise<Buffer | null> {
    return await this.resolveData(uri);
  }

  derive(uri: string): ResourceResolver {
    const resolved = Paths.join(this._basePath, decodeURIComponent(uri));
    const result = new TilesetSourceResourceResolver(
      resolved,
      this._tilesetSourceFileName,
      this._tilesetSource
    );
    return result;
  }
}

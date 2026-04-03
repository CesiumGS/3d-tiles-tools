import { Paths } from "../../base";
import { Uris } from "../../base";
import { ResourceResolver } from "../../base";

import { TilesetSource } from "../tilesetData/TilesetSource";

/**
 * Implementation of a `ResourceResolver` based on a `TilesetSource`
 *
 * @internal
 */
export class TilesetSourceResourceResolver implements ResourceResolver {
  private readonly _basePath: string;
  private readonly _tilesetSource: TilesetSource;

  constructor(basePath: string, tilesetSource: TilesetSource) {
    this._basePath = basePath;
    this._tilesetSource = tilesetSource;
  }

  /** {@inheritDoc ResourceResolver.resolveUri} */
  resolveUri(uri: string): string {
    const resolved = Paths.join(this._basePath, uri);
    return resolved;
  }

  /** {@inheritDoc ResourceResolver.resolveData} */
  async resolveData(uri: string): Promise<Buffer | undefined> {
    return this.resolveDataInternal(uri);
  }

  /** {@inheritDoc ResourceResolver.resolveDataPartial} */
  async resolveDataPartial(
    uri: string,
    maxBytes: number
  ): Promise<Buffer | undefined> {
    const buffer = await this.resolveDataInternal(uri);
    if (!buffer) {
      return undefined;
    }
    return buffer.subarray(0, maxBytes);
  }

  private async resolveDataInternal(uri: string): Promise<Buffer | undefined> {
    if (Uris.isDataUri(uri)) {
      const data = Buffer.from(uri.split(",")[1], "base64");
      return data;
    }
    if (Uris.isAbsoluteUri(uri)) {
      return undefined;
    }
    const localUri = this.resolveUri(uri);
    const value = await this._tilesetSource.getValue(localUri);
    if (!value) {
      return undefined;
    }
    return value;
  }

  /** {@inheritDoc ResourceResolver.derive} */
  derive(uri: string): ResourceResolver {
    const resolved = Paths.join(this._basePath, decodeURIComponent(uri));
    const result = new TilesetSourceResourceResolver(
      resolved,
      this._tilesetSource
    );
    return result;
  }
}

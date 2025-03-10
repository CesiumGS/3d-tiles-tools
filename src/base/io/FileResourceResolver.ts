import fs from "fs";
import path from "path";

import { Uris } from "../base/Uris";

import { ResourceResolver } from "./ResourceResolver";
import { Paths } from "../base/Paths";

/**
 * Implementation of a `ResourceResolver` based on a file system.
 *
 * @internal (Instantiated by the `ResourceResolvers` class)
 */
export class FileResourceResolver implements ResourceResolver {
  private readonly _basePath: string;

  constructor(basePath: string) {
    this._basePath = basePath;
  }

  /** {@inheritDoc ResourceResolver.resolveUri} */
  resolveUri(uri: string): string {
    const resolved = Paths.join(this._basePath, decodeURIComponent(uri));
    return resolved;
  }

  /** {@inheritDoc ResourceResolver.resolveDataPartial} */
  async resolveDataPartial(
    uri: string,
    maxBytes: number
  ): Promise<Buffer | undefined> {
    if (Uris.isDataUri(uri)) {
      const data = Buffer.from(uri.split(",")[1], "base64");
      return data;
    }
    if (Uris.isAbsoluteUri(uri)) {
      return undefined;
    }
    const resolved = this.resolveUri(uri);
    try {
      const buffer = Buffer.alloc(maxBytes);
      const fd = fs.openSync(resolved, "r");
      fs.readSync(fd, buffer, 0, maxBytes, 0);
      fs.closeSync(fd);
      return buffer;
    } catch (error) {
      return undefined;
    }
  }

  /** {@inheritDoc ResourceResolver.resolveData} */
  async resolveData(uri: string): Promise<Buffer | undefined> {
    if (Uris.isDataUri(uri)) {
      const data = Buffer.from(uri.split(",")[1], "base64");
      return data;
    }
    if (Uris.isAbsoluteUri(uri)) {
      return undefined;
    }
    const resolved = this.resolveUri(uri);
    if (!fs.existsSync(resolved)) {
      return undefined;
    }
    const data = fs.readFileSync(resolved);
    // See https://github.com/nodejs/node/issues/35351
    const actualData = data.buffer.slice(
      data.byteOffset,
      data.byteOffset + data.byteLength
    );
    return Buffer.from(actualData);
  }

  /** {@inheritDoc ResourceResolver.derive} */
  derive(uri: string): ResourceResolver {
    const resolved = path.join(this._basePath, decodeURIComponent(uri));
    return new FileResourceResolver(resolved);
  }
}

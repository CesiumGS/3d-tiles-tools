import zlib from "zlib";

import { Buffers } from "../base/Buffers";

import { ResourceResolver } from "./ResourceResolver";

/**
 * Implementation of a `ResourceResolver` that obtains the resource
 * data from a delegate, and unzips the data if necessary.
 *
 * @internal (Instantiated by the `ResourceResolvers` class)
 */
export class UnzippingResourceResolver implements ResourceResolver {
  private readonly _delegate: ResourceResolver;

  constructor(delegate: ResourceResolver) {
    this._delegate = delegate;
  }

  /** {@inheritDoc ResourceResolver.resolveUri} */
  resolveUri(uri: string): string {
    return this._delegate.resolveUri(uri);
  }

  /** {@inheritDoc ResourceResolver.resolveData} */
  async resolveData(uri: string): Promise<Buffer | undefined> {
    const delegateData = await this._delegate.resolveData(uri);
    if (delegateData === undefined) {
      return undefined;
    }
    const isGzipped = Buffers.isGzipped(delegateData);
    if (!isGzipped) {
      return delegateData;
    }
    const data = zlib.gunzipSync(delegateData);
    return data;
  }

  /** {@inheritDoc ResourceResolver.resolveDataPartial} */
  async resolveDataPartial(
    uri: string,
    maxBytes: number
  ): Promise<Buffer | undefined> {
    const partialDelegateData = await this._delegate.resolveDataPartial(
      uri,
      maxBytes
    );
    if (partialDelegateData === undefined) {
      return undefined;
    }
    const isGzipped = Buffers.isGzipped(partialDelegateData);
    if (!isGzipped) {
      return partialDelegateData;
    }
    const fullDelegateData = await this._delegate.resolveData(uri);
    if (fullDelegateData === undefined) {
      return undefined;
    }
    const data = zlib.gunzipSync(fullDelegateData);
    return data;
  }

  /** {@inheritDoc ResourceResolver.derive} */
  derive(uri: string): ResourceResolver {
    return new UnzippingResourceResolver(this._delegate.derive(uri));
  }
}

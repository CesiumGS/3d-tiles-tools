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

  /** {@inheritDoc ResourceResolver.resolveData} */
  async resolveData(uri: string): Promise<Buffer | null> {
    const delegateData = await this._delegate.resolveData(uri);
    if (delegateData === null) {
      return null;
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
  ): Promise<Buffer | null> {
    const partialDelegateData = await this._delegate.resolveDataPartial(
      uri,
      maxBytes
    );
    if (partialDelegateData === null) {
      return null;
    }
    const isGzipped = Buffers.isGzipped(partialDelegateData);
    if (!isGzipped) {
      return partialDelegateData;
    }
    const fullDelegateData = await this._delegate.resolveData(uri);
    if (fullDelegateData === null) {
      return null;
    }
    const data = zlib.gunzipSync(fullDelegateData);
    return data;
  }

  /** {@inheritDoc ResourceResolver.derive} */
  derive(uri: string): ResourceResolver {
    return new UnzippingResourceResolver(this._delegate.derive(uri));
  }
}

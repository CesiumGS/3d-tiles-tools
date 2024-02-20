import path from "path";

import { defined } from "../base/defined";
import { Buffers } from "../base/Buffers";

import { ResourceResolver } from "../io/ResourceResolver";

import { ContentData } from "./ContentData";

/**
 * Lazy implementation of the `ContentData` interface.
 *
 * This implementation tries to obtain the least amount of data that
 * is required for the implementation of the interface methods:
 * It reads the data on demand, from a `ResourceResolver`,
 * caching the data internally for later calls.
 *
 * @internal
 */
export class LazyContentData implements ContentData {
  /**
   * The (relative) URI that was given in the constructor.
   * This is resolved using the `_resourceResolver`.
   */
  private readonly _uri: string;

  /**
   * The file extension from the URI, in lowercase,
   * including the `.` dot.
   */
  private readonly _extension: string;

  /**
   * The `ResourceResolver` that will be used for resolving
   * the (relative) URI upon request.
   */
  private readonly _resourceResolver: ResourceResolver;

  /**
   * Whether the content data likely exists at all.
   */
  private _exists: boolean | undefined;

  /**
   * The "magic header bytes" from the content data. These
   * are the first (up to) 4 bytes of the content data,
   * or the empty buffer if the content data could not
   * be resolved.
   */
  private _magic: Buffer | undefined;

  /**
   * The content data, or `null` if the data could not
   * be resolved.
   */
  private _data: Buffer | null;

  /**
   * Whether the `_data` was already requested
   */
  private _dataWasRequested: boolean;

  /**
   * The object that was parsed from the content, assuming
   * that the content was JSON. This is `undefined` if the
   * data could not be resolved, or it could not be parsed
   * to JSON.
   */
  private _parsedObject: any;

  /**
   * Whether the `_parsedObject` was already requested
   */
  private _parsedObjectWasRequested: boolean;

  /**
   * Creates a new instance of content data that is defined by
   * the given (usually relative) URI when it is resolved using
   * the given resource resolver.
   *
   * @param uri - The URI of the content data
   * @param resourceResolver - The `ResourceResolver` that will be
   * used for resolving the data from the given URI
   */
  constructor(uri: string, resourceResolver: ResourceResolver) {
    this._uri = uri;
    this._resourceResolver = resourceResolver;
    this._extension = path.extname(uri).toLowerCase();
    this._magic = undefined;
    this._data = null;
    this._dataWasRequested = false;
    this._parsedObject = undefined;
    this._parsedObjectWasRequested = false;
  }

  /** {@inheritDoc ContentData.uri} */
  get uri(): string {
    return this._uri;
  }

  /** {@inheritDoc ContentData.extension} */
  get extension(): string {
    return this._extension;
  }

  /** {@inheritDoc ContentData.exists} */
  async exists(): Promise<boolean> {
    if (defined(this._exists)) {
      return this._exists;
    }
    const partialData = await this._resourceResolver.resolveDataPartial(
      this._uri,
      1
    );
    this._exists = partialData !== null;
    return this._exists;
  }

  /** {@inheritDoc ContentData.getMagic} */
  async getMagic(): Promise<Buffer> {
    if (defined(this._magic)) {
      return this._magic;
    }
    const magicHeaderLength = 4;
    const partialData = await this._resourceResolver.resolveDataPartial(
      this._uri,
      magicHeaderLength
    );
    if (partialData) {
      this._magic = Buffers.getMagicBytes(partialData, 0, magicHeaderLength);
      this._exists = true;
    } else {
      this._magic = Buffer.alloc(0);
      this._exists = false;
    }
    return this._magic;
  }

  /** {@inheritDoc ContentData.getData} */
  async getData(): Promise<Buffer | null> {
    if (this._dataWasRequested) {
      return this._data;
    }
    this._data = await this._resourceResolver.resolveData(this._uri);
    this._dataWasRequested = true;
    this._exists = this._data !== null;
    return this._data;
  }

  /** {@inheritDoc ContentData.getParsedObject} */
  async getParsedObject(): Promise<any> {
    if (this._parsedObjectWasRequested) {
      return this._parsedObject;
    }
    const data = await this.getData();
    if (!data) {
      this._parsedObject = undefined;
      this._parsedObjectWasRequested = true;
      this._exists = false;
      return this._parsedObject;
    }
    this._exists = true;
    if (!Buffers.isProbablyJson(data)) {
      this._parsedObject = undefined;
      this._parsedObjectWasRequested = true;
      return this._parsedObject;
    }
    try {
      this._parsedObject = JSON.parse(data.toString());
      return this._parsedObject;
    } catch (error) {
      this._parsedObject = undefined;
      this._parsedObjectWasRequested = true;
      return this._parsedObject;
    }
  }
}

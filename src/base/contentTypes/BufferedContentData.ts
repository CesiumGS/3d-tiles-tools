import fs from "fs";
import path from "path";

import { Buffers } from "../base/Buffers";

import { ContentData } from "./ContentData";

import { Loggers } from "../logging/Loggers";
const logger = Loggers.get("tilesetProcessing");

/**
 * Implementation of the `ContentData` interface that stores
 * the full content data in a buffer.
 *
 * This could be completely synchronous. But every possibility
 * of anything being "async" causes the promises to be smeared
 * over all interfaces, through all call chains.
 *
 * @internal
 */
export class BufferedContentData implements ContentData {
  /**
   * Create content data from the given URI, assuming that it
   * is a file in the local file system.
   *
   * This will try to read the data from the given file, and
   * create a ContentData from that. If the data cannot be
   * read, a warning will be printed, and the method will
   * return a ContentData where `exists` returns `false`.
   *
   * @param uri - The URI
   * @returns The ContentData
   */
  static create(uri: string): ContentData {
    let data: Buffer | null = null;
    try {
      data = fs.readFileSync(uri);
    } catch (error) {
      logger.warn(`Could not read content data from ${uri}`);
    }
    return new BufferedContentData(uri, data);
  }

  /**
   * The (relative) URI that was given in the constructor.
   */
  private readonly _uri: string;

  /**
   * The file extension from the URI, in lowercase,
   * including the `.` dot.
   */
  private readonly _extension: string;

  /**
   * The "magic header bytes" from the content data. These
   * are the first (up to) 4 bytes of the content data,
   * or the empty buffer if the content data could not
   * be resolved.
   */
  private readonly _magic: Buffer;

  /**
   * The content data, or `null` if the data could not
   * be resolved.
   */
  private readonly _data: Buffer | null;

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
   * the given (usually relative) URI and the given buffer data
   *
   * @param uri - The URI of the content data
   * @param data - The actual content data buffer
   */
  constructor(uri: string, data: Buffer | null) {
    this._uri = uri;
    this._extension = path.extname(uri).toLowerCase();
    if (data) {
      const magicHeaderLength = 4;
      this._magic = Buffers.getMagicBytes(data, 0, magicHeaderLength);
    } else {
      this._magic = Buffer.alloc(0);
    }
    this._data = data;
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
    return this._data !== null;
  }

  /** {@inheritDoc ContentData.magic} */
  async getMagic(): Promise<Buffer> {
    return this._magic;
  }

  /** {@inheritDoc ContentData.data} */
  async getData(): Promise<Buffer | null> {
    return this._data;
  }

  /** {@inheritDoc ContentData.getParsedObject} */
  async getParsedObject(): Promise<any> {
    if (this._parsedObjectWasRequested) {
      return this._parsedObject;
    }
    if (!this._data) {
      this._parsedObject = undefined;
      this._parsedObjectWasRequested = true;
      return this._parsedObject;
    }
    if (!Buffers.isProbablyJson(this._data)) {
      this._parsedObject = undefined;
      this._parsedObjectWasRequested = true;
      return this._parsedObject;
    }
    try {
      this._parsedObject = JSON.parse(this._data.toString());
      return this._parsedObject;
    } catch (error) {
      this._parsedObject = undefined;
      this._parsedObjectWasRequested = true;
      return this._parsedObject;
    }
  }
}

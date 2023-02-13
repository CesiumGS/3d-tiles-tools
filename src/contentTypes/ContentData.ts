import path from "path";

import { defined } from "../base/defined";
import { Buffers } from "../base/Buffers";

import { ResourceResolver } from "../io/ResourceResolver";

/**
 * A class summarizing information about content data.
 *
 * @internal
 */
export class ContentData {

  // TODO Comments!
  // TODO This class should probably have an exists() : boolean
  // method. The validator currently calls getData() to check
  // this, defeating the purpose of the lazy loading...

  private readonly _uri: string;
  private readonly _extension: string;
  private readonly _resourceResolver: ResourceResolver;

  private _magic: string | undefined;

  private _data: Buffer | null;
  private _dataWasRequested: boolean;

  private _parsedObject: any;
  private _parsedObjectWasRequested: boolean;

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

  get uri(): string {
    return this._uri;
  }

  /**
   * Returns the extension of the file/URI from which
   * the buffer data was read, in lowercase, including
   * the `.` dot.
   */
  get extension(): string {
    return this._extension;
  }

  /**
   * Returns a string that consists of the first 4 bytes
   * of the buffer data (or fewer, if the buffer contains
   * less than 4 bytes)
   */
  async getMagic(): Promise<string> {
    if (defined(this._magic)) {
      return this._magic!;
    }
    const partialData = await this._resourceResolver.resolveDataPartial(
      this._uri,
      4
    );
    if (defined(partialData)) {
      this._magic = Buffers.getMagic(partialData!);
    } else {
      this._magic = "";
    }
    return this._magic;
  }

  /**
   * Returns the actual content data that was read from the URI.
   *
   * The data is fetched lazily when it is first requested, and
   * then cached for later calls.
   *
   * @returns The promise to the data, or to `null` when the
   * data could not be obtained.
   */
  async getData(): Promise<Buffer | null> {
    if (this._dataWasRequested) {
      return this._data;
    }
    this._data = await this._resourceResolver.resolveData(this._uri);
    this._dataWasRequested = true;
    return this._data;
  }

  /**
   * Returns the object that was parsed from the content data,
   * or `undefined` if no object could be parsed.
   *
   * The data is fetched lazily and the result is constructed
   * when it is first requested, and then cached for later calls.
   *
   * @returns The promise to the parsed object, or to `undefined`
   * when the data could not be obtained or not be parsed into
   * an object.
   */
  async getParsedObject(): Promise<any> {
    if (this._parsedObjectWasRequested) {
      return this._parsedObject;
    }
    const data = await this.getData();
    if (!defined(data)) {
      this._parsedObject = undefined;
      this._parsedObjectWasRequested = true;
      return this._parsedObject;
    }
    if (!Buffers.isProbablyJson(data!)) {
      this._parsedObject = undefined;
      this._parsedObjectWasRequested = true;
      return this._parsedObject;
    }
    try {
      this._parsedObject = JSON.parse(data!.toString());
      return this._parsedObject;
    } catch (error) {
      this._parsedObject = undefined;
      this._parsedObjectWasRequested = true;
      return this._parsedObject;
    }
  }
}

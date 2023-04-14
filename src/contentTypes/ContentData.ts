/**
 * An interface summarizing information about content data.
 *
 * @internal
 */
export interface ContentData {
  /**
   * Returns the URI that was given at construction time.
   */
  get uri(): string;

  /**
   * Returns the extension of the file/URI from which
   * the buffer data was read, in lowercase, including
   * the `.` dot.
   */
  get extension(): string;

  /**
   * Returns whether the content data likely exists, i.e. the URI
   * that was given in the constructor can actually be resolved and
   * the underlying data can be read.
   *
   * @returns A promise that indicates whether the data likely exists
   */
  exists(): Promise<boolean>;

  /**
   * Returns the first 4 bytes of the buffer data (or fewer, if the
   * buffer contains fewer than 4 bytes)
   *
   * @returns The magic bytes
   */
  getMagic(): Promise<Buffer>;

  /**
   * Returns the actual content data that was read from the URI.
   *
   * @returns The promise to the data, or to `null` when the
   * data could not be obtained.
   */
  getData(): Promise<Buffer | null>;

  /**
   * Returns the object that was parsed from the content data,
   * or `undefined` if no object could be parsed.
   *
   * @returns The promise to the parsed object, or to `undefined`
   * when the data could not be obtained or not be parsed into
   * an object.
   */
  getParsedObject(): Promise<any>;
}

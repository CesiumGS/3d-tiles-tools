/**
 * An error that may be thrown to indicate that input
 * data was invalid.
 *
 * This may refer to buffers that have been expected to
 * contain a certain type of data, but did not. For
 * example, a buffer that looked like a GZIpped buffer,
 * but turned out to be invalid, or a buffer that
 * looked like it contained valid JSON, but did not.
 *
 * @internal
 */
export class DataError extends Error {
  constructor(message: string) {
    super(message);
    // See https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes
    // #extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, DataError.prototype);
  }

  override toString = (): string => {
    return `${this.name}: ${this.message}`;
  };
}

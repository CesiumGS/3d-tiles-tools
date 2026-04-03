/**
 * An error that may be thrown to indicate that tile data
 * was invalid in some way, with the error mesage hopefully
 * containing some helpful details.
 *
 * @internal
 */
export class TileFormatError extends Error {
  constructor(message: string) {
    super(message);
    // See https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes
    // #extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, TileFormatError.prototype);
  }

  override toString = (): string => {
    return `${this.name}: ${this.message}`;
  };
}

/**
 * An error that may be thrown to indicate that a tileset
 * was invalid and could not be processed.
 *
 * @internal
 */
export class TilesetError extends Error {
  constructor(message: string) {
    super(message);
    // See https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes
    // #extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, TilesetError.prototype);
  }

  override toString = (): string => {
    return `${this.name}: ${this.message}`;
  };
}

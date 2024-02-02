/**
 * An error that may be thrown to indicate that processing
 * tile content failed (possible caused by a call to an
 * external library)
 *
 * @internal
 */
export class ContentError extends Error {
  constructor(message: string) {
    super(message);
    // See https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes
    // #extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, ContentError.prototype);
  }

  override toString = (): string => {
    return `${this.name}: ${this.message}`;
  };
}

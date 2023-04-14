/**
 * An error that may be thrown to indicate that an invalid
 * operation was performed, caused by a wrong API usage.
 *
 * @internal
 */
export class DeveloperError extends Error {
  constructor(message: string) {
    super(message);
    // See https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes
    // #extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, DeveloperError.prototype);
  }

  override toString = (): string => {
    return `${this.name}: ${this.message}`;
  };
}

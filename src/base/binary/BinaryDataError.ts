/**
 * An error that indicates that binary data was structurally invalid.
 *
 * @internal
 */
export class BinaryDataError extends Error {
  constructor(message: string) {
    super(message);
    // See https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes
    // #extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, BinaryDataError.prototype);
  }

  override toString = (): string => {
    return `${this.name}: ${this.message}`;
  };
}

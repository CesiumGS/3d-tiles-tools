/**
 * An error that indicates that metadata was structurally invalid.
 *
 * This may be thrown by methods that create the convenience classes
 * for this package, when the given inputs are not valid.
 *
 * @internal
 */
export class MetadataError extends Error {
  constructor(message: string) {
    super(message);
    // See https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes
    // #extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, MetadataError.prototype);
  }

  override toString = (): string => {
    return `${this.name}: ${this.message}`;
  };
}

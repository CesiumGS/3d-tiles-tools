/**
 * An error that may be thrown to indicate a problem with KTX encoding.
 *
 * @internal
 */
export class KtxError extends Error {
  constructor(message: string) {
    super(message);
    // See https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes
    // #extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, KtxError.prototype);
  }

  override toString = (): string => {
    return `${this.name}: ${this.message}`;
  };
}

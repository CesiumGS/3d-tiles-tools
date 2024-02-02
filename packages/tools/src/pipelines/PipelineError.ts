/**
 * An error that may be thrown to indicate that a pipeline
 * was invalid (for example, due to unknown stage names),
 * or one of the stages caused an error during execution.
 *
 * @internal
 */
export class PipelineError extends Error {
  constructor(message: string) {
    super(message);
    // See https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes
    // #extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, PipelineError.prototype);
  }

  override toString = (): string => {
    return `${this.name}: ${this.message}`;
  };
}

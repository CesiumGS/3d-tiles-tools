/**
 * An interface for classes that can resolve resources that
 * are given as URI strings.
 *
 * @internal
 */
export interface ResourceResolver {
  /**
   * Returns the URI that results from resolving the given
   * URI against the base URI of this resource resolver.
   *
   * The result will be a relative URI that includes path
   * components that reflect the paths that have been given
   * when this resource resolver was created by calling
   * `derive` on another resource resolver.
   *
   * @param uri - The URI
   * @returns The resolved URI
   */
  resolveUri(uri: string): string;

  /**
   * Resolve the data from the given URI.
   *
   * The given URI may be relative to the base URI for
   * which this instance has been created.
   *
   * @param uri - The URI
   * @returns A promise that resolves with the buffer data,
   * or with `undefined` if the resource could not be resolved.
   */
  resolveData(uri: string): Promise<Buffer | undefined>;

  /**
   * Resolve parts of the data from the given URI.
   *
   * The given URI may be relative to the base URI for
   * which this instance has been created.
   *
   * If the resource cannot be resolved, then `undefined` is
   * returned.
   *
   * Otherwise, the returned buffer contains _at least_ the
   * specified number of bytes. (It may be the full buffer,
   * if partial data requests are not supported).
   *
   * @param uri - The URI
   * @returns A promise that resolves with the buffer data,
   * or with `undefined` if the resource could not be resolved.
   */
  resolveDataPartial(
    uri: string,
    maxBytes: number
  ): Promise<Buffer | undefined>;

  /**
   * Derive an instance from this one, with a different base
   * directory.
   *
   * The given URI will be resolved against the base directory
   * of this instance. The returned instance will use the
   * resulting URI as its base URI.
   *
   * @param uri - The relative path
   * @returns A new instance with a different base URI
   */
  derive(uri: string): ResourceResolver;
}

/**
 * Utility methods related to URI strings.
 *
 * TODO This could probably be replaced with an NPM library
 * for URI handling. The billion dollar question: Which one?
 *
 * @internal
 */
export class Uris {
  /**
   * Returns whether the given URI is a data URI
   *
   * @param uri - The URI
   * @returns Whether the URI is a data URI
   */
  static isDataUri(uri: string): boolean {
    const dataUriRegex = /^data:/i;
    return dataUriRegex.test(uri);
  }

  /**
   * Returns whether the given URI is an absolute URI.
   *
   * This does not handle the case of absolute file URIs.
   *
   * @param uri - The URI
   * @returns Whether the URI is absolute
   */
  static isAbsoluteUri(uri: string): boolean {
    const s = uri.trim();
    if (s.startsWith("http://")) {
      return true;
    }
    if (s.startsWith("https://")) {
      return true;
    }
    return false;
  }
}

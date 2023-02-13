import { Content } from "../structure/Content";

/**
 * Utility methods related to tile content, given as `Content` object.
 */
export class Contents {
  /**
   * Obtains the URI from the given `Content`. If the given content
   * uses the (legacy) property name `url`, then a warning is printed
   * and the `url` is returned.
   *
   * This should never return `undefined`, but may be due to
   * invalid input data.
   *
   * @param content The `Content`
   * @returns The URI, or `undefined`
   */
  static getUri(content: Content): string | undefined {
    if (content.uri) {
      return content.uri;
    }
    const legacyContent = content as any;
    if (legacyContent.url) {
      console.warn(
        "The 'url' property of tile content is deprecated. Using it as 'uri' instead."
      );
      return legacyContent.url;
    }
    return undefined;
  }

  /**
   * If the given `Content` does not have a `uri` but uses the
   * legacy `url` property, then a message is logged, and the
   * `url` property is renamed to `uri`.
   *
   * @param content - The `Content`
   */
  static upgradeUrlToUri(
    content: Content,
    logCallback: (message: any) => void
  ): void {
    if (content.uri) {
      return;
    }
    const legacyContent = content as any;
    if (legacyContent.url) {
      logCallback(
        "The 'url' property of tile content is deprecated. Renaming it to 'uri'."
      );
      content.uri = legacyContent.url;
      delete legacyContent.url;
      return;
    }
    // This should never be the case:
    logCallback(
      "The content does not have a 'uri' property (and no legacy 'url' property)"
    );
  }
}

import { Content } from "../../structure";

import { Loggers } from "../../base";
const logger = Loggers.get("tilesets");

/**
 * Utility methods related to tile content, given as `Content` object.
 *
 * @internal
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
   * @param content - The `Content`
   * @returns The URI, or `undefined`
   */
  static getUri(content: Content): string | undefined {
    if (content.uri) {
      return content.uri;
    }
    const legacyContent = content as any;
    if (legacyContent.url) {
      logger.warn(
        "The 'url' property of tile content is deprecated. Using it as 'uri' instead."
      );
      return legacyContent.url;
    }
    return undefined;
  }
}

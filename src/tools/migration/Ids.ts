/**
 * Internal utility methods related to IDs
 *
 * @internal
 */
export class Ids {
  /**
   * Make sure that the given identifier matches the requirements
   * for an ID in the 3D Metadata specification.
   *
   * This will replace any characters with `_` underscores if they
   * do not match the regex `"^[a-zA-Z_][a-zA-Z0-9_]*$"`.
   *
   * @param identifier - The identifier
   * @returns The sanitized identifier
   */
  static sanitize(identifier: string) {
    let result = "";
    for (let i = 0; i < identifier.length; i++) {
      const c = identifier.charAt(i);
      const isAlpha = Ids.isAlpha(c);
      const isAlphaNum = isAlpha || Ids.isNumeric(c);
      if (i === 0) {
        if (c === "_") {
          result += "_";
        } else if (!isAlpha) {
          result += "_";
        } else {
          result += c;
        }
      } else {
        if (!isAlphaNum) {
          result += "_";
        } else {
          result += c;
        }
      }
    }
    return result;
  }

  private static isAlpha(c: string) {
    return Ids.isUpperAlpha(c) || Ids.isLowerAlpha(c);
  }
  private static isUpperAlpha(c: string) {
    return c >= "A" && c <= "Z";
  }
  private static isLowerAlpha(c: string) {
    return c >= "a" && c <= "z";
  }
  private static isNumeric(c: string) {
    return c >= "0" && c <= "9";
  }
}

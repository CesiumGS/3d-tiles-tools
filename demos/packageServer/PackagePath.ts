/**
 * A class representing a relative path inside a 3D Tiles package.
 *
 * This implements the path resolution mechanism for 3TZ files, according to
 * https://github.com/Maxar-Public/3d-tiles/tree/wff1.7.0/extensions/MAXAR_content_3tz/1.0.0#path-resolver-algorithm
 */
export class PackagePath {
  /**
   * The path of the container.
   *
   * This will usually just be the name of the containing 3TZ file
   */
  readonly containerPath: string;

  /**
   * The inner file path.
   *
   * This is the actual path (resolved against the container),
   * without a leading slash
   */
  readonly innerFilePath: string;

  /**
   * Creates a new instance from the given (relative) URL.
   *
   * @param urlPathname - The full URL path name
   */
  constructor(fullUrlPathname: string) {
    const urlPathname = fullUrlPathname.startsWith("/")
      ? fullUrlPathname.substring(1)
      : fullUrlPathname;
    const resolved3tzContainerPath =
      PackagePath.computeResolved3tzContainerPath(urlPathname);
    if (resolved3tzContainerPath) {
      this.containerPath = resolved3tzContainerPath;
      const resolvedInnerFilePath =
        PackagePath.computeResolvedInnerFilePath(urlPathname);
      if (resolvedInnerFilePath) {
        this.innerFilePath = resolvedInnerFilePath;
      } else {
        this.innerFilePath = urlPathname;
      }
    } else {
      this.containerPath = "";
      this.innerFilePath = urlPathname;
    }
  }

  /**
   * Creates the regular expression for matching 3TZ paths, as defined
   * in the 3TZ specification.
   *
   * @returns The RegEx
   */
  private static create3tzRegex(): RegExp {
    return new RegExp("(.+\\.3tz)[\\/]?(.*)", "gi");
  }

  /**
   * Computes the "resolved 3TZ container path", as defined in the
   * 3TZ specification
   *
   * @param urlPathname - The URL path name
   * @returns The resolved 3TZ container path
   */
  static computeResolved3tzContainerPath(
    urlPathname: string
  ): string | undefined {
    const regex = PackagePath.create3tzRegex();
    const matches = regex.exec(urlPathname) ?? [];
    if (matches.length < 2) {
      return undefined;
    }
    const resolved3tzContainerPath = matches[1];
    return resolved3tzContainerPath;
  }

  /**
   * Computes the "resolved inner file path", as defined in the
   * 3TZ specification
   *
   * @param urlPathname - The URL path name
   * @returns The resolved inner file path
   */
  private static computeResolvedInnerFilePath(
    urlPathname: string
  ): string | undefined {
    const regex = this.create3tzRegex();
    const matches = regex.exec(urlPathname) ?? [];
    if (matches.length < 2) {
      return undefined;
    }
    let resolvedInnerFilePath = "tileset.json";
    if (matches.length >= 2 && matches[2] !== "") {
      resolvedInnerFilePath = matches[2];
    }
    return resolvedInnerFilePath;
  }
}

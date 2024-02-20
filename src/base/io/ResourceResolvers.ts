import { FileResourceResolver } from "./FileResourceResolver";
import { ResourceResolver } from "./ResourceResolver";
import { UnzippingResourceResolver } from "./UnzippingResourceResolver";

/**
 * Methods to create `ResourceResolver` instances.
 *
 * @internal
 */
export class ResourceResolvers {
  /**
   * Creates a new `ResourceResolver` that resolves resources from
   * the file system, relative to the given directory.
   *
   * The returned instance will transparently unpack ZIPped data.
   *
   * @param directory - The base directory
   * @returns The `ResourceResolver`
   */
  static createFileResourceResolver(directory: string) {
    const delegate = new FileResourceResolver(directory);
    return ResourceResolvers.wrapUnzipping(delegate);
  }

  /**
   * Wraps the given `ResourceResolver` into one that unzips the data
   * from the given delegate, if that that is ZIPped.
   *
   * @param resourceResolver - The delegate
   * @returns The unzipping `ResourceResolver`
   */
  private static wrapUnzipping(resourceResolver: ResourceResolver) {
    return new UnzippingResourceResolver(resourceResolver);
  }
}

import { Tileset } from "3d-tiles-tools";
import { Tile } from "3d-tiles-tools";
import { Content } from "3d-tiles-tools";
import { Buffers } from "3d-tiles-tools";

import { PackageServer } from "./PackageServer";
import { PackagePath } from "./PackagePath";

import { Loggers } from "3d-tiles-tools";
const logger = Loggers.get("packageServerTest");

/**
 * A very simple test client for a PackageServer.
 *
 * It offers a "process" function that is called with "tileset.json",
 * will process all EXPLICIT tiles of that tileset and their content.
 * External tilesets are processed recursively. Eventually, it will
 * offer the set of resolved and unresolved path names that have been
 * encountered in the process. The list of unresolved path names
 * should be empty.
 */
export class PackageServerTestClient {
  /**
   * The actual PackageServer
   */
  private readonly packageServer: PackageServer;

  /**
   * The base URL that other URLs will be resolved against
   */
  private readonly baseUrl: URL;

  /**
   * The set of all path names that could be resolved
   */
  private readonly resolvedPathnames: Set<string>;

  /**
   * The set of all path names that could NOT be resolved
   */
  private readonly unresolvedPathnames: Set<string>;

  /**
   * Creates a new instance
   *
   * @param packageServer - The package server
   * @param baseUrl - The base URL
   */
  constructor(packageServer: PackageServer, baseUrl: URL) {
    this.packageServer = packageServer;
    this.baseUrl = baseUrl;
    this.resolvedPathnames = new Set<string>();
    this.unresolvedPathnames = new Set<string>();
  }

  /**
   * Returns all path names that could be resolved
   *
   * @returns - The path names
   */
  getResolvedPathnames(): Set<string> {
    return this.resolvedPathnames;
  }

  /**
   * Returns all path names that could not be resolved
   *
   * @returns - The path names
   */
  getUnresolvedPathnames(): Set<string> {
    return this.unresolvedPathnames;
  }

  /**
   * Process the given URI.
   *
   * Calling this with "tileset.json" is usually the entry point.
   *
   * @param uri - The URI
   */
  async process(uri: string) {
    const packageServer = this.packageServer;
    const baseUrl = this.baseUrl;

    const pathname = new URL(uri, baseUrl.href).pathname;
    const packagePath = new PackagePath(pathname);
    logger.info(`Client resolving content data for package path:`);
    logger.info(`  containerPath: '${packagePath.containerPath}'`);
    logger.info(`  innerFilePath: '${packagePath.innerFilePath}'`);
    const content = await packageServer.resolveContent(packagePath);
    if (content) {
      logger.info("Resolving URI " + uri + " DONE");
      this.resolvedPathnames.add(pathname);

      if (Buffers.isProbablyJson(content)) {
        const tileset = JSON.parse(content.toString()) as Tileset;
        const packagePrefix =
          packagePath.containerPath !== ""
            ? packagePath.containerPath + "/"
            : "";
        await this.traverseTileset(packagePrefix, tileset);
      }
    } else {
      logger.warn("Resolving URI " + uri + " FAILED");
      this.unresolvedPathnames.add(pathname);
    }
  }

  /**
   * Traverse the explicit tile hierarchy of the given tileset.
   *
   * The package prefix is the name of the 3TZ file that the
   * tileset JSON was found in, followed by a "/" slash.
   *
   * @param packagePrefix - The package prefix
   * @param tileset The tileset
   */
  private async traverseTileset(packagePrefix: string, tileset: Tileset) {
    await this.traverseTile(packagePrefix, tileset.root);
  }

  /**
   * Traverse the explicit tile hierarchy of the given tile.
   *
   * The package prefix is the name of the 3TZ file that the
   * tileset JSON was found in, followed by a "/" slash.
   *
   * @param packagePrefix - The package prefix
   * @param tileset The tileset
   */
  private async traverseTile(packagePrefix: string, tile: Tile) {
    if (tile.content) {
      await this.traverseContent(packagePrefix, tile.content);
    }
    if (tile.contents) {
      for (const content of tile.contents) {
        await this.traverseContent(packagePrefix, content);
      }
    }
    if (tile.children) {
      for (const child of tile.children) {
        await this.traverseTile(packagePrefix, child);
      }
    }
  }

  /**
   * Traverse the given content, calling 'process' with the
   * URI of that content.
   *
   * The package prefix is the name of the 3TZ file that the
   * tileset JSON was found in, followed by a "/" slash.
   *
   * @param packagePrefix - The package prefix
   * @param tileset The tileset
   */
  private async traverseContent(packagePrefix: string, content: Content) {
    const uri = content.uri;
    let actualUrl = packagePrefix + uri;
    if (uri.match(/(\.3tz)/i)) {
      actualUrl = packagePrefix + "../" + uri;
    }
    await this.process(actualUrl);
  }
}

import path from "path";
import http, { Server } from "http";

import { Buffers } from "3d-tiles-tools";
import { BufferedContentData } from "3d-tiles-tools";
import { Extensions } from "3d-tiles-tools";
import { Tile } from "3d-tiles-tools";
import { Tileset } from "3d-tiles-tools";

import { TilesetSource } from "3d-tiles-tools";
import { TilesetSources } from "3d-tiles-tools";

import { ContentDataTypes } from "3d-tiles-tools";
import { ContentDataTypeRegistry } from "3d-tiles-tools";

import { PackageServerOptions } from "./PackageServerOptions";
import { PackagePath } from "./PackagePath";
import { ContentDataTypeUtilities } from "./ContentDataTypeUtilities";

import { Loggers } from "3d-tiles-tools";
const logger = Loggers.get("packageServer");

export class PackageServer {
  /**
   * The base directory from which the server is serving.
   *
   * This is used for resolving the content from the
   * root tileset source (if it was a tileset JSON file)
   */
  private readonly baseDirectory: string;

  /**
   * The tileset sources that the server is serving from.
   *
   * The key of each entry is the name of the tileset source
   * relative to the base directory. The key for the "root"
   * tileset source is `""` (the empty string).
   *
   * For example, when a tileset refers to `data/external.3tz`,
   * then the entry with the key `data/external.3tz` will
   * contain the data of the external 3TZ package.
   *
   * A key will be mapped to `undefined` if the respective
   * source could not be opened.
   */
  private readonly tilesetSources: Map<string, TilesetSource | undefined>;

  /**
   * The actual HTTP server
   */
  private readonly server: Server;

  /**
   * Creates a new instance
   *
   * @param baseDirectory - The base directory
   */
  constructor(baseDirectory: string) {
    this.baseDirectory = baseDirectory;
    this.tilesetSources = new Map<string, TilesetSource | undefined>();
    this.server = http.createServer((req, res) => this.handleRequest(req, res));
  }

  /**
   * Start the server based on the given options
   *
   * @param options The options
   */
  async start(options: PackageServerOptions) {
    const hostName = options.hostName;
    const port = options.port;
    const sourceName = options.sourceName;

    const tilesetSource = await TilesetSources.createAndOpen(sourceName);
    if (!tilesetSource) {
      logger.error("Could not create source for " + sourceName);
      return;
    }
    this.tilesetSources.set("", tilesetSource);
    await new Promise<void>((resolve) => {
      this.server.listen(port, hostName, () => {
        logger.info(`Server running at http://${hostName}:${port}/`);
        resolve();
      });
    });
  }

  /**
   * Stop the server by closing all connections, waiting for the server
   * to shut down, and closing all tileset sources.
   */
  async stop() {
    logger.info(`Server stopping...`);
    this.server.closeAllConnections();
    await new Promise<void>((resolve, reject) => {
      this.server.close((error) => {
        if (error) {
          reject(error);
        }
        resolve();
      });
    });
    for (const tilesetSource of this.tilesetSources.values()) {
      if (tilesetSource) {
        await tilesetSource.close();
      }
    }
    logger.info(`Server stopped`);
  }

  /**
   * Set overly permissive CORS header options for local tests
   *
   * @param res - The server response
   */
  private static setCorsHeader(res: http.ServerResponse<http.IncomingMessage>) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Request-Method", "*");
    res.setHeader("Access-Control-Allow-Methods", "OPTIONS, GET");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
  }

  /**
   * The request handler for the node http server
   *
   * @param req The request
   * @param res The response
   */
  private async handleRequest(
    req: http.IncomingMessage,
    res: http.ServerResponse<http.IncomingMessage>
  ): Promise<void> {
    // Basic sanity checks
    if (!req.url) {
      logger.warn("Return 404 for undefined URL");
      res.statusCode = 404;
      res.end();
      return;
    }
    PackageServer.setCorsHeader(res);

    // Trivial handling of OPTIONS requests
    if (req.method === "OPTIONS") {
      res.setHeader("Allow", "OPTIONS, GET");
      res.writeHead(204);
      res.end();
      return;
    }

    // Find the path name for the request, and create the response.
    const url = new URL(`http://${req.headers.host}${req.url}`);
    await this.handleResponseForUrlPathname(res, url.pathname);
  }

  /**
   * Handle the response for the given URL pathname.
   *
   * This will try to look up the data that is identified with the
   * given path name, and send it out via the given response.
   *
   * If the given path name refers to a package (3TZ file), then
   * this package will be opened internally and used for serving
   * subsequent requests.
   *
   * @param res - The response
   * @param urlPathname - The URL pathname (without leading slash)
   */
  private async handleResponseForUrlPathname(
    res: http.ServerResponse<http.IncomingMessage>,
    urlPathname: string
  ): Promise<void> {
    logger.info(`Handle response for URL pathname ${urlPathname}`);

    const packagePath = new PackagePath(urlPathname);
    logger.debug(`PackagePath for '${urlPathname}':`);
    logger.debug(`  containerPath: '${packagePath.containerPath}'`);
    logger.debug(`  innerFilePath: '${packagePath.innerFilePath}'`);

    // Try to resolve the content data
    let content = await this.resolveContent(packagePath);
    if (!content) {
      logger.warn(`Return 404 for URL pathname ${urlPathname}`);
      res.statusCode = 404;
      res.end();
      return;
    }

    // Determine the type of the content data. If it is a tileset,
    // and it contains the MAXAR_content_3tz extension, then
    // update all its content URIs that involve 3TZ files.
    // See postProcessTilesetFor3tz for details.
    const contentFileName = packagePath.innerFilePath;
    const contentData = new BufferedContentData(contentFileName, content);
    const contentDataType = await ContentDataTypeRegistry.findContentDataType(
      contentData
    );
    if (contentDataType === ContentDataTypes.CONTENT_TYPE_TILESET) {
      const tilesetObject = await contentData.getParsedObject();
      const tileset = tilesetObject as Tileset;
      if (Extensions.usesExtension(tileset, "MAXAR_content_3tz")) {
        logger.info(`Post-processing tileset obtained for '${urlPathname}'`);
        const fromPackage = packagePath.containerPath !== "";
        PackageServer.postProcessTilesetFor3tz(fromPackage, tileset);
        content = Buffer.from(JSON.stringify(tileset, null, 2));
      }
    }

    // Prepare the headers for the response
    const mimeType =
      ContentDataTypeUtilities.getMimeType(contentDataType) ??
      "application/octet-stream";
    const headers: http.OutgoingHttpHeaders = {
      "Content-Type": mimeType,
      "Content-Length": content.length,
    };
    if (Buffers.isGzipped(content)) {
      headers["Content-Encoding"] = "gzip";
    }

    // Send out the actual response
    logger.info(`Handle response for URL pathname ${urlPathname} succeeded`);
    logger.debug(`  mimeType: ${mimeType}`);
    logger.debug(`  content.length: ${content.length}`);

    res.writeHead(200, headers);
    res.end(content);
    return;
  }

  /**
   * Post-process the given tileset object to handle the MAXAR_content_3tz
   * extension.
   *
   * See postProcessTileFor3tz for details.
   *
   * @param fromPackage Whether the content was read from a package
   * @param tileset - The tileset
   */
  private static postProcessTilesetFor3tz(
    fromPackage: boolean,
    tileset: Tileset
  ) {
    logger.warn(`Removing MAXAR_content_3tz extension usage declaration`);
    Extensions.removeExtensionUsed(tileset, "MAXAR_content_3tz");

    PackageServer.postProcessTileFor3tz(fromPackage, tileset.root);
  }

  /**
   * Post-process the given tile and all its children, recursively, to
   * handle the MAXAR_content_3tz extension.
   *
   * This will update all 'content.uri' strings as necessary to handle
   * 3TZ files. See expandContent3tzUri for details.
   *
   * @param fromPackage Whether the content was read from a package
   * @param tile - The tile
   */
  private static postProcessTileFor3tz(fromPackage: boolean, tile: Tile) {
    if (tile.content) {
      tile.content.uri = PackageServer.expandContent3tzUri(
        fromPackage,
        tile.content.uri
      );
    } else if (tile.contents) {
      for (const content of tile.contents) {
        content.uri = PackageServer.expandContent3tzUri(
          fromPackage,
          content.uri
        );
      }
    }
    if (tile.children) {
      for (const child of tile.children) {
        PackageServer.postProcessTileFor3tz(fromPackage, child);
      }
    }
  }

  /**
   * Expand the given URI, if it refers to a 3TZ file or an entry
   * of a 3TZ file.
   *
   * If the URI refers to a 3TZ file as an external tileset, then this will
   * return the full URI to that tileset, e.g. 'example.3tz/tileset.json'.
   *
   * If the given "fromPackage" flag is 'true', then the content is
   * considered to be read from a package, meaning that the URIs have
   * to be prefixed with a parent directory reference "../".
   *
   * @param fromPackage Whether the content was read from a package
   * @param uri - The content URI
   * @returns The updated content URI
   */
  private static expandContent3tzUri(
    fromPackage: boolean,
    uri: string
  ): string {
    const components = uri.split(/\//);
    const lastIndex = components.length - 1;
    const lastComponent = components[lastIndex];
    if (lastComponent.match(/.+\.3tz/i)) {
      components.push("tileset.json");
    }
    const result = components.join("/");
    const finalResult = (fromPackage ? "../" : "") + result;
    logger.debug(`Expand content URI '${uri}' to '${finalResult}'`);
    return finalResult;
  }

  /**
   * Resolve the content for the given package path.
   *
   * @param packagePath - The package path
   * @returns - The content data
   */
  async resolveContent(packagePath: PackagePath): Promise<Buffer | undefined> {
    logger.debug(`Resolving content data for package path:`);
    logger.debug(`  containerPath: '${packagePath.containerPath}'`);
    logger.debug(`  innerFilePath: '${packagePath.innerFilePath}'`);

    const tilesetSourceKey = packagePath.containerPath;
    const relativePath = packagePath.innerFilePath;

    const tilesetSource = await this.resolveTilesetSource(tilesetSourceKey);
    if (!tilesetSource) {
      logger.error(`Could not resolve tileset source '${tilesetSourceKey}'`);
      return undefined;
    }

    const content = await tilesetSource.getValue(relativePath);
    if (content) {
      logger.info(
        `Resolving content data for '${relativePath}' in ` +
          `tileset source '${tilesetSourceKey}' succeeded`
      );
    } else {
      logger.warn(
        `Resolving content data for '${relativePath}' in ` +
          `tileset source '${tilesetSourceKey}' failed`
      );
    }
    return content;
  }

  /**
   * Tries to resolve the specified tileset source.
   *
   * The given key is essentially the name of a 3TZ file. If the respective
   * tileset source has already been resolved, it will be returned.
   *
   * Otherwise, this will resolve this name against the base directory,
   * and create, open and return the respective tileset source.
   *
   * If the tileset source cannot be opened, then undefined is returned.
   *
   * @param tilesetSourceKey - The tileset source key
   * @returns The tileset source, or undefined
   */
  private async resolveTilesetSource(
    tilesetSourceKey: string
  ): Promise<TilesetSource | undefined> {
    logger.debug(`Resolving tileset source for '${tilesetSourceKey}'`);

    if (!this.tilesetSources.has(tilesetSourceKey)) {
      const tilesetSourceName = path.resolve(
        this.baseDirectory,
        tilesetSourceKey
      );
      try {
        const tilesetSource = await TilesetSources.createAndOpen(
          tilesetSourceName
        );
        this.tilesetSources.set(tilesetSourceKey, tilesetSource);
        logger.info(
          `Resolving tileset source for '${tilesetSourceKey}': ` +
            `Tileset source was created and opened`
        );
      } catch (error) {
        logger.error(
          `Resolving tileset source for '${tilesetSourceKey}' with full ` +
            `source name ${tilesetSourceName} failed`,
          error
        );
        this.tilesetSources.set(tilesetSourceKey, undefined);
      }
    }
    const tilesetSource = this.tilesetSources.get(tilesetSourceKey);
    logger.debug(
      `Resolving tileset source for '${tilesetSourceKey}' ` +
        (tilesetSource ? "succeeded" : "failed")
    );
    return tilesetSource;
  }
}

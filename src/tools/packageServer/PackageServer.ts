import path from "path";
import http, { Server } from "http";

import { ContentDataTypes } from "../../base";
import { ContentDataTypeRegistry } from "../../base";
import { BufferedContentData } from "../../base";
import { Buffers } from "../../base";

import { TilesetSource } from "../../tilesets";
import { TilesetSources } from "../../tilesets";
import { Extensions } from "../../tilesets";

import { Tileset } from "../../structure";
import { Tile } from "../../structure";

import { PackageServerOptions } from "./PackageServerOptions";
import { PackagePath } from "./PackagePath";
import { ContentDataTypeUtilities } from "./ContentDataTypeUtilities";

import { Loggers } from "../../base";
const logger = Loggers.get("packageServer");

/**
 * Implementation of an HTTP server that can serve tilesets.
 *
 * This server is handling tilesets that care contained in packages
 * (like 3TZ files), as well as tilesets that refer to resources
 * that are contained in 3TZ files using the `MAXAR_content_3tz`
 * extension.
 *
 * The handling of these tilesets aims at serving them transparently
 * for the client. This includes modifications of the served
 * tileset JSON, to remove the `MAXAR_content_3tz` extension usage
 * declaration, and to update content URIs that refer to 3TZ files,
 * so that they refer to the respective tileset JSON files instead.
 *
 * @internal
 */
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
   * Whether "Access-Control-Allow-Origin" should be set
   */
  private readonly cors: boolean;

  /**
   * Development mode, which disables caching and prints
   * additional logging information
   */
  private readonly developmentMode: boolean;

  /**
   * A log level for logging more detailed information
   */
  private logInfoLevel: string;

  /**
   * A log level for logging even more detailed information
   */
  private readonly logDebugLevel = "debug";

  /**
   * Creates a new instance
   *
   * @param baseDirectory - The base directory
   * @param cors - Whether CORS should be enabled
   * @param developmentMode - Disable caching and print additional logging
   */
  constructor(baseDirectory: string, cors: boolean, developmentMode: boolean) {
    this.baseDirectory = baseDirectory;
    this.cors = cors;
    this.developmentMode = developmentMode;
    if (developmentMode) {
      this.logInfoLevel = "info";
    } else {
      this.logInfoLevel = "debug";
    }
    this.tilesetSources = new Map<string, TilesetSource | undefined>();
    this.server = http.createServer((req, res) => this.handleRequest(req, res));
  }

  /**
   * Start the server based on the given options.
   *
   * @param options - The options
   */
  async start(options: PackageServerOptions) {
    const host = options.host;
    const port = options.port;
    const sourceName = options.sourceName;

    const tilesetSource = await TilesetSources.createAndOpen(sourceName);
    if (!tilesetSource) {
      logger.error("Could not create source for " + sourceName);
      return;
    }
    this.tilesetSources.set("", tilesetSource);
    await new Promise<void>((resolve) => {
      this.server.listen(port, host, () => {
        logger.info(`Server running at http://${host}:${port}/`);
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
   * The request handler for the node http server
   *
   * @param req - The request
   * @param res - The response
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

    if (this.cors) {
      res.setHeader("Access-Control-Allow-Origin", "*");
    }

    if (this.developmentMode) {
      res.setHeader("Cache-Control", "no-store");
    } else {
      res.setHeader("Cache-Control", "public, max-age=86400");
    }

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
   * Print the given output to the logger, using the 'logInfoLevel',
   * because why should a logger offer the option to pass in the
   * desired log level, right?
   *
   * @param output - The output
   */
  private logInfo(output: any) {
    if (logger[this.logInfoLevel] === undefined) {
      logger.error(`Invalid log level: ${this.logInfoLevel}`);
    } else {
      logger[this.logInfoLevel](output);
    }
  }

  /**
   * Print the given output to the logger, using the 'logDebugLevel'
   *
   * @param output - The output
   */
  private logDebug(output: any) {
    if (logger[this.logDebugLevel] === undefined) {
      logger.error(`Invalid log level: ${this.logDebugLevel}`);
    } else {
      logger[this.logDebugLevel](output);
    }
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
    this.logInfo(`Handle response for URL pathname '${urlPathname}'`);

    const packagePath = new PackagePath(urlPathname);
    this.logDebug(`PackagePath for '${urlPathname}':`);
    this.logDebug(`  containerPath: '${packagePath.containerPath}'`);
    this.logDebug(`  innerFilePath: '${packagePath.innerFilePath}'`);

    // Try to resolve the content data
    let content = await this.resolveContent(packagePath);
    if (!content) {
      logger.warn(`Return 404 for URL pathname '${urlPathname}'`);
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
      this.logInfo(`Post-processing tileset obtained for '${urlPathname}'`);

      const tilesetObject = await contentData.getParsedObject();
      const tileset = tilesetObject as Tileset;
      if (Extensions.usesExtension(tileset, "MAXAR_content_3tz")) {
        logger.warn(`Removing MAXAR_content_3tz extension usage declaration`);
        Extensions.removeExtensionUsed(tileset, "MAXAR_content_3tz");
      }

      // When the top-level request was to "example.3tz", then this
      // will implicitly refer to "example.3tz/tileset.json"
      // (in contrast to the case where the top-level request
      // explicitly went to "example.3tz/tileset.json")
      // So only when the top-level request was to a 3TZ file,
      // the name of the 3TZ file has to be added as a prefix to
      // the URLs, turing "content.glb" into "example.3tz/content.glb"
      let packagePrefix = "";
      if (
        urlPathname.toLowerCase().endsWith(".3tz") &&
        packagePath.containerPath !== ""
      ) {
        const components = packagePath.containerPath.split(/\//);
        packagePrefix = components[components.length - 1] + "/";
      }

      PackageServer.postProcessTilesetFor3tz(packagePrefix, tileset);
      content = Buffer.from(JSON.stringify(tileset, null, 2));
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
    this.logInfo(`Handle response for URL pathname '${urlPathname}' succeeded`);
    this.logDebug(`  mimeType: ${mimeType}`);
    this.logDebug(`  content.length: ${content.length}`);

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
   * @param packagePrefix - The prefix for the URLs
   * @param tileset - The tileset
   */
  private static postProcessTilesetFor3tz(
    packagePrefix: string,
    tileset: Tileset
  ) {
    PackageServer.postProcessTileFor3tz(packagePrefix, tileset.root);
  }

  /**
   * Post-process the given tile and all its children, recursively, to
   * handle the MAXAR_content_3tz extension.
   *
   * This will update all 'content.uri' strings as necessary to handle
   * 3TZ files. See expandContent3tzUri for details.
   *
   * @param packagePrefix - The prefix for the URLs
   * @param tile - The tile
   */
  private static postProcessTileFor3tz(packagePrefix: string, tile: Tile) {
    if (tile.content) {
      tile.content.uri = PackageServer.expandContent3tzUri(
        packagePrefix,
        tile.content.uri
      );
    } else if (tile.contents) {
      for (const content of tile.contents) {
        content.uri = PackageServer.expandContent3tzUri(
          packagePrefix,
          content.uri
        );
      }
    }
    if (tile.children) {
      for (const child of tile.children) {
        PackageServer.postProcessTileFor3tz(packagePrefix, child);
      }
    }
  }

  /**
   * Expand the given URI, if it refers to a 3TZ file or an entry
   * of a 3TZ file.
   *
   * If the URI will be prefixed with the given string, unless it
   * refers to a 3TZ file or an entry of a 3TZ file.
   *
   * @param packagePrefix - The prefix for the URLs
   * @param uri - The content URI
   * @returns The updated content URI
   */
  private static expandContent3tzUri(
    packagePrefix: string,
    uri: string
  ): string {
    const uriLowercase = uri.toLowerCase();
    const is3tz =
      uriLowercase.endsWith(".3tz") || uriLowercase.includes(".3tz/");
    const finalUri = (is3tz ? "" : packagePrefix) + uri;
    //logger.info(`Expand content URI '${uri}' to '${finalUri}', is 3TZ? ` + is3tz);
    return finalUri;
  }

  /**
   * Resolve the content for the given package path.
   *
   * @param packagePath - The package path
   * @returns - The content data
   */
  async resolveContent(packagePath: PackagePath): Promise<Buffer | undefined> {
    this.logDebug(`Resolving content data for package path:`);
    this.logDebug(`  containerPath: '${packagePath.containerPath}'`);
    this.logDebug(`  innerFilePath: '${packagePath.innerFilePath}'`);

    const tilesetSourceKey = packagePath.containerPath;
    const relativePath = packagePath.innerFilePath;

    const tilesetSource = await this.resolveTilesetSource(tilesetSourceKey);
    if (!tilesetSource) {
      logger.error(`Could not resolve tileset source '${tilesetSourceKey}'`);
      return undefined;
    }

    const content = await tilesetSource.getValue(relativePath);
    if (content) {
      this.logInfo(
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
    this.logDebug(`Resolving tileset source for '${tilesetSourceKey}'`);

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
        this.logInfo(
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
    this.logDebug(
      `Resolving tileset source for '${tilesetSourceKey}' ` +
        (tilesetSource ? "succeeded" : "failed")
    );
    return tilesetSource;
  }
}

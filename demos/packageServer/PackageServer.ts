import path from "path";
import http from "http";

import { Buffers } from "../../src/base/Buffers";
import { Paths } from "../../src/base/Paths";

import { TilesetSource } from "../../src/tilesetData/TilesetSource";
import { TilesetSources } from "../../src/tilesetData/TilesetSources";

import { ContentDataTypes } from "../../src/contentTypes/ContentDataTypes";
import { ContentDataTypeRegistry } from "../../src/contentTypes/ContentDataTypeRegistry";

import { ContentDataTypeUtilities } from "./ContentDataTypeUtilities";

import { Loggers } from "../../src/logging/Loggers";
import { PackageServerOptions } from "./PackageServerOptions";

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
   */
  private tilesetSources: { [key: string]: TilesetSource } = {};

  /**
   * Creates a new instance
   *
   * @param baseDirectory - The base directory
   */
  constructor(baseDirectory: string) {
    this.baseDirectory = baseDirectory;
  }

  /**
   * Start the server based on the given options
   *
   * @param options The options
   */
  start(options: PackageServerOptions) {
    const hostName = options.hostName;
    const port = options.port;
    const sourceName = options.sourceName;

    const tilesetSource = TilesetSources.createAndOpen(sourceName);
    if (!tilesetSource) {
      logger.error("Could not create source for " + sourceName);
      return;
    }
    this.tilesetSources[""] = tilesetSource;

    const server = http.createServer((req, res) =>
      this.handleRequest(req, res)
    );
    server.listen(port, hostName, () => {
      logger.info(`Server running at http://${hostName}:${port}/`);
    });
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
    if (!req.url) {
      logger.warn("Return 404 for undefined URL");
      res.statusCode = 404;
      res.end();
      return;
    }

    PackageServer.setCorsHeader(res);
    if (req.method === "OPTIONS") {
      res.setHeader("Allow", "OPTIONS, GET");
      res.writeHead(204);
      res.end();
      return;
    }

    // TODO Anything to be done for HTTPS here?
    // (We only use the `pathname` anyhow, so probably not...)
    const url = new URL(`http://${req.headers.host}${req.url}`);
    //console.log("url ", url);
    await this.handleResponseForUrlPathname(res, url.pathname);
  }

  /**
   * Resolve the content data for the given key.
   *
   * The key is just the URL pathname, without a leading slash,
   * used for looking up entries in packages.
   *
   * This will try to look up the key in all known tileset sources,
   * and return the first content that is found for this key.
   *
   * @param key - The key
   * @returns - The content data
   */
  private resolveContentData(key: string): Buffer | undefined {
    logger.info(`Resolve content data for key ${key}`);

    for (const name of Object.keys(this.tilesetSources)) {
      const tilesetSource = this.tilesetSources[name];

      const dirName = path.dirname(name);
      const relatviveKey = Paths.relativize(dirName, key);

      logger.info(`  Looking up ${relatviveKey} in source "${name}"`);
      const content = tilesetSource.getValue(relatviveKey);
      if (content) {
        logger.info(
          `  Looking up ${relatviveKey} in source "${name}" succeeded`
        );
        return content;
      }
      logger.info(`  Looking up ${relatviveKey} in source "${name}" failed`);
    }

    logger.info(`Resolve content data for key ${key} FAILED!`);
    return undefined;
  }

  /**
   * Returns the data of the top-level tileset JSON from the package
   * that is identified with the given key.
   *
   * If the respective package has not been opened yet, then it
   * will be opened and stored as one of the `this.tilesetSources`.
   *
   * @param key - The key
   * @returns The tileset JSON data
   */
  private resolvePackageTilesetData(key: string): Buffer | undefined {
    logger.info(`Resolve tileset data for package key ${key}`);

    let tilesetSource = this.tilesetSources[key];
    if (!tilesetSource) {
      const fullSourceName = path.resolve(this.baseDirectory, key);
      try {
        tilesetSource = TilesetSources.createAndOpen(fullSourceName);
      } catch (error) {
        logger.error(
          `Could not open tileset source for key ${key} with full source name ${fullSourceName}`
        );
        return undefined;
      }
      this.tilesetSources[key] = tilesetSource;
    }
    const content = tilesetSource.getValue("tileset.json");
    if (content) {
      logger.info(`Resolve tileset data for package key ${key} succeeded`);
      return content;
    }
    logger.info(`Resolve tileset data for package key ${key} failed`);
    return undefined;
  }

  /**
   * Handle the response for the given URL pathname.
   *
   * This will try to look up the data that is identified with the
   * given path name, and send it out via the given response.
   *
   * If the given path name refers to a package (3TZ file), then
   * this package will be opened internally and used for serving
   * subsequent requests, with the first response being the
   * top-level "tileset.json" data from this package.
   *
   * @param res - The response
   * @param urlPathname - The URL pathname
   */
  private async handleResponseForUrlPathname(
    res: http.ServerResponse<http.IncomingMessage>,
    urlPathname: string
  ): Promise<void> {
    logger.info(`Handle response for URL pathname ${urlPathname}`);

    const key = urlPathname.startsWith("/")
      ? urlPathname.substring(1)
      : urlPathname;

    // Try to resolve the content data
    let content = this.resolveContentData(key);
    if (!content) {
      logger.info(`Return 404 for URL pathname ${urlPathname}`);
      res.statusCode = 404;
      res.end();
      return;
    }

    // If the content is a 3TZ package, then the content data
    // will be its top-level tileset JSON
    let contentDataType = await ContentDataTypeRegistry.findType(key, content);
    if (contentDataType === ContentDataTypes.CONTENT_TYPE_3TZ) {
      logger.info(`Found 3TZ content for key ${key}`);
      content = this.resolvePackageTilesetData(key);
      if (!content) {
        logger.info(`Return 404 for URL pathname ${urlPathname}`);
        res.statusCode = 404;
        res.end();
        return;
      }
      // Assuming that the "tileset.json" is actually a tileset JSON:
      contentDataType = ContentDataTypes.CONTENT_TYPE_TILESET;
    }

    // Prepare the headers for the response
    let mimeType = ContentDataTypeUtilities.getMimeType(contentDataType);
    if (mimeType === undefined) {
      mimeType = "application/octet-stream";
    }
    const headers: http.OutgoingHttpHeaders = {
      "Content-Type": mimeType,
      "Content-Length": content.length,
    };
    if (Buffers.isGzipped(content)) {
      headers["Content-Encoding"] = "gzip";
    }

    // Send out the actual resonse
    logger.info(`Handle response for URL pathname ${urlPathname} succeeded:`);
    logger.info(`  key: ${key}`);
    logger.info(`  mimeType: ${mimeType}`);
    logger.info(`  content.length: ${content.length}`);

    res.writeHead(200, headers);
    res.end(content);
    return;
  }
}

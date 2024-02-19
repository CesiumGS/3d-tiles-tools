import path from "path";
import http from "http";
import minimist from "minimist";

import { Buffers } from "3d-tiles-tools";

import { TilesetSource } from "3d-tiles-tools";
import { TilesetSources } from "3d-tiles-tools";

/**
 * Print the help message showing the command line options
 */
function printHelp() {
  const help =
    "Usage: PackageServer [OPTIONS]\n" +
    "  -n,  --hostName <name>     Host name. Default: '127.0.0.1' (localhost).\n" +
    "  -p,  --port <number>       Port number. Default: '8003'.\n" +
    "  -s,  --sourceName <name>   Package file or directory name.\n" +
    "  -h   --help                Print help. Not more than what you're currently seeing.\n";
  console.log(help);
}

/**
 * Parses the options from the command line arguments.
 *
 * If the 'help' should be printed, or the arguments cannot be parsed,
 * then the help is printed and `undefined` is returned.
 *
 * @param {minimist.ParsedArgs} args The arguments
 * @returns The options
 */
function parseOptions(args: any) {
  if (args.h !== undefined || args.help !== undefined) {
    printHelp();
    return undefined;
  }

  const hostName = args.n ?? args.hostName ?? "127.0.0.1";
  const port = args.p ?? args.port ?? "8003";
  const sourceName = args.s ?? args.sourceName;

  if (sourceName === undefined) {
    console.log("No source name was given");
    printHelp();
    return undefined;
  }

  const options = {
    hostName: hostName,
    port: port,
    sourceName: sourceName,
  };
  return options;
}

/**
  // TODO Use https://www.npmjs.com/package/mime-types ...?
  // File extensions are not required by the spec.
  // Should examine the content here...
 * 
 * @param {String} fileName 
 * @param {Buffer} content 
 * @returns The MIME type
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function determineMimeType(fileName: string, content: Buffer | undefined) {
  const extension = path.extname(fileName);
  if (extension === ".json") {
    return "application/json";
  }
  if (extension === ".gltf") {
    return "model/gltf+json";
  }
  if (extension === ".glb") {
    return "model/gltf-binary";
  }
  if (extension === ".png") {
    return "image/png";
  }
  if (extension === ".jpg" || extension === ".jpeg") {
    return "image/jpeg";
  }
  return "application/octet-stream";
}

/**
 * The request handler for the node http server
 *
 * @param tilesetSource The tileset source
 * @param req The request
 * @param res The response
 */
function handleRequest(
  tilesetSource: TilesetSource,
  req: http.IncomingMessage,
  res: http.ServerResponse<http.IncomingMessage>
) {
  // Do that CORS thingy (TODO: Document that!)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Request-Method", "*");
  res.setHeader("Access-Control-Allow-Methods", "OPTIONS, GET");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = req.url;
  if (!url) {
    console.log("Return 404 for undefined URL");
    res.statusCode = 404;
    res.end();
    return;
  }

  // TODO Proper query parameter handling...
  let path = url.startsWith("/") ? url.substring(1) : url;
  const nameEnd = path.indexOf("?");
  if (nameEnd != -1) {
    path = path.substring(0, nameEnd);
  }
  const content = tilesetSource.getValue(path);

  //console.log("Content for " + path + " is " + content?.length);

  if (!content) {
    console.log("Return 404 for " + path);
    res.statusCode = 404;
    res.end();
    return;
  }

  const mimeType = determineMimeType(path, content);
  const headers: any = {
    "Content-Type": mimeType,
    "Content-Length": content.length,
  };
  if (Buffers.isGzipped(content)) {
    headers["Content-Encoding"] = "gzip";
  }
  res.writeHead(200, headers);
  res.end(content);
  return;
}

/**
 * Start the server based on the given options that have been
 * parsed from the command line
 *
 * @param options The options
 */
function startServer(options: any) {
  const hostName = options.hostName;
  const port = options.port;
  const sourceName = options.sourceName;

  const extension = path.extname(sourceName);
  const tilesetSource = TilesetSources.create(extension);
  if (!tilesetSource) {
    console.log("Could not create source for " + sourceName);
    return;
  }
  tilesetSource.open(sourceName);
  const server = http.createServer((req, res) =>
    handleRequest(tilesetSource, req, res)
  );
  server.listen(port, hostName, () => {
    console.log(`Server running at http://${hostName}:${port}/`);
  });
}

/**
 * Run the tileset-source-server
 */
async function run() {
  const parsedArguments = minimist(process.argv.slice(2));
  const options = parseOptions(parsedArguments);
  if (options === undefined) {
    return;
  }
  startServer(options);
}

run();

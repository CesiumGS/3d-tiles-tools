import path from "path";
import minimist from "minimist";

import { Paths } from "../../src/base/Paths";
import { defined } from "../../src/base/defined";
import { defaultValue } from "../../src/base/defaultValue";

import { PackageServer } from "./PackageServer";

import { Loggers } from "../../src/logging/Loggers";
import { PackageServerOptions } from "./PackageServerOptions";

const logger = Loggers.get("packageServer");

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
  if (defined(args.h) || defined(args.help)) {
    printHelp();
    return undefined;
  }

  const hostName = defaultValue(
    defaultValue(args.n, args.hostName),
    "127.0.0.1"
  );
  const port = defaultValue(defaultValue(args.p, args.port), "8003");
  let sourceName = "";
  sourceName = defaultValue(args.s, args.sourceName);

  if (!defined(sourceName)) {
    logger.warn("No source name was given");
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
 * Run the package server
 */
async function run() {
  const parsedArguments = minimist(process.argv.slice(2));
  const options = parseOptions(parsedArguments);
  if (!defined(options)) {
    return;
  }

  const sourceName = options.sourceName;
  let baseDirectory = sourceName;
  if (!Paths.isDirectory(sourceName)) {
    baseDirectory = path.dirname(sourceName);
  }

  const packageServer = new PackageServer(baseDirectory);
  const serverOptions: PackageServerOptions = {
    hostName: options.hostName,
    port: options.port,
    sourceName: options.sourceName,
  };
  packageServer.start(serverOptions);
}

run();

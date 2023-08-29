import { defined } from "../src/base/defined";
import { defaultValue } from "../src/base/defaultValue";

import path from "path";
import minimist from "minimist";

import { TilesetTargets } from "../src/tilesetData/TilesetTargets";
import { TilesetSources } from "../src/tilesetData/TilesetSources";

import { ZipToPackage } from "../src/packages/ZipToPackage";

/**
 * Print the help message showing the command line options
 */
function printHelp() {
  const help =
    "Usage: PackageConversion [OPTIONS]\n" +
    "  -i,  --input <name>    Input directory or file name.\n" +
    "  -o,  --output <name>   Output directory or file name.\n" +
    "  -f   --force           Pay respects and overwrite output files if they exist.\n" +
    "  -h   --help            Print help. Not more than what you're currently seeing.\n";
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

  const input = defaultValue(args.i, args.input);
  const output = defaultValue(args.o, args.output);
  const force = defined(args.f) || defined(args.force);

  if (!defined(input)) {
    printHelp();
    return undefined;
  }

  if (!defined(output)) {
    printHelp();
    return undefined;
  }

  const options = {
    input: input,
    output: output,
    force: force,
  };
  return options;
}

/**
 * Performs a tileset package conversion based on the given command line
 * options. See the implementation of `parseOptions` for details.
 *
 * @param options The parsed command line options
 */
async function tilesetPackageConversion(options: any) {
  const input = options.input;
  const output = options.output;
  const overwrite = options.force;

  const inputExtension = path.extname(input).toLowerCase();
  const inputTilesetJsonFileName = path.basename(input);
  if (inputExtension === ".zip") {
    await ZipToPackage.convert(
      input,
      inputTilesetJsonFileName,
      output,
      overwrite
    );
  } else {
    const tilesetSource = TilesetSources.createAndOpen(input);
    const tilesetTarget = TilesetTargets.createAndBegin(output, overwrite);

    const keys = tilesetSource.getKeys();
    for (const key of keys) {
      const content = tilesetSource.getValue(key);
      // TODO Compression or decompression could happen here...
      if (content) {
        tilesetTarget.addEntry(key, content);
      }
    }

    tilesetSource.close();
    await tilesetTarget.end();
  }
}

/**
 * Runs the tileset package conversion
 */
async function run() {
  const parsedArguments = minimist(process.argv.slice(2));
  const options = parseOptions(parsedArguments);
  if (!defined(options)) {
    return;
  }
  tilesetPackageConversion(options);
}

run();

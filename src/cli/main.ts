import yargs from "yargs/yargs";
import { DeveloperError } from "../base";

import { ToolsMain } from "./ToolsMain";

import { Loggers } from "../base";
let logger = Loggers.get("CLI");

// Split the arguments that are intended for the tools
// and the `--options` arguments. Everything behind
// the `--options` will be passed to downstream
// calls (e.g. calls to `gltf-pipeline`)
const optionsIndex = process.argv.indexOf("--options");
let toolArgs;
let optionArgs: string[];
if (optionsIndex < 0) {
  toolArgs = process.argv.slice(2);
  optionArgs = [];
} else {
  toolArgs = process.argv.slice(2, optionsIndex);
  optionArgs = process.argv.slice(optionsIndex + 1);
}

// The definition of the 'input' option that is used for
// all commands that only accept a single input, to be
// passed to the yargs 'command' definitions.
const inputStringDefinition: any = {
  alias: "input",
  description: "Input path for the command.",
  global: true,
  normalize: true,
  // Yes, this should be "string". But yargs crashes when the
  // the program is started with "npx ts-node" and an option
  // is defined to be "string" but given multiple times.
  type: "array",
  demandOption: true,
};

// The definition of the 'input' option that is used for
// all commands that only multiple inputs, to be
// passed to the yargs 'command' definitions.
const inputArrayDefinition: any = {
  alias: "input",
  description:
    "Input paths for the command. The option can be repeated to define multiple input paths.",
  global: true,
  normalize: true,
  type: "array",
  demandOption: true,
};

const outputStringDefinition: any = {
  alias: "output",
  description: "Output path for the command.",
  global: true,
  normalize: true,
  type: "string",
  demandOption: true,
};

/**
 * Parses the arguments that are intended for the actual 3D Tiles tools
 * (ignoring the option arguments), and returns the result.
 *
 * @param a - The arguments
 * @returns The parsed arguments object
 */
function parseToolArgs(a: string[]) {
  const args = yargs(a)
    .usage("Usage: 3d-tiles-tools <command> [options]")
    .scriptName("") // Only print the commands (not the script name)
    .help("h")
    .alias("h", "help")
    .options({
      f: {
        alias: "force",
        default: false,
        description: "Output can be overwritten if it already exists.",
        global: true,
        type: "boolean",
      },
      logLevel: {
        default: "info",
        description:
          "The log level. Valid values are 'trace', 'debug', 'info', " +
          "'warn', 'error', 'fatal', and 'silent'",
        global: true,
        type: "string",
      },
      logJson: {
        default: false,
        description:
          "Whether log messages should be printed as JSON instead of pretty-printing",
        global: true,
        type: "boolean",
      },
    })
    .command(
      "convert",
      "Convert between tilesets and tileset package formats.\n" +
        "The input and output can be one of the following:\n" +
        "- The path of a tileset JSON file\n" +
        "- The path of a directory that contains a 'tileset.json' file\n" +
        "- The path of a '.3tz' file\n" +
        "- The path of a '.3dtiles' file\n" +
        "\n" +
        "The input can also be the path of a ZIP file that contains the " +
        "tileset data. The tileset JSON file in this ZIP is determined " +
        "by the 'inputTilesetJsonFileName', which is 'tileset.json' by " +
        "default.",
      {
        i: inputStringDefinition,
        o: outputStringDefinition,
        inputTilesetJsonFileName: {
          description:
            "The name of the tileset JSON file in the input. " +
            "This is only required when the input is a ZIP file that " +
            "contains a tileset JSON file that is not called 'tileset.json'.",
          default: "tileset.json",
          global: true,
          normalize: true,
          type: "string",
        },
      }
    )
    .command(
      "glbToB3dm",
      "Repackage the input glb as a b3dm with a basic header.",
      { i: inputStringDefinition, o: outputStringDefinition }
    )
    .command(
      "glbToI3dm",
      "Repackage the input glb as a i3dm with a basic header.",
      { i: inputStringDefinition, o: outputStringDefinition }
    )
    .command(
      "b3dmToGlb",
      "Extract the binary glTF asset from the input b3dm.",
      {
        i: inputStringDefinition,
        o: outputStringDefinition,
      }
    )
    .command(
      "i3dmToGlb",
      "Extract the binary glTF asset from the input i3dm.",
      {
        i: inputStringDefinition,
        o: outputStringDefinition,
      }
    )
    .command(
      "cmptToGlb",
      "Extract the binary glTF assets from the input cmpt.",
      {
        i: inputStringDefinition,
        o: outputStringDefinition,
      }
    )
    .command(
      "splitCmpt",
      "Split the input cmpt and write out its inner tiles.",
      {
        i: inputStringDefinition,
        o: outputStringDefinition,
        recursive: {
          default: false,
          description: "Recursively apply the command to inner CMPT tiles",
          global: true,
          type: "boolean",
        },
      }
    )
    .command(
      "convertB3dmToGlb",
      "Convert a b3dm file into a glTF asset that uses glTF extensions to " +
        "represent the batch- and feature table information",
      {
        i: inputStringDefinition,
        o: outputStringDefinition,
      }
    )
    .command(
      "convertPntsToGlb",
      "Convert a pnts file into a glTF asset that uses glTF extensions to " +
        "represent the point properties and batch- and feature table information",
      {
        i: inputStringDefinition,
        o: outputStringDefinition,
      }
    )
    .command(
      "convertI3dmToGlb",
      "Convert an i3dm file into a glTF asset that uses glTF extensions to " +
        "represent the batch- and feature table information. This conversion " +
        "may be lossy if the GLB of the input i3dm contains animations.",
      {
        i: inputStringDefinition,
        o: outputStringDefinition,
      }
    )
    .command(
      "optimizeB3dm",
      "Pass the input b3dm through gltf-pipeline. To pass options to gltf-pipeline, " +
        "place them after --options. (--options -h for gltf-pipeline help)",
      {
        i: inputStringDefinition,
        o: outputStringDefinition,
        options: {
          description:
            "All arguments after this flag will be passed to gltf-pipeline as command line options.",
        },
      }
    )
    .command(
      "optimizeI3dm",
      "Pass the input i3dm through gltf-pipeline. To pass options to gltf-pipeline, " +
        "place them after --options. (--options -h for gltf-pipeline help)",
      {
        i: inputStringDefinition,
        o: outputStringDefinition,
        options: {
          description:
            "All arguments after this flag will be passed to gltf-pipeline as command line options.",
        },
      }
    )
    .command("gzip", "Gzips the input tileset directory.", {
      i: inputStringDefinition,
      o: outputStringDefinition,
      t: {
        alias: "tilesOnly",
        default: false,
        description: "Only tile content files should be gzipped.",
        type: "boolean",
      },
    })
    .command("ungzip", "Ungzips the input tileset directory.", {
      i: inputStringDefinition,
      o: outputStringDefinition,
    })
    .command(
      "combine",
      "Combines all external tilesets into a single tileset.json file.",
      { i: inputStringDefinition, o: outputStringDefinition }
    )
    .command(
      "merge",
      "Merge any number of tilesets together into a single tileset.",
      { i: inputArrayDefinition, o: outputStringDefinition }
    )
    .command(
      "upgrade",
      "Upgrades legacy tilesets to comply to the 3D Tiles specification.\n\n" +
        "By default, this will upgrade legacy tilesets to comply to 3D Tiles 1.0. " +
        "These upgrades include:\n" +
        "- The asset version will be set to '1.0'\n" +
        "- Content that uses a 'url' will be upgraded to use 'uri'.\n" +
        "- The 'refine' value will be converted to be in all-uppercase.\n" +
        "- glTF 1.0 models in B3DM or I3DM will be upgraded to glTF 2.0.\n" +
        "\n" +
        "When specifying '--targetVersion 1.1', then the upgrades will include:\n" +
        "- The asset version will be set to '1.1'\n" +
        "- Content that uses a 'url' will be upgraded to use 'uri'.\n" +
        "- The 'refine' value will be converted to be in all-uppercase.\n" +
        "- The '3DTILES_content_gltf' extension declaration will be removed.\n" +
        "- PNTS, B3DM, and I3DM content will be converted to glTF.\n" +
        "\n",
      {
        i: inputStringDefinition,
        o: outputStringDefinition,
        targetVersion: {
          default: "1.0",
          description: "The target version for the upgrade",
          type: "string",
        },
      }
    )
    .command("pipeline", "Execute a pipeline that is provided as a JSON file", {
      i: inputStringDefinition,
    })
    .command(
      "analyze",
      "Analyze the input file, and write the results to the output directory. " +
        "This will accept B3DM, I3DM, PNTS, CMPT, and GLB files (both for glTF " +
        "1.0 and for glTF 2.0), and write files into the output directory that " +
        "contain the feature table, batch table, layout information, the GLB, " +
        "and the JSON of the GLB",
      { i: inputStringDefinition, o: outputStringDefinition }
    )
    .command(
      "tilesetToDatabase",
      "Create a sqlite database for a tileset. (Deprecated - use 'convert' instead)",
      {
        i: inputStringDefinition,
        o: outputStringDefinition,
      }
    )
    .command(
      "databaseToTileset",
      "Unpack a tileset database to a tileset folder. (Deprecated - use 'convert' instead)",
      { i: inputStringDefinition, o: outputStringDefinition }
    )
    .command(
      "createTilesetJson",
      "Creates a tileset JSON file that just refers to given tile content files. " +
        "If the input is a single file, then this will result in a single (root) tile with " +
        "the input file as its tile content. If the input is a directory, then all content " +
        "files in this directory will be used as tile content, recursively. The exact set " +
        "of file types that are considered to be 'tile content' is not specified, but it " +
        "will include GLB, B3DM, PNTS, I3DM, and CMPT files.",
      {
        i: inputStringDefinition,
        o: outputStringDefinition,
        cartographicPositionDegrees: {
          description:
            "An array of either two or three values, which are the (longitude, latitude) " +
            "or (longitude, latitude, height) of the target position. The longitude and " +
            "latitude are given in degrees, and the height is given in meters.",
          type: "array",
        },
      }
    )
    .demandCommand(1)
    .strict();

  const result = args.argv as any;
  return result;
}

/**
 * Parses the arguments that have been given after the `--options`,
 * and returns the parsed arguments.
 *
 * This includes special handling of `draco` options for passing
 * them to the `gltf-pipeline`.
 *
 * @param a - The option arguments
 * @returns The parsed arguments object
 */
function parseOptionArgs(a: string[]) {
  const args = yargs(a);
  const v = args.argv as any;
  delete v["_"];
  delete v["$0"];
  if (v.draco) {
    v.dracoOptions = v.draco;
  }
  return v;
}

/**
 * Ensures that the given value is an array of numbers with the given
 * length constraints.
 *
 * If the given value is `undefined`, then no check will be performed
 * and `undefined` is returned.
 *
 * Otherwise, this function will check the given constraints, and
 * throw a `DeveloperError` if they are not met.
 *
 * @param value - The value
 * @param minLength - The minimum length
 * @param maxLength - The maximum length
 * @returns The validated value
 * @throws DeveloperError If the given value does not meet the given
 * constraints.
 */
function validateOptionalNumberArray(
  value: any,
  minLength: number | undefined,
  maxLength: number | undefined
): number[] | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!Array.isArray(value)) {
    throw new DeveloperError(`Expected an array, but received ${value}`);
  }
  if (minLength !== undefined) {
    if (value.length < minLength) {
      throw new DeveloperError(
        `Expected an array of at least length ${minLength}, ` +
          `but received an array of length ${value.length}: ${value}`
      );
    }
  }
  if (maxLength !== undefined) {
    if (value.length > maxLength) {
      throw new DeveloperError(
        `Expected an array of at most length ${maxLength}, ` +
          `but received an array of length ${value.length}: ${value}`
      );
    }
  }
  for (let i = 0; i < value.length; i++) {
    const element = value[i];
    const type = typeof element;
    if (type !== "number") {
      throw new DeveloperError(
        `Expected an array of numbers, but element at index ${i} ` +
          `has type '${type}': ${element}`
      );
    }
  }
  return value;
}

const parsedToolArgs = parseToolArgs(toolArgs);

async function run() {
  if (!parsedToolArgs) {
    return;
  }

  const logJson = parsedToolArgs.logJson;
  if (logJson === true) {
    const prettyPrint = false;
    Loggers.initDefaultLogger(prettyPrint);
    logger = Loggers.get("CLI");
  }

  const logLevel = parsedToolArgs.logLevel;
  if (logLevel !== undefined) {
    const validLogLevels = [
      "trace",
      "debug",
      "info",
      "warn",
      "error",
      "fatal",
      "silent",
    ];
    if (validLogLevels.includes(logLevel)) {
      Loggers.setLevel(logLevel);
    } else {
      logger.warn(`Invalid log level: ${logLevel}`);
      Loggers.setLevel("info");
    }
  }

  logger.trace("Parsed command line arguments:");
  logger.trace(parsedToolArgs);

  const command = parsedToolArgs._[0];
  const beforeMs = performance.now();
  await runCommand(command, parsedToolArgs, optionArgs);
  const afterMs = performance.now();
  logger.info(`Total: ${(afterMs - beforeMs).toFixed(3)} ms`);
}

async function runCommand(command: string, toolArgs: any, optionArgs: any) {
  const inputs: string[] = toolArgs.input;
  const output = toolArgs.output;
  const force = toolArgs.force;
  const parsedOptionArgs = parseOptionArgs(optionArgs);

  logger.trace(`Command line call:`);
  logger.trace(`  command: ${command}`);
  logger.trace(`  inputs: ${inputs}`);
  logger.trace(`  output: ${output}`);
  logger.trace(`  force: ${force}`);
  logger.trace(`  optionArgs: ${optionArgs}`);
  logger.trace(`  parsedOptionArgs: ${JSON.stringify(parsedOptionArgs)}`);

  const input = inputs[inputs.length - 1];

  if (command === "b3dmToGlb") {
    await ToolsMain.b3dmToGlb(input, output, force);
  } else if (command === "i3dmToGlb") {
    await ToolsMain.i3dmToGlb(input, output, force);
  } else if (command === "cmptToGlb") {
    await ToolsMain.cmptToGlb(input, output, force);
  } else if (command === "splitCmpt") {
    const recursive = toolArgs.recursive === true;
    await ToolsMain.splitCmpt(input, output, recursive, force);
  } else if (command === "convertB3dmToGlb") {
    await ToolsMain.convertB3dmToGlb(input, output, force);
  } else if (command === "convertPntsToGlb") {
    await ToolsMain.convertPntsToGlb(input, output, force);
  } else if (command === "convertI3dmToGlb") {
    await ToolsMain.convertI3dmToGlb(input, output, force);
  } else if (command === "glbToB3dm") {
    await ToolsMain.glbToB3dm(input, output, force);
  } else if (command === "glbToI3dm") {
    await ToolsMain.glbToI3dm(input, output, force);
  } else if (command === "optimizeB3dm") {
    await ToolsMain.optimizeB3dm(input, output, force, parsedOptionArgs);
  } else if (command === "optimizeI3dm") {
    await ToolsMain.optimizeI3dm(input, output, force, parsedOptionArgs);
  } else if (command === "gzip") {
    const tilesOnly = toolArgs.tilesOnly === true;
    await ToolsMain.gzip(input, output, force, tilesOnly);
  } else if (command === "ungzip") {
    await ToolsMain.ungzip(input, output, force);
  } else if (command === "tilesetToDatabase") {
    logger.info(
      `The 'tilesetToDatabase' command is deprecated. Use 'convert' instead.`
    );
    await ToolsMain.convert(input, undefined, output, force);
  } else if (command === "databaseToTileset") {
    logger.info(
      `The 'databaseToTileset' command is deprecated. Use 'convert' instead.`
    );
    await ToolsMain.convert(input, undefined, output, force);
  } else if (command === "convert") {
    await ToolsMain.convert(
      input,
      toolArgs.inputTilesetJsonFileName,
      output,
      force
    );
  } else if (command === "combine") {
    await ToolsMain.combine(input, output, force);
  } else if (command === "upgrade") {
    const targetVersion = toolArgs.targetVersion ?? "1.0";
    await ToolsMain.upgrade(
      input,
      output,
      force,
      targetVersion,
      parsedOptionArgs
    );
  } else if (command === "merge") {
    await ToolsMain.merge(inputs, output, force);
  } else if (command === "pipeline") {
    await ToolsMain.pipeline(input, force);
  } else if (command === "analyze") {
    ToolsMain.analyze(input, output, force);
  } else if (command === "createTilesetJson") {
    const cartographicPositionDegrees = validateOptionalNumberArray(
      toolArgs.cartographicPositionDegrees,
      2,
      3
    );
    await ToolsMain.createTilesetJson(
      input,
      output,
      cartographicPositionDegrees,
      force
    );
  } else {
    throw new DeveloperError(`Invalid command: ${command}`);
  }
}

async function runChecked() {
  try {
    await run();
  } catch (e: any) {
    logger.error(e);
  }
}

runChecked();

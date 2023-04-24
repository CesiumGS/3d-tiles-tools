import yargs from "yargs/yargs";

import { DeveloperError } from "./base/DeveloperError";

import { ToolsMain } from "./ToolsMain";

// Split the arguments that are intended for the tools
// and the `--options` arguments
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
    .usage("Usage: npx 3d-tiles-tools <command> [options]")
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
    })
    .command(
      "convert",
      "Convert between tilesets and tileset package formats. " +
        "The input and output can be paths to tileset JSON files, " +
        "'.3tz', or '.3dtiles' files.",
      {
        i: inputStringDefinition,
        o: outputStringDefinition,
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
      "optimizeB3dm",
      "Pass the input b3dm through gltf-pipeline. To pass options to gltf-pipeline, place them after --options. (--options -h for gltf-pipeline help)",
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
      "Pass the input i3dm through gltf-pipeline. To pass options to gltf-pipeline, place them after --options. (--options -h for gltf-pipeline help)",
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
      "Upgrades the input tileset to the latest version of the 3D Tiles spec. Embedded glTF models will be upgraded to glTF 2.0.",
      { i: inputStringDefinition, o: outputStringDefinition }
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
    .demandCommand(1)
    .strict();

  return args.argv as any;
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
  if (v.draco) {
    v.dracoOptions = v.draco;
  }
  return v;
}

const parsedToolArgs = parseToolArgs(toolArgs);

// Debug output for "Why? Args!"
/*/
console.log("Parsed command line arguments:");
console.log(parsedToolArgs);
//*/

const command = parsedToolArgs._[0];

async function run() {
  console.time("Total");
  await runCommand(command, parsedToolArgs, optionArgs);
  console.timeEnd("Total");
}

async function runCommand(command: string, toolArgs: any, optionArgs: any) {
  const inputs: string[] = toolArgs.input;
  const output = toolArgs.output;
  const force = toolArgs.force;
  const tilesOnly = toolArgs.tilesOnly;
  const parsedOptionArgs = parseOptionArgs(optionArgs);

  /*/
  console.log("command " + command);
  console.log("inputs " + inputs);
  console.log("output " + output);
  console.log("force " + force);
  console.log("optionArgs ", optionArgs);
  console.log("parsedOptionArgs ", parsedOptionArgs);
  //*/

  const input = inputs[inputs.length - 1];

  if (command === "b3dmToGlb") {
    await ToolsMain.b3dmToGlb(input, output, force);
  } else if (command === "i3dmToGlb") {
    await ToolsMain.i3dmToGlb(input, output, force);
  } else if (command === "cmptToGlb") {
    await ToolsMain.cmptToGlb(input, output, force);
  } else if (command === "glbToB3dm") {
    await ToolsMain.glbToB3dm(input, output, force);
  } else if (command === "glbToI3dm") {
    await ToolsMain.glbToI3dm(input, output, force);
  } else if (command === "optimizeB3dm") {
    await ToolsMain.optimizeB3dm(input, output, force, parsedOptionArgs);
  } else if (command === "optimizeI3dm") {
    await ToolsMain.optimizeI3dm(input, output, force, parsedOptionArgs);
  } else if (command === "gzip") {
    await ToolsMain.gzip(input, output, force, tilesOnly);
  } else if (command === "ungzip") {
    await ToolsMain.ungzip(input, output, force);
  } else if (command === "tilesetToDatabase") {
    console.log(
      `The 'tilesetToDatabase' command is deprecated. Use 'convert' instead.`
    );
    await ToolsMain.convert(input, output, force);
  } else if (command === "databaseToTileset") {
    console.log(
      `The 'databaseToTileset' command is deprecated. Use 'convert' instead.`
    );
    await ToolsMain.convert(input, output, force);
  } else if (command === "convert") {
    await ToolsMain.convert(input, output, force);
  } else if (command === "combine") {
    await ToolsMain.combine(input, output, force);
  } else if (command === "upgrade") {
    await ToolsMain.upgrade(input, output, force, parsedOptionArgs);
  } else if (command === "merge") {
    await ToolsMain.merge(inputs, output, force);
  } else if (command === "pipeline") {
    await ToolsMain.pipeline(input, force);
  } else if (command === "analyze") {
    ToolsMain.analyze(input, output, force);
  } else {
    throw new DeveloperError(`Invalid command: ${command}`);
  }
}

async function runChecked() {
  try {
    await run();
  } catch (e: any) {
    console.log(`${e}`);
  }
}

runChecked();

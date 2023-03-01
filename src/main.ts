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

const args = yargs(toolArgs)
  .usage("Usage: $0 <command> [options]")
  .help("h")
  .alias("h", "help")
  .options({
    o: {
      alias: "output",
      description: "Output path for the command.",
      global: true,
      normalize: true,
      type: "string",
      demandOption: true,
    },
    f: {
      alias: "force",
      default: false,
      description: "Output can be overwritten if it already exists.",
      global: true,
      type: "boolean",
    },
  })
  .command("tilesetToDatabase", "Create a sqlite database for a tileset.", {
    i: inputStringDefinition,
  })
  .command(
    "databaseToTileset",
    "Unpack a tileset database to a tileset folder.",
    { i: inputStringDefinition }
  )
  .command(
    "glbToB3dm",
    "Repackage the input glb as a b3dm with a basic header.",
    { i: inputStringDefinition }
  )
  .command(
    "glbToI3dm",
    "Repackage the input glb as a i3dm with a basic header.",
    { i: inputStringDefinition }
  )
  .command("b3dmToGlb", "Extract the binary glTF asset from the input b3dm.", {
    i: inputStringDefinition,
  })
  .command("i3dmToGlb", "Extract the binary glTF asset from the input i3dm.", {
    i: inputStringDefinition,
  })
  .command("cmptToGlb", "Extract the binary glTF assets from the input cmpt.", {
    i: inputStringDefinition,
  })
  .command(
    "optimizeB3dm",
    "Pass the input b3dm through gltf-pipeline. To pass options to gltf-pipeline, place them after --options. (--options -h for gltf-pipeline help)",
    {
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
      options: {
        description:
          "All arguments after this flag will be passed to gltf-pipeline as command line options.",
      },
    }
  )
  .command("gzip", "Gzips the input tileset directory.", {
    i: inputStringDefinition,
    t: {
      alias: "tilesOnly",
      default: false,
      description: "Only tile content files should be gzipped.",
      type: "boolean",
    },
  })
  .command("ungzip", "Ungzips the input tileset directory.", {
    i: inputStringDefinition,
  })
  .command(
    "combine",
    "Combines all external tilesets into a single tileset.json file.",
    { i: inputStringDefinition }
  )
  .command(
    "merge",
    "Merge any number of tilesets together into a single tileset.",
    { i: inputArrayDefinition }
  )
  .command(
    "upgrade",
    "Upgrades the input tileset to the latest version of the 3D Tiles spec. Embedded glTF models will be upgraded to glTF 2.0.",
    { i: inputStringDefinition }
  )
  .demandCommand(1)
  .strict();

const argv = args.argv as any;

// Debug output for "Why? Args!"
/*/
console.log("Parsed command line arguments:");
console.log(argv);
//*/

const command = argv._[0];

async function run() {
  console.time("Total");
  await runCommand(command, argv, optionArgs);
  console.timeEnd("Total");
}

async function runCommand(command: string, toolArgs: any, optionArgs: any) {
  const inputs: string[] = toolArgs.input;
  const output = toolArgs.output;
  const force = toolArgs.force;
  const tilesOnly = toolArgs.tilesOnly;

  /*/
  console.log("command " + command);
  console.log("inputs " + inputs);
  console.log("output " + output);
  console.log("force " + force);
  console.log("optionArgs ", optionArgs);
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
    await ToolsMain.optimizeB3dm(input, output, force, optionArgs);
  } else if (command === "optimizeI3dm") {
    await ToolsMain.optimizeI3dm(input, output, force, optionArgs);
  } else if (command === "gzip") {
    await ToolsMain.gzip(input, output, force, tilesOnly);
  } else if (command === "ungzip") {
    await ToolsMain.ungzip(input, output, force);
  } else if (command === "tilesetToDatabase") {
    await ToolsMain.tilesetToDatabase(input, output, force);
  } else if (command === "databaseToTileset") {
    await ToolsMain.databaseToTileset(input, output, force);
  } else if (command === "combine") {
    await ToolsMain.combine(input, output, force);
  } else if (command === "upgrade") {
    await ToolsMain.upgrade(input, output, force);
  } else if (command === "merge") {
    await ToolsMain.merge(inputs, output, force);
  } else {
    throw new DeveloperError(`Invalid command: ${command}`);
  }
}

run();

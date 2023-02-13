//eslint-disable-next-line
const yargs = require("yargs/yargs");

// Split the arguments that are intended for the tools
// and the `--options` arguments
const optionsIndex = process.argv.indexOf("--options");
let toolArgs;
let optionArgs : string[];
if (optionsIndex < 0) {
  toolArgs = process.argv.slice(2);
  optionArgs = [];
} else {
  toolArgs = process.argv.slice(2, optionsIndex);
  optionArgs = process.argv.slice(optionsIndex + 1);
}

const args = yargs(toolArgs)
  .usage("Usage: $0 <command> [options]")
  .help("h")
  .alias("h", "help")
  .options({
    i: {
      alias: "input",
      description: "Input path for the command.",
      global: true,
      normalize: true,
      type: "string",
      demandOptions: true,
    },
    o: {
      alias: "output",
      description: "Output path for the command.",
      global: true,
      normalize: true,
      type: "string",
    },
    f: {
      alias: "force",
      default: false,
      description: "Output can be overwritten if it already exists.",
      global: true,
      type: "boolean",
    },
  })
  .command("tilesetToDatabase", "Create a sqlite database for a tileset.")
  .command(
    "databaseToTileset",
    "Unpack a tileset database to a tileset folder."
  )
  .command(
    "glbToB3dm",
    "Repackage the input glb as a b3dm with a basic header."
  )
  .command(
    "glbToI3dm",
    "Repackage the input glb as a i3dm with a basic header."
  )
  .command("b3dmToGlb", "Extract the binary glTF asset from the input b3dm.")
  .command("i3dmToGlb", "Extract the binary glTF asset from the input i3dm.")
  .command("cmptToGlb", "Extract the binary glTF assets from the input cmpt.")
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
      options: {
        description:
          "All arguments after this flag will be passed to gltf-pipeline as command line options.",
      },
    }
  )
  .command("gzip", "Gzips the input tileset directory.", {
    t: {
      alias: "tilesOnly",
      default: false,
      description:
        "Only tile files (.b3dm, .i3dm, .pnts, .vctr) should be gzipped.",
      type: "boolean",
    },
  })
  .command("ungzip", "Ungzips the input tileset directory.")
  .command(
    "combine",
    "Combines all external tilesets into a single tileset.json file.",
    {
      i: {
        alias: "input",
        description:
          "Relative path to the folder containing the root tileset.json file.",
        normalize: true,
        type: "string",
        demandOption: true,
      },
    }
  )
  .command(
    "merge",
    "Merge any number of tilesets together into a single tileset.",
    {
      i: {
        alias: "input",
        description:
          "Input tileset directories. Multiple directories may be supplied by repeating the -i flag.",
        normalize: true,
        type: "array",
        demandOption: true,
      },
    }
  )
  .command(
    "upgrade",
    "Upgrades the input tileset to the latest version of the 3D Tiles spec. Embedded glTF models will be upgraded to glTF 2.0."
  )
  .demand(1)
  .strict();

const argv = args.argv;
console.log(argv);
const command = argv._[0];

async function run() {
  console.time("Total");
  await runCommand(command, argv.input, argv.output, argv.force, optionArgs);
  console.timeEnd("Total");
}
async function runCommand(
  command: string,
  input: string,
  output: string,
  force: boolean,
  optionArgs: any
) {
  console.log("command " + command);
  console.log("input " + input);
  console.log("output " + output);
  console.log("force " + force);
  console.log("optionArgs ", optionArgs);
}

run();
